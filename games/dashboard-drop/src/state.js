// Bug-Bug's Dashboard Drop — state, constants, simulation tick.
// Recognition + precision game. Layout: sky on top, dashboard in the middle,
// ground strip beneath it, DEPLOY bar at the bottom.
//
// The dashboard's six chart slots are now RANDOMISED per game from a larger
// catalog. Whichever 6 chart types land on the dashboard this round are the
// "real" charts; every other type in the catalog is a decoy this round. The
// dashboard ghost previews tell the player which 6 are real on game start.

export const VIEW = { W: 1040, H: 800 };

export const DASH = { x: 30, y: 235, w: 980, h: 345 };
export const GROUND = { x: 0, y: 600, w: 1040, h: 110 };
export const DEPLOY = { x: 30, y: 720, w: 980, h: 70 };

// --- Chart catalog ---------------------------------------------------------
// Every chart type the game knows about. kind="kpi" goes into KPI-sized
// slots (290×78), kind="chart" goes into chart-sized slots (290×200).
export const CHART_CATALOG = {
  // KPI cards (small slots, big number + label)
  "kpi-revenue":    { kind: "kpi",   label: "REVENUE",    value: "$24k", color: "#FF6A1A" },
  "kpi-users":      { kind: "kpi",   label: "USERS",      value: "1.8k", color: "#2BB673" },
  "kpi-conversion": { kind: "kpi",   label: "CONV %",     value: "12%",  color: "#5DC1E8" },
  "kpi-orders":     { kind: "kpi",   label: "ORDERS",     value: "428",  color: "#E84A8B" },
  "kpi-aov":        { kind: "kpi",   label: "AVG ORDER",  value: "$56",  color: "#9D62E0" },
  "kpi-churn":      { kind: "kpi",   label: "CHURN",      value: "3.2%", color: "#D44A00" },
  "kpi-nps":        { kind: "kpi",   label: "NPS",        value: "+62",  color: "#2BB673" },

  // Chart-shaped (larger slots with full chart art)
  "line":    { kind: "chart", label: "TREND",       color: "#FF6A1A" },
  "bar":     { kind: "chart", label: "BY REGION",   color: "#FFC500" },
  "pie":     { kind: "chart", label: "MIX",         color: "#E84A8B" },
  "bubble":  { kind: "chart", label: "BUBBLES",     color: "#5DC1E8" },
  "scatter": { kind: "chart", label: "SCATTER",     color: "#9D62E0" },
  "gauge":   { kind: "chart", label: "PROGRESS",    color: "#2BB673" },
  "area":    { kind: "chart", label: "AREA",        color: "#2E9DC9" },
  "heatmap": { kind: "chart", label: "HEATMAP",     color: "#D44A00" },
};

export const ALL_KPI_TYPES   = Object.keys(CHART_CATALOG).filter((k) => CHART_CATALOG[k].kind === "kpi");
export const ALL_CHART_TYPES = Object.keys(CHART_CATALOG).filter((k) => CHART_CATALOG[k].kind === "chart");

// --- Dashboard layout: 6 slot positions (3 KPI on top, 3 chart below). ----
// Types are assigned per-game in `buildSlotsForRound()`.
export const SLOT_POSITIONS = [
  { id: "k1", kind: "kpi",   col: 0, x: 50,  y: 280, w: 290, h: 78  },
  { id: "k2", kind: "kpi",   col: 1, x: 375, y: 280, w: 290, h: 78  },
  { id: "k3", kind: "kpi",   col: 2, x: 700, y: 280, w: 290, h: 78  },
  { id: "c1", kind: "chart", col: 0, x: 50,  y: 370, w: 290, h: 200 },
  { id: "c2", kind: "chart", col: 1, x: 375, y: 370, w: 290, h: 200 },
  { id: "c3", kind: "chart", col: 2, x: 700, y: 370, w: 290, h: 200 },
];

// --- Silly auto-fills (appear in missed slots) ---
export const SILLY_FILLS = [
  { id: "watermelon", label: "WATERMELON" },
  { id: "cat",        label: "CAT" },
  { id: "mop",        label: "MOP" },
  { id: "duck",       label: "RUBBER DUCK" },
  { id: "pizza",      label: "PIZZA" },
  { id: "fish",       label: "FISH" },
  { id: "donut",      label: "DONUT" },
];

