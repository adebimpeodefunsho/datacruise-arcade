// Bootstrap. Holds the single game state, handles clicks, renders.

import { createGame, applyAction, MAX_STAMINA } from "./state.js";
import { generateSeedCode } from "./rng.js";
import { renderTitle, renderGame, renderEnd } from "./render.js";
import * as audio from "./audio.js";

const STORAGE_KEY = "datacruise.mountainclimb.v1";
const MUTE_KEY = "datacruise.mountainclimb.muted";
const app = document.getElementById("app");

let state = null;
let bestStars = readBestStars();
audio.setMuted(readMuted());

renderInitial();

document.addEventListener("click", onClick);

// ---------- initial render ----------

function renderInitial() {
  app.innerHTML = renderTitle(bestStars);
}

// ---------- click router ----------

function onClick(e) {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const action = target.getAttribute("data-action");
  if (target.hasAttribute("disabled")) return;

  if (action === "start") {
    state = createGame(generateSeedCode());
    render();
    return;
  }
  if (action === "new-game") {
    state = createGame(generateSeedCode());
    render();
    return;
  }
  if (action === "replay-seed") {
    if (state && state.seed) {
      state = createGame(state.seed);
      render();
    }
    return;
  }
  if (action === "share-seed") {
    if (state && state.seed) {
      const url = window.location.origin + window.location.pathname + "?seed=" + state.seed;
      copy(url).then(() => flash(target, "Copied!"));
    }
    return;
  }
  if (action === "toggle-mute") {
    const next = !audio.isMuted();
    audio.setMuted(next);
    writeMuted(next);
    // Re-render the current screen so the icon updates everywhere.
    render();
    return;
  }
  if (action.startsWith("play:")) {
    const move = action.slice("play:".length);
    const prevState = state;
    state = applyAction(state, move);
    if (state.lastResult && state !== prevState) {
      playActionSounds(state.lastResult);
    }
    if (state.phase === "ended") {
      // Slight delay so the action sound doesn't collide with the win/lose tone.
      setTimeout(() => {
        if (state.outcome === "win") audio.playWin();
        else audio.playLose();
      }, 320);
      if (state.outcome === "win" && state.stars > bestStars) {
        bestStars = state.stars;
        writeBestStars(bestStars);
      }
    }
    render();
    return;
  }
}

function playActionSounds(result) {
  if (result.action === "rest") audio.playRest();
  else if (result.action === "climb") audio.playClimb();
  else if (result.action === "sprint") audio.playSprint();
  const delta = result.staminaAfter - result.staminaBefore;
  if (delta > 0) audio.playStaminaGain();
  else if (delta < 0) audio.playStaminaDrain();
}

// ---------- render ----------

function render() {
  if (!state || state.phase === "title") {
    app.innerHTML = renderTitle(bestStars);
    return;
  }
  if (state.phase === "playing") {
    app.innerHTML = renderGame(state);
    return;
  }
  if (state.phase === "ended") {
    app.innerHTML = renderEnd(state);
    return;
  }
}

// ---------- storage ----------

function readBestStars() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Math.max(0, Math.min(3, parsed.bestStars || 0));
  } catch {
    return 0;
  }
}

function writeBestStars(n) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bestStars: n }));
  } catch {
    // ignore
  }
}

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeMuted(m) {
  try {
    localStorage.setItem(MUTE_KEY, m ? "true" : "false");
  } catch {
    // ignore
  }
}

// ---------- utilities ----------

function copy(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    resolve();
  });
}

function flash(el, msg) {
  const original = el.textContent;
  el.textContent = msg;
  setTimeout(() => { el.textContent = original; }, 1200);
}

// ---------- URL seed support ----------

(function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const seed = params.get("seed");
  if (seed && /^[A-Z0-9]{2,8}$/.test(seed)) {
    state = createGame(seed);
    render();
  }
})();
