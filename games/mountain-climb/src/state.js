// State machine for Bug-Bug's Mountain Climb.
// Pure functions only — no DOM, no side effects.
//
// Mechanic (Series 1, v4 — "Pick a card" hazard guessing):
//   - 7 days. Bug-Bug starts with 3 stamina.
//   - Each day shows 3 face-down cards. One is a hazard; two are safe.
//     Player taps one — it flips and reveals what was inside. The other
//     two also reveal so the player can see what they missed.
//   - Safe pick: nothing bad happens. Bug-Bug climbs +50m.
//   - Hazard pick: -1 stamina. Bug-Bug still climbs +50m (the chart
//     is uniform; the drama is in the cards).
//   - If stamina drops to 0, the climb ends immediately and the line
//     chart slides back to (day 1, 0m) — effort wasted.
//   - If Bug-Bug completes day 7 with ≥1 stamina, the summit is reached.
//
// Stars: 1 (1 stamina left), 2 (2 left), 3 (3 left — no hazards picked).

import { seedFromString, mulberry32 } from "./rng.js";

// ---------- Game balance ----------

export const SUMMIT = 350;            // 7 perfect-safe days × 50m
export const TOTAL_DAYS = 7;
export const STARTING_STAMINA = 4;
export const MAX_STAMINA = STARTING_STAMINA;
export const SAFE_GAIN = 50;          // altitude gain on a safe pick
export const HAZARD_DIP = 20;         // altitude lost on a hazard pick (clamped at 0)

// ---------- Choice pool ----------
// For each weather, a pool of safe and hazard cards. Each day picks
// 2 safe + 1 hazard at random and shuffles them.

const CHOICES = {
  sunny: {
    safe: [
      { icon: "💧", label: "Drink from the spring", description: "A cool sip — Bug-Bug feels refreshed." },
      { icon: "🍃", label: "Walk through the shade", description: "Smart route. No sunburn." },
      { icon: "🥾", label: "Steady pace on the rocks", description: "Even footing — energy preserved." },
      { icon: "🌳", label: "Rest under a tree", description: "A quiet pause keeps the head clear." },
    ],
    hazard: [
      { icon: "🔥", label: "Run uphill in the heat", description: "Heatstroke! Bug-Bug staggers." },
      { icon: "🥵", label: "Skip the water break", description: "Dehydrated! Bug-Bug feels dizzy." },
      { icon: "☀️", label: "Climb without shade", description: "Sunburn! Bug-Bug winces in pain." },
    ],
  },
  cloudy: {
    safe: [
      { icon: "🗺️", label: "Check the map", description: "Stayed on the right path." },
      { icon: "🌥️", label: "Follow the marked trail", description: "Trusted the markers. Solid choice." },
      { icon: "🪨", label: "Stick to the cliff face", description: "Hugged the safe wall." },
      { icon: "🧭", label: "Trust the compass", description: "Pointed true north — kept on track." },
    ],
    hazard: [
      { icon: "🌫️", label: "Wander into the fog", description: "Lost! Bug-Bug wastes hours wandering." },
      { icon: "🪵", label: "Take the unmarked shortcut", description: "Dead end! Backtracking is exhausting." },
      { icon: "🦅", label: "Chase the strange bird", description: "Distracted! Bug-Bug strays from the path." },
    ],
  },
  storm: {
    safe: [
      { icon: "🏚️", label: "Shelter in the cave", description: "Snug and safe from the storm." },
      { icon: "⛺", label: "Pitch a tent", description: "Dry and warm. Riding it out." },
      { icon: "🧗", label: "Crouch low and wait", description: "Smart — kept low, stayed safe." },
      { icon: "🪨", label: "Hide behind a boulder", description: "Solid cover from the wind." },
    ],
    hazard: [
      { icon: "🚪", label: "Open the mysterious door", description: "It was a trap! Bug-Bug tumbles." },
      { icon: "⚡", label: "Brave the lightning", description: "Struck! Bug-Bug's fur stands on end." },
      { icon: "🌊", label: "Cross the rising river", description: "Swept downstream! Bug-Bug barely escapes." },
    ],
  },
};

// ---------- Weather sequences ----------
// 10 handcrafted 7-day sequences with mixed weather.

const WEATHER_POOL = [
  ["sunny",  "cloudy", "storm",  "sunny",  "cloudy", "sunny",  "storm" ],
  ["cloudy", "sunny",  "sunny",  "storm",  "cloudy", "sunny",  "storm" ],
  ["sunny",  "storm",  "cloudy", "sunny",  "storm",  "cloudy", "sunny" ],
  ["storm",  "sunny",  "cloudy", "storm",  "sunny",  "cloudy", "sunny" ],
  ["sunny",  "cloudy", "storm",  "cloudy", "sunny",  "storm",  "sunny" ],
  ["cloudy", "sunny",  "sunny",  "storm",  "cloudy", "storm",  "sunny" ],
  ["storm",  "cloudy", "sunny",  "cloudy", "storm",  "sunny",  "sunny" ],
  ["sunny",  "sunny",  "storm",  "cloudy", "sunny",  "storm",  "cloudy"],
  ["cloudy", "storm",  "sunny",  "cloudy", "sunny",  "storm",  "sunny" ],
  ["sunny",  "cloudy", "storm",  "sunny",  "storm",  "cloudy", "sunny" ],
];

// ---------- State factory ----------

/**
 * Create a fresh GameState for a given 4-char seed code.
 * @param {string} seedCode
 */