// --- Difficulty ---
export const DIFFICULTIES = {
  easy:   { fallMs: 5000, junkCount: 7,  label: "EASY"   },
  medium: { fallMs: 3700, junkCount: 9,  label: "MEDIUM" },
  hard:   { fallMs: 2500, junkCount: 12, label: "HARD"   },
};

export const MAX_WRONGS = 3;

const SPAWN_GAP_MS = 650;
const RESULT_FLASH_MS = 900;
const RESULT_FLASH_MS_LONG = 1500;

export const FALL_START_Y = 115;
export const FALL_END_Y = VIEW.H + 70;

const SPAWN_X_MIN = 130;
const SPAWN_X_MAX = VIEW.W - 130;

// ---------- Lifecycle ----------

export function createGame(difficulty = "medium") {
  const cfg = DIFFICULTIES[difficulty] || DIFFICULTIES.medium;
  const slots = buildSlotsForRound();
  const dashboardTypes = new Set(slots.map((s) => s.type));
  const decoyTypes = Object.keys(CHART_CATALOG).filter((t) => !dashboardTypes.has(t));
  return {
    phase: "playing",
    outcome: null,
    difficulty,
    cfg,

    slots: slots.map((s) => ({ ...s, filled: null, justFilledMs: 0 })),
    decoyTypes,

    queue: buildQueue(cfg, slots, decoyTypes),
    spawnedCount: 0,

    falling: null,
    nextSpawnMs: 900,

    correctCatches: 0,
    misses: 0,
    junkDeploys: 0,
    junkIgnored: 0,
    bugChompMs: 0,

    lastResult: null,
    resultFlashMs: 0,

    lockEvents: 0,
    crashEvents: 0,
    dissolveEvents: 0,
    chompEvents: 0,
    junkIgnoreEvents: 0,
  };
}

// Pick 3 random KPI types and 3 random chart types, assign to slot positions.
function buildSlotsForRound() {
  const kpis  = shuffleArr(ALL_KPI_TYPES.slice()).slice(0, 3);
  const charts = shuffleArr(ALL_CHART_TYPES.slice()).slice(0, 3);
  return SLOT_POSITIONS.map((pos, i) => {
    const type = pos.kind === "kpi" ? kpis[i % 3] : charts[i % 3];
    const meta = CHART_CATALOG[type];
    return { ...pos, type, label: meta.label, color: meta.color, value: meta.value };
  });
}

function buildQueue(cfg, slots, decoyTypes) {
  const items = slots.map((s) => ({ kind: "real", slotId: s.id, type: s.type }));
  for (let i = 0; i < cfg.junkCount; i++) {
    const type = decoyTypes[Math.floor(Math.random() * decoyTypes.length)];
    items.push({ kind: "junk", slotId: null, type });
  }
  shuffleArr(items);
  if (items[0].kind === "junk") {
    const firstRealIdx = items.findIndex((it) => it.kind === "real");
    if (firstRealIdx > 0) [items[0], items[firstRealIdx]] = [items[firstRealIdx], items[0]];
  }
  return items;
}

