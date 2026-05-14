// Bug-Bug's Bubble Catcher — state, constants, simulation tick.
// rAF loop owns mutation; render only reads.

export const VIEW = { W: 960, H: 700 };

// --- Sketched bubble-chart slots (centre of stage) ---
// 5 slots packed in a Tableau-style cluster: largest at centre with smaller
// bubbles tucked around it. Sizes vary clearly (S/M/L) so a falling bubble's
// size disambiguates which slot it's heading for when columns visually overlap.
// id = number label (1..5). x is the column the matching bubble falls in.
// IDs are deliberately scrambled across positions (4 / 2 / 5 / 1 / 3) so the
// player has to read each slot's badge instead of relying on a left-to-right
// 1..5 pattern.
export const SLOTS = [
  { id: 4, x: 235, y: 305, r: 38, color: "#FF6A1A" },  // orange  M  — upper-left,  labelled 4
  { id: 2, x: 350, y: 365, r: 58, color: "#FFC500" },  // gold    L  — central,     labelled 2
  { id: 5, x: 275, y: 440, r: 24, color: "#2BB673" },  // green   S  — lower-left,  labelled 5
  { id: 1, x: 475, y: 355, r: 46, color: "#5DC1E8" },  // sky     M+ — upper-right, labelled 1
  { id: 3, x: 530, y: 440, r: 28, color: "#D44A00" },  // deep-or S+ — lower-right, labelled 3
];

// Spawn lane y-line (top of stage). Bubbles drop straight down through this column.
export const SPAWN_Y = -40;

// Chart "data area" — the framed region where bubbles live. Axes are drawn
// along its left (Y) and bottom (X) edges. Chosen to comfortably enclose all
// slot rings with a little breathing room on every side.
export const CHART_AREA = { left: 130, right: 640, top: 215, bottom: 515 };
// Tick values shown on each axis. Linearly mapped from CHART_AREA bounds.
export const CHART_AXIS_TICKS = [0, 25, 50, 75, 100];

// Catch zone is a +/- band around the slot's centre y. A bubble is catchable
// while its centre lies in [slot.y - CATCH_RANGE, slot.y + CATCH_RANGE].
export const CATCH_RANGE = 26;

// Bottom of stage — bubble passes here = miss.
export const FLOOR_Y = VIEW.H + 60;

// --- Bug-Bug + strings ---
// Five strings hang from the top of the stage right of the chart. Bug-Bug
// slides along the floor underneath them, parking under whichever string was
// most recently pulled.
export const STRINGS_TOP_Y = 30;
export const STRINGS_BOTTOM_Y = 500;        // rest length of each string
export const STRINGS_X = [725, 765, 805, 845, 885]; // 5 strings, evenly spaced
export const BUG_Y = 610;                   // fixed Bug-Bug vertical position
export const BUG_EASE_TAU_MS = 90;          // characteristic time for slide easing
export const BUG_INITIAL_X = STRINGS_X[2];  // start under the middle string

// --- Game rules ---
export const MAX_MISSES = 3;

// Speed levels. Each level scales fall velocity, spawn cadence and round
// length. The Tableau-for-Kids audience needs a forgiving Easy and a punchy
// Hard. Medium matches the original tuning.
//   fallVStart/fallVEnd:    falling speed at round start / round end (px/s)
//   spawnMinStart/MaxStart: random spawn interval at round start (ms)
//   spawnMinEnd/MaxEnd:     random spawn interval at round end   (ms)
//   roundMs:                soft time limit before the round auto-ends as a loss
export const DIFFICULTIES = {
  easy:   { key: "easy",   label: "EASY",   icon: "🐢", fallVStart: 70,  fallVEnd: 110, spawnMinStart: 3000, spawnMaxStart: 3800, spawnMinEnd: 1900, spawnMaxEnd: 2500, roundMs: 75_000 },
  medium: { key: "medium", label: "MEDIUM", icon: "🫧", fallVStart: 110, fallVEnd: 175, spawnMinStart: 2200, spawnMaxStart: 3000, spawnMinEnd: 1100, spawnMaxEnd: 1700, roundMs: 60_000 },
  hard:   { key: "hard",   label: "HARD",   icon: "⚡", fallVStart: 160, fallVEnd: 235, spawnMinStart: 1500, spawnMaxStart: 2100, spawnMinEnd: 650,  spawnMaxEnd: 1050, roundMs: 50_000 },
};
export const DIFFICULTY_ORDER = ["easy", "medium", "hard"];
export const DEFAULT_DIFFICULTY = "medium";

