// Bootstrap, rAF loop, click router.

import { createGame, tick, startSpin, WEDGE_COUNT, WEDGE_DEG, starsForWin } from "./state.js?v=2";
import { renderTitle, renderGameShell, renderEnd, patchGame } from "./render.js?v=2";
import { sfx, startSpinTicker, stopSpinTicker, toggleMuted, isMuted } from "./sound.js?v=2";

const STORAGE_KEY = "datacruise.piespinner.bestStars.v1";
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

// ---------- click routing ----------

function onClick(e) {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  const action = t.getAttribute("data-action");

  // Dedup click + pointerup pair from the same gesture.
  const now = performance.now();
  if (action === lastActionKey && now - lastActionAt < 250) return;
  lastActionAt = now;
  lastActionKey = action;

  if (action === "start" || action === "replay") {
    state = createGame();
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

  if (action === "spin" && state && state.phase === "playing") {
    if (state.spinning) return;
    sfx.press();
    startSpin(state);
    startSpinTicker(() => currentWedgeIdx(state));
    return;
  }
}

function currentWedgeIdx(s) {
  const norm = ((s.angle % 360) + 360) % 360;
  // Wedge at top: wedge i is at top when angle ≡ -i*WEDGE_DEG (mod 360).
  // So idx = round(-norm / WEDGE_DEG) mod WEDGE_COUNT.
  const idx = Math.round((360 - norm) / WEDGE_DEG) % WEDGE_COUNT;
  return idx;
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
      stopSpinTicker();
      if (state.outcome === "win") {
        sfx.win();
        const stars = starsForWin(state.spinsUsed);
        if (stars > bestStars) {
          bestStars = stars;
          writeBest();
        }
      } else {
        sfx.lose();
      }
      cancelLoop();
      const rStars = state.outcome === "win" ? starsForWin(state.spinsUsed) : 0;
      window.DataCruiseResult && DataCruiseResult.ready({
        slug: "pie-spinner", game: "Pie Spinner",
        headline: state.outcome === "win" ? state.spinsUsed + " spins" : "Out of spins!",
        sub: state.outcome === "win" ? "perfect pie 🥧" : "so close",
        stars: rStars, starsMax: 3,
      });
      // Brief delay so the final slice's pop animation is visible before the end card slides in.
      setTimeout(showEnd, 900);
      return;
    }
    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
}

function snapshotForSfx(s) {
  return {
    spinning: s.spinning,
    matchEvents: s.matchEvents,
    missEvents: s.missEvents,
    alreadyLitEvents: s.alreadyLitEvents,
  };
}

function playSfxForDelta(prev, cur) {
  // Spin just resolved (transition spinning -> not spinning).
  if (prev.spinning && !cur.spinning) {
    stopSpinTicker();
    if (cur.matchEvents > prev.matchEvents) sfx.match();
    else if (cur.alreadyLitEvents > prev.alreadyLitEvents) sfx.alreadyLit();
    else if (cur.missEvents > prev.missEvents) sfx.miss();
  }
}

function cancelLoop() {
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
  stopSpinTicker();
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
