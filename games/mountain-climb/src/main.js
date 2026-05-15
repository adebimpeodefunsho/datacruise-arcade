// Bootstrap. Holds the single game state, handles clicks, renders.

import { createGame, pickCard, advanceDay } from "./state.js";
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
  if (action === "toggle-mute") {
    const next = !audio.isMuted();
    audio.setMuted(next);
    writeMuted(next);
    render();
    return;
  }
  if (action.startsWith("pick:")) {
    const index = Number.parseInt(action.slice("pick:".length), 10);
    if (!Number.isInteger(index)) return;
    const prevState = state;
    state = pickCard(state, index);
    if (state !== prevState && state.revealedToday) {
      // Play sound based on pick outcome
      if (state.revealedToday.wasHazard) audio.playStaminaDrain();
      else audio.playStaminaGain();
    }
    render();
    return;
  }
  if (action === "continue") {
    const prevState = state;
    state = advanceDay(state);
    if (state !== prevState) {
      audio.playClimb();
      if (state.phase === "ended") {
        setTimeout(() => {
          if (state.outcome === "win") audio.playWin();
          else audio.playLose();
        }, 320);
        // Exhausted finish counts as a win narratively but doesn't
        // update the best-ever star tracker (so a real 1+ star run
        // can still beat it).
        if (state.outcome === "win" && !state.exhaustedFinish && state.stars > bestStars) {
          bestStars = state.stars;
          writeBestStars(bestStars);
        }
      }
    }
    render();
    return;
  }
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

// ---------- URL seed support ----------

(function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const seed = params.get("seed");
  if (seed && /^[A-Z0-9]{2,8}$/.test(seed)) {
    state = createGame(seed);
    render();
  }
})();