// Flash / pull timers
export const PULL_MS = 260;                  // how long the pull-down animation lasts
export const FLASH_OK_MS = 800;
export const FLASH_MISS_MS = 700;
export const CHEER_MS = 1100;

// ---------- Factory ----------

export function createGame(difficultyKey = DEFAULT_DIFFICULTY) {
  const config = DIFFICULTIES[difficultyKey] || DIFFICULTIES[DEFAULT_DIFFICULTY];
  return {
    phase: "playing",          // "playing" | "ended"
    outcome: null,             // "win" | "lose" | null

    // Difficulty selection. `config` is a snapshot so the running round is
    // unaffected if the menu changes mid-flight.
    difficulty: config.key,
    config,

    // Slot fill state. slots[i].filled flips true when its bubble snaps in.
    slots: SLOTS.map((s) => ({ ...s, filled: false, justFilledMs: 0 })),

    // Active falling bubbles. Each: { id, slotId, x, y, r, color, alive }
    bubbles: [],
    nextBubbleId: 1,
    spawnTimerMs: 600,         // small initial delay before first bubble

    // String pull animations. Indexed by slotId-1 (0..4).
    stringPullMs: [0, 0, 0, 0, 0],

    // Bug-Bug's current x (slides toward bugTargetX over time).
    bugX: BUG_INITIAL_X,
    bugTargetX: BUG_INITIAL_X,

    // Bookkeeping
    elapsedMs: 0,
    misses: 0,
    catches: 0,
    cheerMs: 0,

    // Flash chip — feedback at top of stage
    flashMs: 0,
    flashKind: null,            // "ok" | "miss" | "wrong"
    flashText: "",

    // Counters increment so main.js can fire SFX on transitions.
    catchEvents: 0,
    missEvents: 0,
    wrongPullEvents: 0,
    pressEvents: 0,
  };
}

export function allFilled(state) {
  for (const s of state.slots) if (!s.filled) return false;
  return true;
}

// ---------- Helpers (internal) ----------

function lerp(a, b, t) { return a + (b - a) * t; }

function progress(state) {
  return Math.min(1, state.elapsedMs / state.config.roundMs);
}

