// Bootstrap, rAF loop, click router.

import {
  createGame, tick, walkToPlot, walkToX, demolish, instantDrop, setKeyboardMove,
  VIEW, PLAY_LEFT, PLAY_RIGHT, DIFFICULTIES, CARRY_MAX,
} from "./state.js?v=14";
import { renderTitle, renderGameShell, renderEnd, patchGame } from "./render.js?v=14";
import { sfx, toggleMuted, isMuted } from "./sound.js?v=14";

const STORAGE_KEY = "datacruise.blockcity.v2";
const app = document.getElementById("app");

let state = null;
let bestByDifficulty = readBest();
let rafId = null;

renderInitial();
document.addEventListener("click", onClick);
// pointerup as a click fallback: SVG <g> hit-testing can drop the synthetic
// `click` when mousedown and mouseup land on different child elements.
// Pointerup fires reliably even in that case.
document.addEventListener("pointerup", onClick);
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

let lastActionAt = 0;
let lastActionKey = "";

// ---------- top-level render ----------

function renderInitial() {
  app.innerHTML = renderTitle(bestByDifficulty);
}

function showGameShell() {
  app.innerHTML = renderGameShell(state);
  bindStageClicks();
}

function showEnd() {
  const best = bestByDifficulty[state.difficulty] || 0;
  app.innerHTML = renderEnd(state, best);
}

// ---------- click routing ----------

function onClick(e) {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  const action = t.getAttribute("data-action");

  // Dedup so the click + pointerup pair (same gesture) only runs once.
  const now = performance.now();
  if (action === lastActionKey && now - lastActionAt < 250) return;
  lastActionAt = now;
  lastActionKey = action;

  // Start a new game at a specific difficulty
  if (action.startsWith("start:") || action.startsWith("replay:")) {
    const difficulty = action.split(":")[1];
    if (!DIFFICULTIES[difficulty]) return;
    state = createGame(difficulty);
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

  if (state && state.phase === "playing") {
    if (action.startsWith("drop:")) {
      instantDrop(state, parseInt(action.slice(5), 10));
      return;
    }
    if (action.startsWith("plot:")) {
      walkToPlot(state, parseInt(action.slice(5), 10));
      return;
    }
    if (action.startsWith("demolish:")) {
      demolish(state, parseInt(action.slice(9), 10));
      return;
    }
  }
}

// ---------- keyboard ----------

function onKeyDown(e) {
  if (!state || state.phase !== "playing") return;
  if (e.repeat) {
    // Suppress key-repeat for digit drops so holding "1" doesn't fire repeatedly.
    if (e.key >= "1" && e.key <= "4") { e.preventDefault(); return; }
    // Arrow/A/D held: the flag is already set, no need to do anything.
    return;
  }
  const k = e.key;
  if (k === "ArrowLeft" || k === "a" || k === "A") {
    setKeyboardMove(state, "left", true);
    e.preventDefault();
  } else if (k === "ArrowRight" || k === "d" || k === "D") {
    setKeyboardMove(state, "right", true);
    e.preventDefault();
  } else if (k >= "1" && k <= "4") {
    instantDrop(state, parseInt(k, 10) - 1);
    e.preventDefault();
  }
}

function onKeyUp(e) {
  if (!state) return;
  const k = e.key;
  if (k === "ArrowLeft" || k === "a" || k === "A") {
    setKeyboardMove(state, "left", false);
  } else if (k === "ArrowRight" || k === "d" || k === "D") {
    setKeyboardMove(state, "right", false);
  }
}

// Click on the empty stage area (not a plot/button) walks Bug-Bug there.
function bindStageClicks() {
  const svg = document.getElementById("stage-svg");
  if (!svg) return;
  svg.addEventListener("click", (e) => {
    if (!state || state.phase !== "playing") return;
    if (e.target.closest("[data-action]")) return; // handled by router
    const pt = svgPoint(svg, e);
    if (!pt) return;
    if (pt.x < PLAY_LEFT || pt.x > PLAY_RIGHT) return;
    walkToX(state, pt.x);
  });
}

function svgPoint(svg, evt) {
  const rect = svg.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * VIEW.W;
  const y = ((evt.clientY - rect.top) / rect.height) * VIEW.H;
  return { x, y };
}

// ---------- loop ----------

function startLoop() {
  cancelLoop();
  let lastFrameMs = performance.now();
  let snap = snapshotForSfx(state);
  const step = (nowMs) => {
    const dt = Math.min(48, nowMs - lastFrameMs);
    lastFrameMs = nowMs;
    if (!state || state.phase !== "playing") return;
    tick(state, dt);
    playSfxForDelta(snap, state);
    snap = snapshotForSfx(state);
    patchGame(state);
    if (state.phase === "ended") {
      if (state.outcome === "win") {
        sfx.win();
        const prev = bestByDifficulty[state.difficulty] || 0;
        if (state.stars > prev) {
          bestByDifficulty[state.difficulty] = state.stars;
          writeBest();
        }
      } else {
        sfx.lose();
      }
      cancelLoop();
      showEnd();
      window.DataCruiseResult && DataCruiseResult.ready({
        slug: "block-city", game: "Block City",
        headline: state.outcome === "win" ? (state.elapsedMs / 1000).toFixed(1) + "s" : "City fell!",
        sub: state.outcome === "win" ? "skyline complete 🏙️" : "rebuild it next time",
        stars: state.stars, starsMax: 3,
      });
      return;
    }
    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
}

function snapshotForSfx(s) {
  return {
    carried: s.carried,
    built: s.built.slice(),
    blocksCaught: s.blocksCaught,
    blocksMissed: s.blocksMissed,
    demolitions: s.demolitions,
  };
}

function playSfxForDelta(prev, cur) {
  if (cur.blocksCaught > prev.blocksCaught) {
    sfx.catch();
    if (cur.carried >= CARRY_MAX && prev.carried < CARRY_MAX) sfx.carryMax();
  }
  if (cur.blocksMissed > prev.blocksMissed) sfx.miss();
  if (cur.demolitions > prev.demolitions) sfx.demolish();

  // Drop: carried went down (instantDrop emptied it). Find which plot grew.
  if (cur.carried < prev.carried) {
    for (let i = 0; i < cur.built.length; i++) {
      const delta = cur.built[i] - prev.built[i];
      if (delta > 0) {
        for (let n = 0; n < delta; n++) sfx.dropOne(n);
        if (cur.built[i] === cur.targets[i] && prev.built[i] !== cur.targets[i]) {
          setTimeout(() => sfx.lock(), delta * 50 + 80);
        }
        break;
      }
    }
  }
}

function cancelLoop() {
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
}

// ---------- storage ----------

function readBest() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const out = {};
    for (const k of Object.keys(DIFFICULTIES)) {
      const n = parseInt(parsed[k], 10);
      if (Number.isFinite(n)) out[k] = Math.max(0, Math.min(3, n));
    }
    return out;
  } catch {
    return {};
  }
}

function writeBest() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bestByDifficulty));
  } catch {
    // ignore
  }
}
