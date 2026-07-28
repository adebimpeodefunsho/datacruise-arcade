// Bootstrap, rAF loop, click & keyboard router.

import { createGame, tick, deploy, starsForResult } from "./state.js?v=14";
import { renderTitle, renderGameShell, renderEnd, patchGame } from "./render.js?v=14";
import { sfx, toggleMuted, isMuted } from "./sound.js?v=4";

const STORAGE_KEY = "datacruise.dashdrop.bestStars.v1";
const app = document.getElementById("app");

let state = null;
let bestStars = readBest();
let rafId = null;
let lastActionAt = 0;
let lastActionKey = "";

renderInitial();
document.addEventListener("click", onClick);
// pointerup as a click fallback: SVG <g> hit-testing can drop the synthetic
// `click` when mousedown and mouseup land on different children.
document.addEventListener("pointerup", onClick);
document.addEventListener("keydown", onKey);

// ---------- top-level render ----------

function renderInitial() {
  app.innerHTML = renderTitle(bestStars);
}

function showGameShell() {
  app.innerHTML = renderGameShell(state);
}

function showEnd() {
  app.innerHTML = renderEnd(state, bestStars);
}

// ---------- input routing ----------

function onClick(e) {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  const action = t.getAttribute("data-action");

  const now = performance.now();
  if (action === lastActionKey && now - lastActionAt < 250) return;
  lastActionAt = now;
  lastActionKey = action;

  if (action === "start-easy")   return startGame("easy");
  if (action === "start-medium") return startGame("medium");
  if (action === "start-hard")   return startGame("hard");
  if (action === "replay")       return startGame(state ? state.difficulty : "medium");

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

  if (action === "deploy" && state && state.phase === "playing") {
    sfx.press();
    deploy(state);
    return;
  }
}

function onKey(e) {
  if (!state || state.phase !== "playing") return;
  if (e.code === "Space" || e.key === " ") {
    e.preventDefault();
    sfx.press();
    deploy(state);
  }
}

function startGame(difficulty) {
  state = createGame(difficulty);
  showGameShell();
  startLoop();
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
      const stars = starsForResult(state);
      if (state.outcome === "win") sfx.win();
      else sfx.lose();
      if (stars > bestStars) {
        bestStars = stars;
        writeBest();
      }
      cancelLoop();
      window.DataCruiseResult && DataCruiseResult.ready({
        slug: "dashboard-drop", game: "Dashboard Drop",
        headline: state.correctCatches + "/6 charts",
        sub: state.outcome === "win" ? "clean dashboard! 📊" : "keep it tidy next time",
        stars: stars, starsMax: 3,
      });
      setTimeout(showEnd, 950);
      return;
    }
    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
}

function snapshotForSfx(s) {
  return {
    lockEvents: s.lockEvents,
    crashEvents: s.crashEvents,
    dissolveEvents: s.dissolveEvents,
    chompEvents: s.chompEvents,
  };
}

function playSfxForDelta(prev, cur) {
  if (cur.lockEvents > prev.lockEvents) sfx.lock();
  if (cur.crashEvents > prev.crashEvents) sfx.crash();
  if (cur.dissolveEvents > prev.dissolveEvents) sfx.dissolve();
  if (cur.chompEvents > prev.chompEvents) sfx.chomp();
}

function cancelLoop() {
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
}

// ---------- storage ----------

function readBest() {
  try {
    const n = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(3, n)) : 0;
  } catch { return 0; }
}

function writeBest() {
  try { localStorage.setItem(STORAGE_KEY, String(bestStars)); }
  catch { /* ignore */ }
}
