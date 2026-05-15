// State machine for Bug-Bug's Mountain Climb.
// Pure functions only — no DOM, no side effects.
//
// New mechanic (Series 1 redesign): the player has a FIXED stamina
// budget for the whole climb and cannot rest to refill it. Storms
// force an automatic rest day. The puzzle is: which non-storm days
// to spend extra stamina on (sprint) for the +10m sunny bonus.

import { seedFromString, mulberry32, intBetween } from "./rng.js";

// ---------- Game balance constants ----------

export const SUMMIT = 400;            // metres
export const TOTAL_DAYS = 10;
export const STARTING_STAMINA = 9;    // fixed budget — no regeneration
export const MAX_STAMINA = STARTING_STAMINA;

/** Action → altitude gain range and stamina cost. */
export const ACTIONS = {
  climb:  { altMin: 45, altMax: 55,  staminaDelta: -1, emoji: "🥾", label: "CLIMB"  },
  sprint: { altMin: 90, altMax: 110, staminaDelta: -2, emoji: "⚡", label: "SPRINT" },
  // 'rest' is only triggered automatically on storm days.
  rest:   { altMin: 0,  altMax: 0,   staminaDelta:  0, emoji: "🛌", label: "REST"   },
};

/** Weather → altitude modifier (sunny pays a +10m bonus). */
export const WEATHER_MOD = { sunny: +10, cloudy: 0, storm: 0 };

// ---------- Handcrafted weather pool ----------
// Each entry is a 10-day sequence with EXACTLY:
//   3 sunny  (great days to sprint — +10m bonus)
//   4 cloudy (normal days)
//   3 storm  (forced rest — player can't act)
// 7 active days × 1 stamina min = 7 needed; 9 budget → max 2 sprints.

const WEATHER_POOL = [
  // 1. "Sunny opening" — sprint chances come early
  ["sunny", "sunny", "cloudy", "storm", "cloudy", "sunny", "cloudy", "storm", "storm", "cloudy"],
  // 2. "Storm in the middle"
  ["sunny", "cloudy", "storm", "sunny", "cloudy", "storm", "sunny", "cloudy", "cloudy", "storm"],
  // 3. "Late sprinter" — sunny days arrive late
  ["storm", "cloudy", "cloudy", "storm", "cloudy", "cloudy", "sunny", "sunny", "storm", "sunny"],
  // 4. "Clustered sunny" — easy decision if you spot it
  ["cloudy", "storm", "cloudy", "sunny", "sunny", "cloudy", "storm", "cloudy", "sunny", "storm"],
  // 5. "Storm crisis" — two storms right at the start
  ["storm", "storm", "sunny", "cloudy", "cloudy", "sunny", "cloudy", "sunny", "storm", "cloudy"],
  // 6. "Spread sunny" — flexible sprint timing
  ["sunny", "cloudy", "storm", "cloudy", "sunny", "storm", "cloudy", "sunny", "cloudy", "storm"],
  // 7. "Drama" — storms back to back, then sunny pair
  ["cloudy", "sunny", "storm", "storm", "sunny", "cloudy", "cloudy", "sunny", "cloudy", "storm"],
  // 8. "Cloudy plod"
  ["cloudy", "sunny", "cloudy", "storm", "cloudy", "sunny", "storm", "cloudy", "sunny", "storm"],
  // 9. "Storm bookends"
  ["storm", "sunny", "cloudy", "cloudy", "sunny", "cloudy", "storm", "sunny", "cloudy", "storm"],
  // 10. "Stormy finish"
  ["storm", "cloudy", "sunny", "sunny", "cloudy", "sunny", "cloudy", "storm", "cloudy", "storm"],
];

// ---------- State factory ----------

/**
 * Create a fresh GameState for a given 4-char seed code.
 * @param {string} seedCode
 */
export function createGame(seedCode) {
  const rng = mulberry32(seedFromString(seedCode));
  const sequenceIndex = Math.floor(rng() * WEATHER_POOL.length);
  return {
    phase: "playing",
    seed: seedCode,
    sequenceIndex,
    day: 1,
    altitude: 0,
    stamina: STARTING_STAMINA,
    weather: WEATHER_POOL[sequenceIndex].slice(),
    history: [],
    outcome: null,
    stars: 0,
    lastResult: null,
  };
}

