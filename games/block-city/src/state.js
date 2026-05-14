// Bug-Bug's Block City — state shape, constants, and simulation tick.
// State is mutated in place by tick() since this is a real-time game with
// a single owner (main.js's rAF loop). Pure-ish: tick() returns the same
// state reference. Render reads only; never writes.

// ---------- Layout constants (SVG coordinate space) ----------

export const VIEW = { W: 900, H: 620 };

// Axis takes the left 80px. Play area starts at x=80.
export const AXIS_W = 80;
export const PLAY_LEFT = AXIS_W;
export const PLAY_RIGHT = VIEW.W - 20;
export const PLAY_W = PLAY_RIGHT - PLAY_LEFT;

// Vertical: ground line at y=540, top of axis (max floor) at y=80.
export const GROUND_Y = 540;
export const TOP_Y = 80;
export const FLOOR_H = (GROUND_Y - TOP_Y) / 10; // 46 px per floor (max 10 floors)
export const FLOOR_W = 64;

export const PLOT_COUNT = 4;
export const PLOT_WIDTH = PLAY_W / PLOT_COUNT;

// X-centre of each plot (where its blocks stack and Bug-Bug stands to deliver).
export function plotCenterX(i) {
  return PLAY_LEFT + PLOT_WIDTH * (i + 0.5);
}

// Bug-Bug body
export const BUG_W = 78;
export const BUG_H = 60;
export const BUG_Y = GROUND_Y - BUG_H / 2 + 6; // sits on the ground line
export const BUG_SPEED = 540; // px/sec horizontal

// Carry capacity (fixed across difficulties for now).
export const CARRY_MAX = 4;
export const LATE_AT_MS = 30000;

// ---------- Difficulty presets ----------

export const DIFFICULTIES = {
  easy: {
    key: "easy",
    label: "EASY",
    emoji: "🐢",
    hint: "75s · slow blocks",
    timeLimitMs: 75000,
    spawnStartMs: 1500,
    spawnLateMs: 1000,
    fallStartPxs: 160,
    fallLatePxs: 220,
    star3TimeMs: 60000,
    star2MaxDemos: 2,
  },
  normal: {
    key: "normal",
    label: "NORMAL",
    emoji: "🐞",
    hint: "60s · balanced",
    timeLimitMs: 60000,
    spawnStartMs: 1100,
    spawnLateMs: 700,
    fallStartPxs: 220,
    fallLatePxs: 320,
    star3TimeMs: 45000,
    star2MaxDemos: 2,
  },
  fast: {
    key: "fast",
    label: "FAST",
    emoji: "⚡",
    hint: "50s · fast blocks",
    timeLimitMs: 50000,
    spawnStartMs: 800,
    spawnLateMs: 500,
    fallStartPxs: 280,
    fallLatePxs: 420,
    star3TimeMs: 35000,
    star2MaxDemos: 2,
  },
};

export const DIFFICULTY_ORDER = ["easy", "normal", "fast"];

// Default level
const LEVEL_1_TARGETS = [3, 7, 5, 9];

// ---------- State factory ----------

export function createGame(difficultyKey = "normal") {
  const settings = DIFFICULTIES[difficultyKey] || DIFFICULTIES.normal;
  const targets = LEVEL_1_TARGETS.slice();
  return {
    phase: "playing", // "playing" | "ended"
    outcome: null,    // "win" | "lose"
    stars: 0,

    difficulty: settings.key,
    settings,

    targets,
    built: targets.map(() => 0),

    carried: 0,
    bugX: PLAY_LEFT + PLAY_W / 2,
    bugTargetX: PLAY_LEFT + PLAY_W / 2,
    bugFacing: 1, // 1 right, -1 left

    falling: [],     // {id, x, y, vy}
    nextSpawnMs: 600,

    elapsedMs: 0,
    timeLeftMs: settings.timeLimitMs,

    blocksCaught: 0,
    blocksMissed: 0,
    demolitions: 0,

    // Keyboard movement state (held by main.js's keydown/keyup listeners)
    kbDirL: false,
    kbDirR: false,

    _nextBlockId: 1,
  };
}

// ---------- Queries ----------

export function plotLocked(state, i) {
  return state.built[i] === state.targets[i];
}

export function plotOverbuilt(state, i) {
  return state.built[i] > state.targets[i];
}

export function allDone(state) {
  for (let i = 0; i < state.targets.length; i++) {
    if (state.built[i] !== state.targets[i]) return false;
  }
  return true;
}

export function currentSpawnInterval(state) {
  const t = Math.min(1, state.elapsedMs / LATE_AT_MS);
  const { spawnStartMs, spawnLateMs } = state.settings;
  return spawnStartMs + (spawnLateMs - spawnStartMs) * t;
}

export function currentFallSpeed(state) {
  const t = Math.min(1, state.elapsedMs / LATE_AT_MS);
  const { fallStartPxs, fallLatePxs } = state.settings;
  return fallStartPxs + (fallLatePxs - fallStartPxs) * t;
}

// ---------- Actions ----------

/** Click on a plot column: walk Bug-Bug there. Deposit on arrival is in tick(). */
export function walkToPlot(state, i) {
  if (state.phase !== "playing") return state;
  state.bugTargetX = plotCenterX(i);
  state._pendingDeposit = i;
  return state;
}

