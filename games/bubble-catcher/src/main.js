// Bootstrap, rAF loop, click router.

import { createGame, tick, pullString, starsForWin, DIFFICULTIES, DIFFICULTY_ORDER, DEFAULT_DIFFICULTY } from "./state.js?v=5";
import { renderTitle, renderGameShell, renderEnd, patchGame } from "./render.js?v=5";
import { sfx, toggleMuted, isMuted } from "./sound.js?v=2";

const BEST_KEY = "datacruise.bubblecatcher.best.v2";
const DIFF_KEY = "datacruise.bubblecatcher.difficulty.v1";
const app = document.getElementById("app");

let state = null;
let bestByDifficulty = readBest();        // { easy, medium, hard } -> 0..3
let currentDifficulty = readDifficulty(); // "easy" | "medium" | "hard"
let rafId = null;

// Dedup paired click + pointerup gestures.
let lastActionAt = 0;
let lastActionKey = "";

renderInitial();
document.addEventListener("click", onClick);
// pointerup fallback — SVG <g> hit-testing can drop the synthetic click if
// mousedown and mouseup land on different children.
document.addEventListener("pointerup", onClick);

// ---------- top-level render ----------

function renderInitial() {
  app.innerHTML = renderTitle({
    bestByDifficulty,
    currentDifficulty,
  });
}

function showGameShell() {
  app.innerHTML = renderGameShell(state);
}

function showEnd() {
  app.innerHTML = renderEnd({
    state,
    prevBest: bestByDifficulty[state.difficulty] || 0,
    bestByDifficulty,
    currentDifficulty,
  });
}

// ---------- click routing ----------

function onClick(e) {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  const action = t.getAttribute("data-action");
  const stringId = t.getAttribute("data-string");
  const difficulty = t.getAttribute("data-difficulty");
  const key = action + (stringId ? `:${stringId}` : "") + (difficulty ? `:${difficulty}` : "");

  // Dedup click+pointerup pair from the same gesture.
  const now = performance.now();
  if (key === lastActionKey && now - lastActionAt < 250) return;
  lastActionAt = now;
  lastActionKey = key;

  if (action === "set-difficulty" && difficulty && DIFFICULTIES[difficulty]) {
    currentDifficulty = difficulty;
    writeDifficulty();
    // Re-render whichever screen we're on so the active pill updates without
    // bouncing back to the title.
    if (state && state.phase === "ended") showEnd();
    else renderInitial();
    return;
  }

  if (action === "start" || action === "replay") {
    state = createGame(currentDifficulty);
    showGameShell();
    startLoop();
    return;
  }

  if (action === "back-to-title") {
    cancelLoop();
    state = null;
    renderInitial();
    return;
  }

  if (action === "toggle-sound") {
    const nowMuted = toggleMuted();
    const btn = document.getElementById("sound-toggle");
    if (btn) btn.textContent = nowMuted ? "🔇" : "🔊";
    return;
  }

  if (action === "pull" && state && state.phase === "playing") {
    const id = parseInt(stringId, 10);
    if (!Number.isFinite(id)) return;
    sfx.pull();
    pullString(state, id);
    return;
  }
}

// ---------- loop ----------

function startLoop() {
  cancelLoop();
  let lastFrameMs = performance.now();
  let snap = snapshotForSfx(state);
  const step = (nowMs) => {
    const dt = Math.min(48, nowMs - lastFrameMs);
    lastFrameMs = nowMs;
    if (!state) return;
    tick(state, dt);
    playSfxForDelta(snap, state);
    snap = snapshotForSfx(state);
    patchGame(state);
    if (state.phase === "ended") {
      if (state.outcome === "win") {
        sfx.win();
        const stars = starsForWin(state.elapsedMs, state.config.roundMs);
        const prev = bestByDifficulty[state.difficulty] || 0;
        if (stars > prev) {
          bestByDifficulty[state.difficulty] = stars;
          writeBest();
        }
      } else {
        sfx.lose();
      }
      cancelLoop();
      // Brief pause so the last snap animation reads before the end card.
      setTimeout(showEnd, 900);
      return;
    }
    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
}

function snapshotForSfx(s) {
  return {
    catchEvents: s.catchEvents,
    missEvents: s.missEvents,
    wrongPullEvents: s.wrongPullEvents,
  };
}

function playSfxForDelta(prev, cur) {
  if (cur.catchEvents > prev.catchEvents) sfx.catch();
  if (cur.missEvents > prev.missEvents) sfx.miss();
  if (cur.wrongPullEvents > prev.wrongPullEvents) sfx.wrong();
}

function cancelLoop() {
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
}

// ---------- storage ----------

function readBest() {
  const defaults = { easy: 0, medium: 0, hard: 0 };
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      easy: clampStar(parsed.easy),
      medium: clampStar(parsed.medium),
      hard: clampStar(parsed.hard),
    };
  } catch { return defaults; }
}

function writeBest() {
  try { localStorage.setItem(BEST_KEY, JSON.stringify(bestByDifficulty)); }
  catch { /* ignore */ }
}

function clampStar(n) {
  const v = parseInt(n, 10);
  return Number.isFinite(v) ? Math.max(0, Math.min(3, v)) : 0;
}

function readDifficulty() {
  try {
    const raw = localStorage.getItem(DIFF_KEY);
    return DIFFICULTY_ORDER.includes(raw) ? raw : DEFAULT_DIFFICULTY;
  } catch { return DEFAULT_DIFFICULTY; }
}

function writeDifficulty() {
  try { localStorage.setItem(DIFF_KEY, currentDifficulty); }
  catch { /* ignore */ }
}