function pickNextSlotId(state) {
  const unfilled = state.slots.filter((s) => !s.filled);
  if (unfilled.length === 0) return null;
  // Don't spawn two bubbles for the same slot simultaneously.
  const busy = new Set(state.bubbles.map((b) => b.slotId));
  const candidates = unfilled.filter((s) => !busy.has(s.id));
  const pool = candidates.length ? candidates : unfilled;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function spawnBubble(state) {
  const slotId = pickNextSlotId(state);
  if (slotId == null) return;
  const slot = state.slots.find((s) => s.id === slotId);
  state.bubbles.push({
    id: state.nextBubbleId++,
    slotId,
    x: slot.x,
    y: SPAWN_Y,
    r: slot.r,
    color: slot.color,
    alive: true,
  });
  // Reschedule next spawn.
  const p = progress(state);
  const c = state.config;
  const min = lerp(c.spawnMinStart, c.spawnMinEnd, p);
  const max = lerp(c.spawnMaxStart, c.spawnMaxEnd, p);
  state.spawnTimerMs = min + Math.random() * (max - min);
}

// ---------- Actions ----------

/** Player pulled string `stringId` (1..5). Resolve against active bubbles. */
export function pullString(state, stringId) {
  if (state.phase !== "playing") return state;
  const idx = stringId - 1;
  if (idx < 0 || idx >= state.stringPullMs.length) return state;

  state.stringPullMs[idx] = PULL_MS;
  state.pressEvents += 1;
  state.bugTargetX = STRINGS_X[idx];

  // Look for an active bubble currently in the catch window of this slot.
  const slot = state.slots.find((s) => s.id === stringId);
  if (!slot || slot.filled) {
    flash(state, "wrong", "✕  EMPTY STRING");
    state.wrongPullEvents += 1;
    return state;
  }

  let catchIdx = -1;
  let bestDy = Infinity;
  for (let i = 0; i < state.bubbles.length; i++) {
    const b = state.bubbles[i];
    if (!b.alive) continue;
    if (b.slotId !== stringId) continue;
    const dy = Math.abs(b.y - slot.y);
    if (dy <= CATCH_RANGE && dy < bestDy) {
      bestDy = dy;
      catchIdx = i;
    }
  }

  if (catchIdx >= 0) {
    const b = state.bubbles[catchIdx];
    b.alive = false; // remove next tick
    slot.filled = true;
    slot.justFilledMs = 700;
    state.catches += 1;
    state.catchEvents += 1;
    state.cheerMs = CHEER_MS;
    flash(state, "ok", `✓  SNAPPED #${slot.id}`);
    // Remove the bubble from the active list right away.
    state.bubbles.splice(catchIdx, 1);

    if (allFilled(state)) {
      state.phase = "ended";
      state.outcome = "win";
    }
  } else {
    flash(state, "wrong", `✕  STRING #${stringId}`);
    state.wrongPullEvents += 1;
  }

  return state;
}

function flash(state, kind, text) {
  state.flashKind = kind;
  state.flashText = text;
  state.flashMs = kind === "ok" ? FLASH_OK_MS : FLASH_MISS_MS;
}

// ---------- Tick ----------

export function tick(state, dtMs) {
  if (state.phase !== "playing") {
    decayTimers(state, dtMs);
    return state;
  }

  state.elapsedMs += dtMs;

  // Spawn pacing
  state.spawnTimerMs -= dtMs;
  if (state.spawnTimerMs <= 0 && state.slots.some((s) => !s.filled)) {
    spawnBubble(state);
  }

  // Move bubbles
  const v = lerp(state.config.fallVStart, state.config.fallVEnd, progress(state));
  const dSec = dtMs / 1000;
  for (let i = state.bubbles.length - 1; i >= 0; i--) {
    const b = state.bubbles[i];
    b.y += v * dSec;
    if (b.y > FLOOR_Y) {
      state.bubbles.splice(i, 1);
      state.misses += 1;
      state.missEvents += 1;
      flash(state, "miss", `✕  MISSED #${b.slotId}`);
    }
  }

  // Slide Bug-Bug toward his target string (exponential ease).
  if (state.bugX !== state.bugTargetX) {
    const a = 1 - Math.exp(-dtMs / BUG_EASE_TAU_MS);
    const next = state.bugX + (state.bugTargetX - state.bugX) * a;
    state.bugX = Math.abs(next - state.bugTargetX) < 0.25 ? state.bugTargetX : next;
  }

  // Round end checks
  if (state.misses >= MAX_MISSES) {
    state.phase = "ended";
    state.outcome = "lose";
  } else if (state.elapsedMs >= state.config.roundMs && !allFilled(state)) {
    state.phase = "ended";
    state.outcome = "lose";
  }

  decayTimers(state, dtMs);
  return state;
}

function decayTimers(state, dtMs) {
  if (state.cheerMs > 0) state.cheerMs = Math.max(0, state.cheerMs - dtMs);
  if (state.flashMs > 0) state.flashMs = Math.max(0, state.flashMs - dtMs);
  for (let i = 0; i < state.stringPullMs.length; i++) {
    if (state.stringPullMs[i] > 0) state.stringPullMs[i] = Math.max(0, state.stringPullMs[i] - dtMs);
  }
  for (const s of state.slots) {
    if (s.justFilledMs > 0) s.justFilledMs = Math.max(0, s.justFilledMs - dtMs);
  }
}

// ---------- Scoring ----------

/** Stars from fraction of round remaining at win. 1–3 stars, calibrated per level. */
export function starsForWin(elapsedMs, roundMs) {
  const frac = (roundMs - elapsedMs) / roundMs;
  if (frac >= 0.55) return 3;
  if (frac >= 0.25) return 2;
  return 1;
}