export function createGame(seedCode) {
  const rng = mulberry32(seedFromString(seedCode));
  const sequenceIndex = Math.floor(rng() * WEATHER_POOL.length);
  const weather = WEATHER_POOL[sequenceIndex].slice();

  // Pre-roll 7 days of choices. Each day: 1 safe + 2 hazards from the
  // pool for that weather, then shuffle so the safe card isn't always
  // in the same slot.
  const dailyChoices = weather.map((w) => {
    const safePool = CHOICES[w].safe.slice();
    const hazardPool = CHOICES[w].hazard.slice();
    const safe = pickAndRemove(safePool, rng);
    const hazard1 = pickAndRemove(hazardPool, rng);
    const hazard2 = pickAndRemove(hazardPool, rng);
    const cards = [
      { ...safe, type: "safe" },
      { ...hazard1, type: "hazard" },
      { ...hazard2, type: "hazard" },
    ];
    shuffleInPlace(cards, rng);
    return cards;
  });

  return {
    phase: "playing",
    seed: seedCode,
    sequenceIndex,
    day: 1,
    altitude: 0,
    peakAltitude: 0,
    stamina: STARTING_STAMINA,
    weather,
    dailyChoices,
    revealedToday: null, // null | { pickedIndex }
    history: [],
    outcome: null,
    stars: 0,
    lastResult: null,
  };
}

function pickAndRemove(arr, rng) {
  const i = Math.floor(rng() * arr.length);
  return arr.splice(i, 1)[0];
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- Queries ----------

export function todayWeather(state) {
  return state.weather[state.day - 1] || null;
}

export function todayCards(state) {
  return state.dailyChoices[state.day - 1] || null;
}

/** Convenience: is the player allowed to pick a card right now? */
export function canPick(state) {
  return state.phase === "playing" && state.revealedToday === null;
}

/** Convenience: should the player click Continue to advance the day? */
export function canContinue(state) {
  return state.phase === "playing" && state.revealedToday !== null;
}

export function summitFraction(state) {
  return Math.min(1, state.altitude / SUMMIT);
}

// ---------- Transitions ----------

/**
 * Player picks a card by index (0, 1, or 2). The pick is recorded but
 * the day doesn't advance yet — the player needs to click Continue to
 * see the next day's cards.
 */
export function pickCard(state, index) {
  if (!canPick(state)) return state;
  if (index < 0 || index > 2) return state;
  const cards = todayCards(state);
  if (!cards) return state;
  return {
    ...state,
    revealedToday: {
      pickedIndex: index,
      pickedCard: cards[index],
      wasHazard: cards[index].type === "hazard",
    },
  };
}

/**
 * After the cards are revealed, the player clicks Continue. This applies
 * the picked card's effect (stamina change, altitude gain) and advances
 * the day. If stamina hits zero, the game ends in a loss.
 */
export function advanceDay(state) {
  if (!canContinue(state)) return state;
  const wasHazard = state.revealedToday.wasHazard;
  const pickedCard = state.revealedToday.pickedCard;
  const pickedIndex = state.revealedToday.pickedIndex;

  const staminaDelta = wasHazard ? -1 : 0;
  const newStamina = Math.max(0, state.stamina + staminaDelta);
  const altDelta = wasHazard ? -HAZARD_DIP : SAFE_GAIN;
  const newAltitude = Math.max(0, state.altitude + altDelta);
  const newDay = state.day + 1;

  const dayResult = {
    day: state.day,
    weather: todayWeather(state),
    cards: todayCards(state),
    pickedIndex,
    pickedCard,
    wasHazard,
    staminaBefore: state.stamina,
    staminaAfter: newStamina,
    altitudeBefore: state.altitude,
    altitudeAfter: newAltitude,
  };

  const next = {
    ...state,
    day: newDay,
    altitude: newAltitude,
    peakAltitude: Math.max(state.peakAltitude, newAltitude),
    stamina: newStamina,
    revealedToday: null,
    history: state.history.concat([dayResult]),
    lastResult: dayResult,
  };

  // Hand off to finishGame if either game-end condition has been hit.
  if (newStamina <= 0 || newDay > TOTAL_DAYS) {
    return finishGame(next);
  }
  return next;
}

/**
 * Resolve game outcome. Three terminal states:
 *
 *   1. Stamina ≤ 0 BEFORE day 7 is complete   → outcome "lose"
 *   2. Stamina ≤ 0 AT day 7 (last day)         → outcome "win",
 *                                                 exhaustedFinish=true,
 *                                                 stars=0 (½-star vibe)
 *   3. Day > 7 with stamina remaining          → outcome "win", stars 1-3
 */
export function finishGame(state) {
  if (state.phase === "ended") return state; // already finalised
  const completedAllDays = state.day > TOTAL_DAYS;
  const stamina = state.stamina;

  if (stamina <= 0 && !completedAllDays) {
    return {
      ...state,
      phase: "ended",
      outcome: "lose",
      stars: 0,
      exhaustedFinish: false,
    };
  }

  if (stamina <= 0 && completedAllDays) {
    return {
      ...state,
      phase: "ended",
      outcome: "win",
      stars: 0,
      exhaustedFinish: true,
    };
  }

  if (completedAllDays && stamina > 0) {
    const hazardsHit = STARTING_STAMINA - stamina;
    let stars = 1;
    if (hazardsHit === 0) stars = 3;
    else if (hazardsHit === 1) stars = 2;
    return {
      ...state,
      phase: "ended",
      outcome: "win",
      stars,
      exhaustedFinish: false,
    };
  }

  return state;
}
