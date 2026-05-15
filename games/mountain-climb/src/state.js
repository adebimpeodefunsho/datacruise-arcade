// State machine for Bug-Bug's Mountain Climb.
// Pure functions only — no DOM, no side effects.
//
// Mechanic (Series 1, v2):
//   - 10 days total, 400m summit.
//   - Each game uses one of 10 handcrafted weather sequences,
//     all containing EXACTLY 5 sunny / 3 cloudy / 2 storm.
//   - Sunny days are the ONLY active days — pick CLIMB or SPRINT.
//   - Cloudy and storm days are forced sleep days. Bug-Bug rests,
//     stamina and altitude unchanged.
//   - Stamina is a fixed budget of 7. No regeneration.
//   - 5 active days × 1 stamina min = 5 needed → 2 surplus → max
//     2 sprint upgrades per game.
//
// Lose condition: altitude < 400m at end of day 10.
//   On loss the line chart slides back to the starting point —
//   effort visualised as wasted because the line never reached
//   the summit (it has to be "hooked" at both ends).

import { seedFromString, mulberry32, intBetween } from "./rng.js";

// ---------- Game balance ----------

export const SUMMIT = 400;            // metres
export const TOTAL_DAYS = 10;
export const STARTING_STAMINA = 7;
export const MAX_STAMINA = STARTING_STAMINA;

/** Action → altitude gain range and stamina cost. */
export const ACTIONS = {
  climb:  { altMin: 65, altMax: 75,   staminaDelta: -1, emoji: "🥾", label: "CLIMB"  },
  sprint: { altMin: 130, altMax: 140, staminaDelta: -2, emoji: "⚡", label: "SPRINT" },
  // 'rest' is only triggered automatically on cloudy/storm days.
  rest:   { altMin: 0,   altMax: 0,   staminaDelta:  0, emoji: "💤", label: "SLEEP"  },
};

// ---------- Handcrafted weather pool ----------
// 10 sequences. Each has 5 sunny (active), 3 cloudy (rest), 2 storm (rest).

const WEATHER_POOL = [
  // 1. "Sunny opener" — early action, late rests
  ["sunny", "sunny", "cloudy", "sunny", "cloudy", "storm", "sunny", "sunny", "storm", "cloudy"],
  // 2. "Storm in the middle"
  ["sunny", "sunny", "cloudy", "storm", "sunny", "cloudy", "sunny", "storm", "sunny", "cloudy"],
  // 3. "Late sprinter" — sunny days arrive late
  ["cloudy", "storm", "cloudy", "sunny", "cloudy", "sunny", "sunny", "storm", "sunny", "sunny"],
  // 4. "Clustered sunny"
  ["cloudy", "sunny", "sunny", "storm", "sunny", "cloudy", "sunny", "storm", "sunny", "cloudy"],
  // 5. "Storm crisis" — two storms at the start
  ["storm", "storm", "sunny", "sunny", "cloudy", "sunny", "cloudy", "sunny", "sunny", "cloudy"],
  // 6. "Spread sunny"
  ["sunny", "cloudy", "sunny", "storm", "sunny", "cloudy", "sunny", "storm", "sunny", "cloudy"],
  // 7. "Drama" — storms back to back, sunny pair late
  ["sunny", "cloudy", "storm", "storm", "sunny", "sunny", "cloudy", "sunny", "cloudy", "sunny"],
  // 8. "Cloudy plod"
  ["cloudy", "sunny", "cloudy", "storm", "sunny", "sunny", "cloudy", "sunny", "sunny", "storm"],
  // 9. "Storm bookends"
  ["storm", "sunny", "cloudy", "sunny", "sunny", "cloudy", "sunny", "cloudy", "sunny", "storm"],
  // 10. "Stormy finish"
  ["sunny", "cloudy", "sunny", "sunny", "cloudy", "sunny", "cloudy", "sunny", "storm", "storm"],
];

// Sanity (executed once at module load): each sequence has the right counts.
// Comment out in production if you want — leaves a console warning if a
// future edit breaks the invariant.
(function verifyPool() {
  WEATHER_POOL.forEach((seq, i) => {
    const counts = { sunny: 0, cloudy: 0, storm: 0 };
    seq.forEach((w) => counts[w]++);
    if (counts.sunny !== 5 || counts.cloudy !== 3 || counts.storm !== 2) {
      // eslint-disable-next-line no-console
      console.warn(
        `[state.js] Weather sequence ${i} has bad counts:`,
        counts,
        seq
      );
    }
  });
})();

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
    peakAltitude: 0,   // tracks highest altitude reached during the climb
    stamina: STARTING_STAMINA,
    weather: WEATHER_POOL[sequenceIndex].slice(),
    history: [],
    outcome: null,
    stars: 0,
    lastResult: null,
  };
}

// ---------- Queries ----------

export function todayWeather(state) {
  return state.weather[state.day - 1] || null;
}

export function tomorrowWeather(state) {
  return state.weather[state.day] || null;
}

/** Whether today is a rest day (cloudy or storm). */
export function isRestDay(weather) {
  return weather === "cloudy" || weather === "storm";
}

/** Number of active (sunny) days remaining including today if it's sunny. */
export function activeDaysRemaining(state) {
  let n = 0;
  for (let d = state.day - 1; d < TOTAL_DAYS; d++) {
    if (state.weather[d] === "sunny") n++;
  }
  return n;
}

/**
 * How many sprints the player can still afford, given current stamina
 * and remaining active days.
 *
 * Math: stamina S, active days D.
 * Each active day costs ≥1 stamina (climb). Sprint costs 2 (i.e. +1
 * over a climb). Max sprints = clamp(S - D, 0, D).
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
  if (isRestDay(today)) {
    if (action === "rest") return { ok: true };
    return { ok: false, reason: "Bug-Bug is sleeping today" };
  }
  // Sunny day — climb / sprint only.
  if (action === "rest") return { ok: false, reason: "It's sunny — no time for sleep" };
  const meta = ACTIONS[action];
  if (!meta) return { ok: false, reason: "Unknown action" };
  if (state.stamina + meta.staminaDelta < 0) {
    return { ok: false, reason: "Not enough stamina" };
  }
  return { ok: true };
}

/** 0..1 progress to summit (cap at 1). */
export function summitFraction(state) {
  return Math.min(1, state.altitude / SUMMIT);
}

// ---------- Transition ----------

/**
 * Apply one action and advance the day.
 * Deterministic per-day sub-RNG so the same seed + same day + same action
 * yields the same altitude roll.
 */
export function applyAction(state, action) {
  const check = canDo(state, action);
  if (!check.ok) return state;

  const meta = ACTIONS[action];
  const weather = todayWeather(state);
  const dayRng = mulberry32(seedFromString(state.seed + ":" + state.day + ":" + action));
  const altGain = intBetween(dayRng, meta.altMin, meta.altMax);
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
    peakAltitude: Math.max(state.peakAltitude, newAltitude),
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
  if (!won) {
    // On loss, the line "slides back" — render layer draws this; we just
    // record the peak so the end recap can show how close they got.
    return {
      ...state,
      phase: "ended",
      outcome: "lose",
      stars: 0,
    };
  }
  let stars = 1;
  if (state.altitude >= 460) stars = 3;
  else if (state.altitude >= 430) stars = 2;
  return { ...state, phase: "ended", outcome: "win", stars };
}