/** Click on bare ground: walk to that X (clamped). No deposit. */
export function walkToX(state, x) {
  if (state.phase !== "playing") return state;
  const clamped = Math.max(PLAY_LEFT + BUG_W / 2, Math.min(PLAY_RIGHT - BUG_W / 2, x));
  state.bugTargetX = clamped;
  state._pendingDeposit = null;
  return state;
}

/** Demolish 1 floor from a plot (only valid when over target). */
export function demolish(state, i) {
  if (state.phase !== "playing") return state;
  if (state.built[i] <= state.targets[i]) return state;
  state.built[i] -= 1;
  state.demolitions += 1;
  return state;
}

/** Drop all carried blocks at plot i immediately. Bug-Bug stays put. */
export function instantDrop(state, i) {
  if (state.phase !== "playing") return state;
  if (state.carried <= 0) return state;
  if (i < 0 || i >= state.targets.length) return state;
  state.built[i] += state.carried;
  state.carried = 0;
  return state;
}

/** Set keyboard movement flag. dir is "left" or "right". */
export function setKeyboardMove(state, dir, pressed) {
  if (state.phase !== "playing") return state;
  if (dir === "left") state.kbDirL = !!pressed;
  else if (dir === "right") state.kbDirR = !!pressed;
  // Any keyboard activity cancels a pending click-deposit
  if (pressed) state._pendingDeposit = null;
  return state;
}

// ---------- Tick ----------

/**
 * Advance the simulation by dtMs.
 * Mutates and returns the same state object.
 */
export function tick(state, dtMs) {
  if (state.phase !== "playing") return state;
  const dt = dtMs / 1000;

  // Time
  state.elapsedMs += dtMs;
  state.timeLeftMs = Math.max(0, state.settings.timeLimitMs - state.elapsedMs);

  // Move Bug-Bug. Keyboard movement (if any) overrides click-targeting.
  const kbDir = (state.kbDirR ? 1 : 0) - (state.kbDirL ? 1 : 0);
  if (kbDir !== 0) {
    const step = BUG_SPEED * dt * kbDir;
    const minX = PLAY_LEFT + BUG_W / 2;
    const maxX = PLAY_RIGHT - BUG_W / 2;
    state.bugX = Math.max(minX, Math.min(maxX, state.bugX + step));
    state.bugTargetX = state.bugX;
    state._pendingDeposit = null;
    state.bugFacing = kbDir > 0 ? 1 : -1;
  } else {
    const dx = state.bugTargetX - state.bugX;
    const stepX = BUG_SPEED * dt;
    if (Math.abs(dx) <= stepX) {
      state.bugX = state.bugTargetX;
      if (state._pendingDeposit != null) {
        deliverTo(state, state._pendingDeposit);
        state._pendingDeposit = null;
      }
    } else {
      state.bugX += Math.sign(dx) * stepX;
      state.bugFacing = Math.sign(dx) || state.bugFacing;
    }
  }

  // Spawn falling blocks
  state.nextSpawnMs -= dtMs;
  if (state.nextSpawnMs <= 0) {
    spawnBlock(state);
    state.nextSpawnMs = currentSpawnInterval(state);
  }

  // Advance falling blocks
  const fallSpeed = currentFallSpeed(state);
  const survivors = [];
  for (const b of state.falling) {
    b.y += fallSpeed * dt;
    // Catch check: block bottom reaches bug's vertical band AND x overlaps bug body.
    const blockBottom = b.y + 40;
    if (
      blockBottom >= BUG_Y - BUG_H / 2 + 8 &&
      blockBottom <= BUG_Y + BUG_H / 2 + 6 &&
      Math.abs(b.x - state.bugX) < BUG_W / 2 + 4
    ) {
      // Caught (or dropped if over capacity)
      if (state.carried < CARRY_MAX) {
        state.carried += 1;
        state.blocksCaught += 1;
      }
      continue; // remove
    }
    // Missed (hit ground)
    if (b.y > GROUND_Y + 20) {
      state.blocksMissed += 1;
      continue;
    }
    survivors.push(b);
  }
  state.falling = survivors;

  // End conditions
  if (allDone(state)) endGame(state, "win");
  else if (state.timeLeftMs === 0) endGame(state, "lose");

  return state;
}

function spawnBlock(state) {
  // Spawn within the plot zone so blocks always land where the bug can reach.
  const margin = 30;
  const x = PLAY_LEFT + margin + Math.random() * (PLAY_W - margin * 2);
  state.falling.push({ id: state._nextBlockId++, x, y: -40, vy: 0 });
}

function deliverTo(state, i) {
  if (state.carried <= 0) return;
  // Deposit ALL carried blocks (can overshoot target).
  state.built[i] += state.carried;
  state.carried = 0;
}

function endGame(state, outcome) {
  state.phase = "ended";
  state.outcome = outcome;
  if (outcome !== "win") {
    state.stars = 0;
    return;
  }
  const { star3TimeMs, star2MaxDemos } = state.settings;
  if (state.demolitions === 0 && state.elapsedMs <= star3TimeMs) state.stars = 3;
  else if (state.demolitions <= star2MaxDemos) state.stars = 2;
  else state.stars = 1;
}
