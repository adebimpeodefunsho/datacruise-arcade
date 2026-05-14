// State machine for Bug-Bug's Mountain Climb.
// Pure functions only — no DOM, no side effects.

import { seedFromString, mulberry32, intBetween } from "./rng.js";

// ---------- Game balance constants ----------

export const SUMMIT = 400;       // metres
export const TOTAL_DAYS = 10;
export const STARTING_STAMINA = 3;
export const MAX_STAMINA = 5;

/** Action -> altitude gain range and stamina change. */
export const ACTIONS = {
  rest:   { altMin: 0,  altMax: 5,   staminaDelta: +2, emoji: "🛌", label: "REST" },
  climb:  { altMin: 40, altMax: 60,  staminaDelta: -1, emoji: "🥾", label: "CLIMB" },
  sprint: { altMin: 80, altMax: 120, staminaDelta: -2, emoji: "⚡", label: "SPRINT" },
};

/** Weather -> altitude modifier. */
export const WEATHER_MOD = { sunny: +10, cloudy: 0, storm: -10 };

/** Fixed bag of 10 weathers — shuffled per seed. */
const WEATHER_BAG = ["sunny","sunny","sunny","cloudy","cloudy","cloudy","cloudy","cloudy","storm","storm"];

// ---------- State factory ----------

/**
 * Create a fresh GameState for a given 4-char seed code.
 * @param {string} seedCode
 */
export function createGame(seedCode) {
  const rng = mulberry32(seedFromString(seedCode));
  return {
    phase: "playing",
    seed: seedCode,
    day: 1,
    altitude: 0,
    stamina: STARTING_STAMINA,
    weather: shuffleBag(rng),
    history: [],
    outcome: null,
    stars: 0,
    lastResult: null, // ephemeral: {gain, ...} for the last action so UI can animate
  };
}

function shuffleBag(rng) {
  const bag = WEATHER_BAG.slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
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

/** Whether the player can pick this action right now. */
export function canDo(state, action) {
  if (state.phase !== "playing") return { ok: false, reason: "Not playing" };
  const meta = ACTIONS[action];
  if (!meta) return { ok: false, reason: "Unknown action" };
  if (action === "sprint" && todayWeather(state) === "storm") {
    return { ok: false, reason: "Sprint blocked during a storm" };
  }
  if (state.stamina + meta.staminaDelta < 0) {
    return { ok: false, reason: `Needs ${-meta.staminaDelta} stamina` };
  }
  return { ok: true };
}

/** What's the average altitude/day still required to summit? */
export function avgNeededPerDay(state) {
  const daysLeft = Math.max(1, TOTAL_DAYS - state.day + 1);
  return Math.max(0, Math.ceil((SUMMIT - state.altitude) / daysLeft));
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
  const altGain = Math.max(0, baseGain + WEATHER_MOD[weather]);
  const newAltitude = state.altitude + altGain;
  const newStamina = clamp(state.stamina + meta.staminaDelta, 0, MAX_STAMINA);

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
  if (state.altitude >= 500 || state.stamina >= 3) stars = 3;
  else if (state.stamina >= 1) stars = 2;
  return { ...state, phase: "ended", outcome: "win", stars };
}

// ---------- Util ----------

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
