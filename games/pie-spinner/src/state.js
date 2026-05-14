// Bug-Bug's Pie Spinner — state, constants, simulation tick.
// Single owner (main.js rAF loop) mutates state in place; render reads only.

export const VIEW = { W: 960, H: 700 };

// --- Pie chart (centre-left, the visualisation being filled in) ---
export const PIE = { cx: 290, cy: 320, r: 165 };

// 4 slices, sum = 100, each tagged with its colour for the "alive" state.
// Order = clockwise from 12 o'clock.
export const SLICE_DEFS = [
  { value: 45, color: "#FF6A1A", label: "45%" }, // orange
  { value: 25, color: "#FFC500", label: "25%" }, // gold
  { value: 20, color: "#2BB673", label: "20%" }, // green
  { value: 10, color: "#5DC1E8", label: "10%" }, // sky blue
];

// --- Spinner wheel (right) ---
export const WHEEL = { cx: 700, cy: 320, r: 175 };
// 8 wedges, 45° each. Order goes clockwise from 12 o'clock.
// Matches (45, 25, 20, 10) are scattered so adjacent wedges aren't all hits.
export const WEDGES = [45, 10, 60, 25, 90, 20, 75, 30];
export const WEDGE_COUNT = WEDGES.length;
export const WEDGE_DEG = 360 / WEDGE_COUNT;

// Wedge background palette — alternating, with match values getting brighter tints.
export const WEDGE_FILLS = ["#FFF7E2", "#FFE0A8", "#FFF7E2", "#FFE0A8", "#FFF7E2", "#FFE0A8", "#FFF7E2", "#FFE0A8"];

// --- Game rules ---
export const MAX_SPINS = 8;

// --- Spinner physics ---
const SPIN_DUR_MS_MIN = 2800;
const SPIN_DUR_MS_VAR = 900;
const SPIN_REVS_MIN = 3;
const SPIN_REVS_VAR = 3;

// --- Cheer / feedback timers ---
export const CHEER_MS = 1400;
const RESULT_FLASH_MS = 1100;
const RESULT_FLASH_MS_LONG = 1900;   // already-lit and miss linger longer so the message can be read

export function createGame() {
  return {
    phase: "playing",          // "playing" | "ended"
    outcome: null,             // "win" | "lose" | null

    // Pie slices — lit flips true when matched.
    slices: SLICE_DEFS.map((s) => ({ ...s, lit: false, justLitMs: 0 })),

    // Spinner state
    angle: 0,                  // accumulated rotation, degrees clockwise
    spinning: false,
    spinStart: 0,
    spinDelta: 0,
    spinElapsed: 0,
    spinDuration: 0,
    spinTargetIdx: 0,          // wedge index that will land at pointer

    // Round bookkeeping
    spinsUsed: 0,
    lastResult: null,          // { wedgeIdx, value, matchedSliceIdx } | null
    resultFlashMs: 0,
    cheerMs: 0,

    // Counters increment to let main.js play sounds on transitions.
    spinStarts: 0,
    matchEvents: 0,
    missEvents: 0,
    alreadyLitEvents: 0,
  };
}

export function allLit(state) {
  for (const s of state.slices) if (!s.lit) return false;
  return true;
}

// ---------- Actions ----------

export function startSpin(state) {
  if (state.phase !== "playing") return state;
  if (state.spinning) return state;
  if (state.spinsUsed >= MAX_SPINS) return state;

  // Pick where the wheel will land. Pure-random target wedge.
  const targetIdx = Math.floor(Math.random() * WEDGE_COUNT);

  // Compute total clockwise rotation: a few full revolutions plus the
  // offset needed to leave wedge[targetIdx] under the pointer.
  const cur = ((state.angle % 360) + 360) % 360;
  const targetAngle = ((-targetIdx * WEDGE_DEG) % 360 + 360) % 360;
  let delta = (targetAngle - cur + 360) % 360;
  delta += 360 * (SPIN_REVS_MIN + Math.floor(Math.random() * SPIN_REVS_VAR));

  state.spinning = true;
  state.spinStart = state.angle;
  state.spinDelta = delta;
  state.spinElapsed = 0;
  state.spinDuration = SPIN_DUR_MS_MIN + Math.random() * SPIN_DUR_MS_VAR;
  state.spinTargetIdx = targetIdx;
  state.resultFlashMs = 0;
  state.cheerMs = 0;
  state.spinStarts += 1;
  return state;
}

// ---------- Tick ----------

export function tick(state, dtMs) {
  if (state.phase !== "playing") {
    decayTimers(state, dtMs);
    return state;
  }

  if (state.spinning) {
    state.spinElapsed += dtMs;
    const t = Math.min(1, state.spinElapsed / state.spinDuration);
    // ease-out-cubic
    const eased = 1 - Math.pow(1 - t, 3);
    state.angle = state.spinStart + state.spinDelta * eased;
    if (t >= 1) {
      state.angle = state.spinStart + state.spinDelta;
      state.spinning = false;
      resolveSpin(state);
    }
  }

  decayTimers(state, dtMs);
  return state;
}

function decayTimers(state, dtMs) {
  if (state.resultFlashMs > 0) state.resultFlashMs = Math.max(0, state.resultFlashMs - dtMs);
  if (state.cheerMs > 0) state.cheerMs = Math.max(0, state.cheerMs - dtMs);
  for (const s of state.slices) {
    if (s.justLitMs > 0) s.justLitMs = Math.max(0, s.justLitMs - dtMs);
  }
}

function resolveSpin(state) {
  const wedgeIdx = state.spinTargetIdx;
  const value = WEDGES[wedgeIdx];
  state.spinsUsed += 1;

  // Find a slice with this value. Distinguish "match" (unlit) from "already lit".
  let matchedSliceIdx = -1;
  let alreadyLitSliceIdx = -1;
  for (let i = 0; i < state.slices.length; i++) {
    if (state.slices[i].value !== value) continue;
    if (state.slices[i].lit) alreadyLitSliceIdx = i;
    else { matchedSliceIdx = i; break; }
  }
  const alreadyLit = matchedSliceIdx < 0 && alreadyLitSliceIdx >= 0;

  state.lastResult = { wedgeIdx, value, matchedSliceIdx, alreadyLit };
  state.resultFlashMs = matchedSliceIdx >= 0 ? RESULT_FLASH_MS : RESULT_FLASH_MS_LONG;

  if (matchedSliceIdx >= 0) {
    state.slices[matchedSliceIdx].lit = true;
    state.slices[matchedSliceIdx].justLitMs = 700;
    state.cheerMs = CHEER_MS;
    state.matchEvents += 1;
  } else if (alreadyLit) {
    state.alreadyLitEvents += 1;
  } else {
    state.missEvents += 1;
  }

  if (allLit(state)) {
    state.phase = "ended";
    state.outcome = "win";
  } else if (state.spinsUsed >= MAX_SPINS) {
    state.phase = "ended";
    state.outcome = "lose";
  }
}

// ---------- Scoring ----------

/** Stars from spins used in a winning run. 1-3 stars. */
export function starsForWin(spinsUsed) {
  if (spinsUsed <= 5) return 3;
  if (spinsUsed <= 6) return 2;
  return 1;
}