function shuffleArr(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomSpawnX() {
  return SPAWN_X_MIN + Math.random() * (SPAWN_X_MAX - SPAWN_X_MIN);
}

// ---------- Action ----------

export function deploy(state) {
  if (state.phase !== "playing") return;
  const f = state.falling;
  if (!f || f.locked || f.passed) return;
  const chartY = chartCenterY(f);

  if (f.kind === "real") {
    const slot = state.slots.find((s) => s.id === f.slotId);
    const inLockZone = chartY >= slot.y && chartY <= slot.y + slot.h;
    if (inLockZone) {
      f.locked = "snap";
      slot.filled = "real";
      slot.justFilledMs = 700;
      state.correctCatches += 1;
      state.lockEvents += 1;
      state.lastResult = { kind: "lock", label: prettyName(f.type) };
      state.resultFlashMs = RESULT_FLASH_MS;
    } else {
      state.lastResult = { kind: "fizzle", label: prettyName(f.type) };
      state.resultFlashMs = 520;
    }
  } else {
    f.locked = "shatter";
    state.junkDeploys += 1;
    state.crashEvents += 1;
    state.lastResult = { kind: "junk-deploy", label: prettyName(f.type) };
    state.resultFlashMs = RESULT_FLASH_MS_LONG;
  }
}

function chartCenterY(f) {
  return FALL_START_Y + (FALL_END_Y - FALL_START_Y) * f.y;
}

// ---------- Tick ----------

export function tick(state, dtMs) {
  if (state.phase !== "playing") {
    decayTimers(state, dtMs);
    return state;
  }

  if (!state.falling) {
    state.nextSpawnMs -= dtMs;
    const dashboardFull = state.slots.every((s) => s.filled !== null);
    if (state.nextSpawnMs <= 0
        && state.spawnedCount < state.queue.length
        && !dashboardFull) {
      const next = state.queue[state.spawnedCount];
      state.falling = {
        id: state.spawnedCount,
        kind: next.kind,
        slotId: next.slotId,
        type: next.type,
        x: randomSpawnX(),
        y: 0,
        elapsed: 0,
        fallMs: state.cfg.fallMs,
        locked: null,
        animatingMs: 0,
      };
      state.spawnedCount += 1;
    }
  }

  if (state.falling && state.falling.locked) {
    state.falling.animatingMs += dtMs;
    if (state.falling.animatingMs >= 520) {
      state.falling = null;
      state.nextSpawnMs = SPAWN_GAP_MS;
    }
  }

  if (state.falling && !state.falling.locked) {
    state.falling.elapsed += dtMs;
    state.falling.y = Math.min(1, state.falling.elapsed / state.falling.fallMs);
    const f = state.falling;
    const chartY = chartCenterY(f);

    if (f.kind === "real" && !f.passed) {
      const slot = state.slots.find((s) => s.id === f.slotId);
      if (chartY > slot.y + slot.h) {
        f.passed = true;
        fillWithSilly(slot);
        state.misses += 1;
        state.crashEvents += 1;
        state.lastResult = { kind: "missed", label: prettyName(f.type) };
        state.resultFlashMs = RESULT_FLASH_MS_LONG;
        if (state.slots.every((s) => s.filled !== null)) {
          f.locked = "dissolve";
          f.animatingMs = 0;
          state.dissolveEvents += 1;
        }
      }
    }

    if (chartY > GROUND.y) {
      f.locked = "dissolve";
      if (f.kind === "junk") {
        state.junkIgnored += 1;
        state.chompEvents += 1;        // crunchy SFX (separate from dissolve)
        state.bugChompMs = 380;        // chomp animation on Bug-Bug
        state.lastResult = { kind: "junk-ignored", label: prettyName(f.type) };
        state.resultFlashMs = RESULT_FLASH_MS;
      }
    }
  }

  if (state.junkDeploys >= MAX_WRONGS && (!state.falling || state.falling.locked)) {
    state.phase = "ended";
    state.outcome = "lose";
    state.endedByStrikeout = true;
  }
  else if (!state.falling
           && (state.slots.every((s) => s.filled !== null)
               || state.spawnedCount >= state.queue.length)) {
    state.phase = "ended";
    state.outcome = state.slots.every((s) => s.filled === "real") ? "win" : "lose";
  }

  decayTimers(state, dtMs);
  return state;
}

function fillWithSilly(slot) {
  if (slot.filled) return;
  const silly = SILLY_FILLS[Math.floor(Math.random() * SILLY_FILLS.length)];
  slot.filled = silly.id;
  slot.justFilledMs = 700;
}

function decayTimers(state, dtMs) {
  if (state.resultFlashMs > 0) state.resultFlashMs = Math.max(0, state.resultFlashMs - dtMs);
  if (state.bugChompMs > 0)    state.bugChompMs    = Math.max(0, state.bugChompMs    - dtMs);
  for (const s of state.slots) {
    if (s.justFilledMs > 0) s.justFilledMs = Math.max(0, s.justFilledMs - dtMs);
  }
}

// ---------- Scoring ----------

export function starsForResult(state) {
  const real = state.slots.filter((s) => s.filled === "real").length;
  const total = state.slots.length;
  const base =
    real === total ? 3 :
    real >= total - 1 ? 2 :
    real >= total - 2 ? 1 : 0;
  return Math.max(0, base - state.junkDeploys);
}

export function prettyName(type) {
  const meta = CHART_CATALOG[type];
  if (!meta) return type.toUpperCase();
  if (meta.kind === "kpi") return `${meta.label} KPI`;
  return `${meta.label.toUpperCase()} CHART`;
}

// ---------- End-of-round message ----------

export function endMessage(state) {
  const byType = {};
  let total = 0;
  for (const slot of state.slots) {
    if (slot.filled && slot.filled !== "real") {
      byType[slot.filled] = (byType[slot.filled] || 0) + 1;
      total += 1;
    }
  }

  const junk = state.junkDeploys;
  const junkTail = junk === 0 ? "" : ` Also bled ${junk} ★ to wrong deploys.`;

  if (state.endedByStrikeout) {
    return {
      title: "STRIKE THREE. LIGHTS OUT.",
      subtitle: "Three decoys deployed. Bug-Bug yanks the cable and walks off the stage.",
      flavour: total === 0
        ? "The dashboard was actually looking decent. The decoys robbed you blind."
        : "Reminder: only the six charts on the dashboard sketch are real. Everything else is a trap.",
    };
  }

  if (total === 0 && junk === 0) {
    return {
      title: "DASHBOARD OF THE YEAR",
      subtitle: "Six perfect catches, zero shenanigans, and one extremely smug Bug-Bug.",
      flavour: "If dashboards had a hall of fame, this is the lobby.",
    };
  }
  if (total === 0 && junk > 0) {
    return {
      title: "DASHBOARD BUILT, FLOOR DESTROYED",
      subtitle: `Every real chart landed — and ${junk} decoy${junk === 1 ? "" : "s"} you splatted on the way down.`,
      flavour: "Bug-Bug is mopping. Bug-Bug is muttering.",
    };
  }

  const list = formatSillyList(byType);

  if (total === state.slots.length) {
    return {
      title: "BUG-BUG IS GOING TO LIE DOWN",
      subtitle: `What you've built is ${list}. None of that is a chart.`,
      flavour: `The data council has been called. The data council is on its way.${junkTail}`,
    };
  }
  if (total >= 4) {
    return {
      title: "DASHBOARD OR ESTATE SALE",
      subtitle: `Now on display: ${list}.`,
      flavour: `Bug-Bug recommends NOT showing this to leadership.${junkTail}`,
    };
  }
  if (total >= 2) {
    return {
      title: "DASHBOARD-FLAVOURED",
      subtitle: `Your final dashboard includes ${list}. None of that is a chart.`,
      flavour: `Bug-Bug is updating the org chart to include the new departments.${junkTail}`,
    };
  }
  const onlyId = Object.keys(byType)[0];
  const name = prettySilly(onlyId);
  return {
    title: "ONE WEIRD CHART AWAY",
    subtitle: `Five real charts and ${aOrAn(name)} stuck to the dashboard like it owns the place.`,
    flavour: `Bug-Bug is rebranding the ${name} as "Quarterly Vibes" and moving on.${junkTail}`,
  };
}

function aOrAn(name) {
  return /^[aeiou]/i.test(name) ? `an ${name}` : `a ${name}`;
}

function formatSillyList(byType) {
  const parts = [];
  for (const id of Object.keys(byType)) {
    const count = byType[id];
    const name = prettySilly(id);
    parts.push(count === 1 ? aOrAn(name) : `${count} ${pluralize(name)}`);
  }
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
}

function pluralize(name) {
  if (name === "fish") return "fish";
  if (name.endsWith("s")) return name;
  return name + "s";
}

function prettySilly(id) {
  return ({
    watermelon: "watermelon",
    cat: "cat",
    mop: "mop",
    duck: "rubber duck",
    pizza: "pizza slice",
    fish: "fish",
    donut: "donut",
  })[id] || id;
}