// ---------- Queries (UI uses these) ----------

/** Weather for today (1-indexed). */
export function todayWeather(state) {
  return state.weather[state.day - 1] || null;
}

/** Weather for tomorrow if visible, else null. */
export function tomorrowWeather(state) {
  return state.weather[state.day] || null;
}

/** Number of non-storm days remaining (including today if today isn't a storm). */
export function activeDaysRemaining(state) {
  let n = 0;
  for (let d = state.day - 1; d < TOTAL_DAYS; d++) {
    if (state.weather[d] !== "storm") n++;
  }
  return n;
}

/**
 * How many sprints the player can still afford, given current stamina
 * and remaining active days.
 *
 * Math: stamina S, active days remaining D.
 * Each non-storm day costs ≥1 stamina (climb). Sprints cost 2.
 * Max sprints = clamp(S - D, 0, D).
 */
export function sprintsRemaining(state) {
  const D = activeDaysRemaining(state);
  const surplus = state.stamina - D;
  return Math.max(0, Math.min(D, surplus));
}

/** Whether the player can pick this action right now. */
export function canDo(state, action) {
  if (state.phase !== "playing") return { ok: false, reason: "Not playing" };
  const today = todayWeather(state);
  if (today === "storm") {
    // Storm day — only rest is allowed (auto-only).
    if (action === "rest") return { ok: true };
    return { ok: false, reason: "Bug-Bug is riding out the storm" };
  }
  // Non-storm day — rest is not an option.
  if (action === "rest") return { ok: false, reason: "Rest is only forced on storm days" };
  const meta = ACTIONS[action];
  if (!meta) return { ok: false, reason: "Unknown action" };
  if (state.stamina + meta.staminaDelta < 0) {
    return { ok: false, reason: "Not enough stamina" };
  }
  // Special: sprint requires 2 stamina AND a day's worth of "min stamina" left
  // for the remaining active days. canDo enforces stamina ≥ cost; whether it's
  // strategically wise is up to the player (the UI shows sprintsRemaining).
  return { ok: true };
}

/** 0..1 progress to summit (cap at 1). */
export function summitFraction(state) {
  return Math.min(1, state.altitude / SUMMIT);
}

// ---------- Transition ----------

/**
 * Apply one action and advance the day.
 * Uses a deterministic per-day sub-RNG so the same seed + same day yields the same roll.
 */
export function applyAction(state, action) {
  const check = canDo(state, action);
  if (!check.ok) return state;

  const meta = ACTIONS[action];
  const weather = todayWeather(state);
  const dayRng = mulberry32(seedFromString(state.seed + ":" + state.day + ":" + action));
  const baseGain = intBetween(dayRng, meta.altMin, meta.altMax);
  // Weather modifier only applies to climb/sprint (rest already gives 0).
  const altGain = Math.max(0, baseGain + (action === "rest" ? 0 : WEATHER_MOD[weather]));
  const newAltitude = state.altitude + altGain;
  const newStamina = Math.max(0, state.stamina + meta.staminaDelta);

  const dayResult = {
    day: state.day,
    weather,
    action,
    altitudeGain: altGain,
    altitudeBefore: state.altitude,
    altitudeAfter: newAltitude,
    staminaBefore: state.stamina,
    staminaAfter: newStamina,
  };

  const newDay = state.day + 1;
  const next = {
    ...state,
    day: newDay,
    altitude: newAltitude,
    stamina: newStamina,
    history: state.history.concat([dayResult]),
    lastResult: dayResult,
  };

  if (newDay > TOTAL_DAYS) return finishGame(next);
  return next;
}

/** Once day > TOTAL_DAYS: decide outcome and star tier. */
export function finishGame(state) {
  const won = state.altitude >= SUMMIT;
  if (!won) return { ...state, phase: "ended", outcome: "lose", stars: 0 };
  let stars = 1;
  if (state.altitude >= 460) stars = 3;
  else if (state.altitude >= 430) stars = 2;
  return { ...state, phase: "ended", outcome: "win", stars };
}
