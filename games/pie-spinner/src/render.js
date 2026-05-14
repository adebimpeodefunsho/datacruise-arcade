// DOM/SVG rendering. innerHTML for title/end screens. For the live game we
// build the shell once and patch transforms / classes / text per frame.

import {
  VIEW, PIE, WHEEL, WEDGES, WEDGE_COUNT, WEDGE_DEG, WEDGE_FILLS,
  SLICE_DEFS, MAX_SPINS, CHEER_MS, starsForWin,
} from "./state.js?v=2";
import { isMuted } from "./sound.js?v=2";

// Bug-Bug rests just below the wheel, his hand reaching up through the wheel onto the SPIN hub.
const BUG_X = WHEEL.cx;
const BUG_Y = WHEEL.cy + WHEEL.r + 60;

// ---------- Geometry helpers ----------

function polar(cx, cy, r, deg) {
  // deg measured clockwise from 12 o'clock (top).
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx, cy, r, startDeg, endDeg) {
  const a = polar(cx, cy, r, startDeg);
  const b = polar(cx, cy, r, endDeg);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
}

// ---------- TITLE SCREEN ----------

export function renderTitle(best) {
  return `
  <div class="screen">
    <div class="card">
      ${bugSvg(130, 110)}
      <h1>BUG-BUG'S<br>PIE SPINNER</h1>
      <p class="subtitle">DATACRUISE ARCADE · GAME 3</p>
      <div class="howto">
        <p><strong>Goal:</strong> bring every slice of the pie chart to life. A slice wakes up when the spinner lands on its percentage.</p>
        <p><strong>Spin:</strong> click the <b>SPIN</b> button at the centre of the wheel (or click anywhere on the wheel). Bug-Bug gives it a push.</p>
        <p><strong>Match:</strong> the wheel lands on a number. If a still-grey slice has that percentage, it lights up in colour. If the number matches nothing, that's a miss — try again.</p>
        <p><strong>Eight spins:</strong> you only get <b>${MAX_SPINS} spins</b> to wake up all four slices. Miss too many and the pie stays grey.</p>
      </div>
      <p class="prompt">BEST: ${renderStarsInline(best || 0)}</p>
      <button data-action="start">START SPINNING</button>
    </div>
  </div>`;
}

function renderStarsInline(n) {
  if (!n) return `<span class="dim">★ ★ ★</span>`;
  let s = "";
  for (let i = 0; i < 3; i++) s += i < n ? "★" : `<span class="dim">★</span>`;
  return s;
}

// ---------- END SCREEN ----------

export function renderEnd(state, prevBest) {
  const win = state.outcome === "win";
  const stars = win ? starsForWin(state.spinsUsed) : 0;
  const isNewBest = win && stars > prevBest;
  return `
  <div class="screen">
    <div class="card">
      ${win ? "" : bugSvg(110, 92)}
      <h1>${win ? "PIE CHART COMPLETE!" : "OUT OF SPINS"}</h1>
      <p class="subtitle">${win ? "Bug-Bug, master of slices." : "The pie is still mostly grey."}</p>
      ${renderEndPie(state)}
      ${win ? `<p class="chart-trophy">🎉 YOU JUST CREATED A PIE CHART! 🎉</p>` : ""}
      ${renderStarsBig(stars)}
      ${isNewBest ? `<p class="new-best">NEW BEST!</p>` : ""}
      <div class="stats">
        Spins used: <b>${state.spinsUsed}</b> / ${MAX_SPINS}<br>
        Slices lit: <b>${state.slices.filter((s) => s.lit).length}</b> / ${state.slices.length}
      </div>
      <div class="end-actions">
        <button data-action="replay">PLAY AGAIN</button>
        <button class="ghost" data-action="back-to-title">TITLE SCREEN</button>
      </div>
    </div>
  </div>`;
}

function renderEndPie(state) {
  const cx = 80, cy = 80, r = 70;
  let cursor = 0;
  let paths = "";
  for (const s of state.slices) {
    const sweep = (s.value / 100) * 360;
    const end = cursor + sweep;
    const fill = s.lit ? s.color : "#DDD2B5";
    paths += `<path d="${slicePath(cx, cy, r, cursor, end)}" fill="${fill}" stroke="#1A1A1A" stroke-width="2"/>`;
    cursor = end;
  }
  return `<svg class="end-chart" viewBox="0 0 160 160" width="160" height="160">${paths}</svg>`;
}

function renderStarsBig(n) {
  let s = "";
  for (let i = 0; i < 3; i++) s += i < n ? "★" : `<span class="dim">★</span>`;
  return `<div class="stars">${s}</div>`;
}

// ---------- GAME SCREEN ----------

export function renderGameShell(state) {
  return `
  <div class="game">
    <div class="topbar">
      <div class="title">🥧 PIE SPINNER</div>
      <div class="spin-pill" id="spin-pill">
        <span class="spin-label">SPINS LEFT</span>
        <span class="spin-dots" id="spin-dots">${renderSpinDots(state)}</span>
        <span class="spin-num" id="spin-num">${MAX_SPINS - state.spinsUsed} / ${MAX_SPINS}</span>
      </div>
      <button class="sound-toggle" id="sound-toggle" data-action="toggle-sound" aria-label="Toggle sound">${isMuted() ? "🔇" : "🔊"}</button>
    </div>

    <div class="stage">
      <svg viewBox="0 0 ${VIEW.W} ${VIEW.H}" preserveAspectRatio="xMidYMid meet" id="stage-svg">
        <rect x="0" y="0" width="${VIEW.W}" height="${VIEW.H}" fill="#FFFFFF"/>

        <!-- "Match Me" label above the pie -->
        <g transform="translate(${PIE.cx}, ${PIE.cy - PIE.r - 28})">
          <rect x="-90" y="-22" width="180" height="38" rx="14" fill="#1A1A1A"/>
          <text x="0" y="5" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="20" fill="#FFF7E2" letter-spacing="2">MATCH ME!</text>
        </g>

        <!-- Pie chart group, slices rendered as stable elements for class toggles. -->
        <g id="pie">${renderPieSlices(state)}</g>

        <!-- Sparkles & spin-result chip -->
        <g id="pie-fx"></g>

        <!-- "TRY: 45 / 25 / 20 / 10" hint chip under the pie -->
        <g transform="translate(${PIE.cx}, ${PIE.cy + PIE.r + 36})">
          <rect x="-150" y="-20" width="300" height="36" rx="12" fill="#FFF7E2" stroke="#1A1A1A" stroke-width="3"/>
          <text x="0" y="5" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="800" font-size="16" fill="#1A1A1A">LAND ON: 45 · 25 · 20 · 10</text>
        </g>

        <!-- Spinner: pointer (stationary), wheel (rotates), centre button. -->
        <g id="wheel-pointer" transform="translate(${WHEEL.cx}, ${WHEEL.cy - WHEEL.r - 4})">
          <polygon points="-22,-22 22,-22 0,18" fill="#1A1A1A" stroke="#1A1A1A" stroke-width="3" stroke-linejoin="round"/>
          <polygon points="-14,-18 14,-18 0,10" fill="#FFC500"/>
        </g>

        <g id="wheel" data-action="spin" transform="translate(${WHEEL.cx}, ${WHEEL.cy}) rotate(0)">
          <circle r="${WHEEL.r + 8}" fill="#1A1A1A"/>
          ${renderWedges()}
          <circle r="${WHEEL.r}" fill="none" stroke="#1A1A1A" stroke-width="4"/>
        </g>

        <g id="wheel-hub" data-action="spin" transform="translate(${WHEEL.cx}, ${WHEEL.cy})">
          <circle r="42" fill="#FF6A1A" stroke="#1A1A1A" stroke-width="4"/>
          <circle r="42" fill="none" stroke="#FFF7E2" stroke-width="2" stroke-dasharray="3 3"/>
          <text id="hub-text" x="0" y="6" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="20" fill="#1A1A1A" letter-spacing="2">SPIN</text>
        </g>

        <!-- Bug-Bug sits below the spinner, vertical pose, hand pressing the SPIN button. -->
        <g id="bug" class="bug-group" transform="translate(${BUG_X}, ${BUG_Y})">
          <g class="bug-inner">${bugInnerSvg()}</g>
        </g>

        <!-- Spin result chip — centred at the top of the canvas, dynamic width based on message. -->
        <g id="result-chip" transform="translate(${VIEW.W / 2}, 50)" opacity="0">
          <rect id="result-chip-rect" x="-90" y="-26" width="180" height="52" rx="16" fill="#1A1A1A"/>
          <text id="result-chip-text" x="0" y="8" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="22" fill="#FFC500" letter-spacing="1">—</text>
        </g>
      </svg>
    </div>
  </div>`;
}

function renderSpinDots(state) {
  let s = "";
  for (let i = 0; i < MAX_SPINS; i++) {
    s += `<span class="spin-dot${i < state.spinsUsed ? " used" : ""}"></span>`;
  }
  return s;
}

function renderPieSlices(state) {
  let cursor = 0;
  let paths = "";
  for (let i = 0; i < state.slices.length; i++) {
    const s = state.slices[i];
    const sweep = (s.value / 100) * 360;
    const end = cursor + sweep;
    const midDeg = cursor + sweep / 2;
    const lbl = polar(PIE.cx, PIE.cy, PIE.r * 0.62, midDeg);
    paths += `
      <g class="slice ${s.lit ? "lit" : "dim"}" id="slice-${i}" data-color="${s.color}" style="--slice-color:${s.color}">
        <path class="slice-path" d="${slicePath(PIE.cx, PIE.cy, PIE.r, cursor, end)}"/>
        <text class="slice-label" x="${lbl.x.toFixed(2)}" y="${lbl.y.toFixed(2)}" text-anchor="middle" dominant-baseline="central">${s.label}</text>
      </g>`;
    cursor = end;
  }
  return paths;
}

function renderWedges() {
  let g = "";
  for (let i = 0; i < WEDGE_COUNT; i++) {
    const start = i * WEDGE_DEG;
    const end = start + WEDGE_DEG;
    const mid = start + WEDGE_DEG / 2;
    // Wedge slice path drawn at origin (wheel group translates).
    const a = polar(0, 0, WHEEL.r, start);
    const b = polar(0, 0, WHEEL.r, end);
    const path = `M 0 0 L ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${WHEEL.r} ${WHEEL.r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
    const lblPos = polar(0, 0, WHEEL.r * 0.68, mid);
    g += `
      <g class="wedge">
        <path d="${path}" fill="${WEDGE_FILLS[i]}" stroke="#1A1A1A" stroke-width="3"/>
        <text class="wedge-num" x="${lblPos.x.toFixed(2)}" y="${lblPos.y.toFixed(2)}" text-anchor="middle" dominant-baseline="central" transform="rotate(${mid.toFixed(2)} ${lblPos.x.toFixed(2)} ${lblPos.y.toFixed(2)})">${WEDGES[i]}</text>
      </g>`;
  }
  return g;
}

// ---------- LIVE PATCH ----------

export function patchGame(state) {
  // Wheel rotation
  const wheel = document.getElementById("wheel");
  if (wheel) {
    wheel.setAttribute("transform", `translate(${WHEEL.cx}, ${WHEEL.cy}) rotate(${state.angle.toFixed(2)})`);
  }

  // Hub text — flips to "..." while spinning, back to SPIN at rest.
  const hubText = document.getElementById("hub-text");
  if (hubText) hubText.textContent = state.spinning ? "..." : (state.spinsUsed >= MAX_SPINS ? "✕" : "SPIN");

  // Spin counter
  const num = document.getElementById("spin-num");
  if (num) num.textContent = `${Math.max(0, MAX_SPINS - state.spinsUsed)} / ${MAX_SPINS}`;
  const dots = document.getElementById("spin-dots");
  if (dots) dots.innerHTML = renderSpinDots(state);
  const pill = document.getElementById("spin-pill");
  if (pill) {
    const left = MAX_SPINS - state.spinsUsed;
    pill.classList.toggle("warn", left <= 3 && left > 1);
    pill.classList.toggle("danger", left <= 1);
  }

  // Slice lit/dim + just-lit pop
  for (let i = 0; i < state.slices.length; i++) {
    const node = document.getElementById(`slice-${i}`);
    if (!node) continue;
    const s = state.slices[i];
    node.classList.toggle("lit", s.lit);
    node.classList.toggle("dim", !s.lit);
    node.classList.toggle("just-lit", s.justLitMs > 0);
  }

  // Bug-Bug: JS-driven position so cheer / press bobs don't fight the SVG transform attribute.
  const bug = document.getElementById("bug");
  if (bug) {
    let dy = 0;
    if (state.cheerMs > 0) {
      const t = 1 - state.cheerMs / CHEER_MS;
      dy -= 30 * Math.sin(t * Math.PI);
    }
    if (state.spinning) {
      const phase = (state.spinElapsed / 180) * 2 * Math.PI;
      dy += 3 * Math.sin(phase);
    }
    bug.setAttribute("transform", `translate(${BUG_X}, ${(BUG_Y + dy).toFixed(2)})`);
  }

  // Result chip: three message variants with different widths + colours.
  const chip = document.getElementById("result-chip");
  const chipText = document.getElementById("result-chip-text");
  const chipRect = document.getElementById("result-chip-rect");
  if (chip && chipText && chipRect) {
    if (state.resultFlashMs > 0 && state.lastResult) {
      const r = state.lastResult;
      let txt, fill, width;
      if (r.matchedSliceIdx >= 0) {
        txt = `✓  ${r.value}%`;
        fill = "#FFC500";
        width = 180;
      } else if (r.alreadyLit) {
        txt = `OOPS — ${r.value}% ALREADY MATCHED`;
        fill = "#5DC1E8";
        width = 380;
      } else {
        txt = `✕  ${r.value}`;
        fill = "#FF6A1A";
        width = 180;
      }
      chip.setAttribute("opacity", "1");
      chipText.textContent = txt;
      chipText.setAttribute("fill", fill);
      chipRect.setAttribute("x", String(-width / 2));
      chipRect.setAttribute("width", String(width));
    } else {
      chip.setAttribute("opacity", "0");
    }
  }
}

// ---------- BUG-BUG SVG (reused from arcade series) ----------

// Title/end-screen Bug-Bug uses the upright in-game pose (head up, arm raised).
function bugSvg(w, h) {
  return `<svg class="big-bug" viewBox="-50 -70 100 140" width="${w}" height="${h}">${bugInnerSvg(true)}</svg>`;
}

// Vertical Bug-Bug — head at top, body below, arm reaching straight up.
// When `mini` (used inside title/end card), the arm is short so it stays inside the small viewBox.
function bugInnerSvg(mini = false) {
  // armTipY: rest the hand on the LOWER rim of the SPIN hub so the "SPIN" text above stays readable.
  // BUG_Y = WHEEL.cy + WHEEL.r + 60; hand absolute Y ends up at WHEEL.cy + 26 (≈ hub bottom rim, below the text baseline).
  const armTipY = mini ? -64 : -(WHEEL.r + 34);
  return `
    <!-- Arm reaches up to press the SPIN hub's lower rim. Thick stroke + chunky hand so it reads as a real arm, not a string. -->
    <g class="bug-arm">
      <line x1="0" y1="-24" x2="0" y2="${armTipY + 10}" stroke="#1A1A1A" stroke-width="13" stroke-linecap="round"/>
      <circle cx="0" cy="${armTipY}" r="13" fill="#FFC500" stroke="#1A1A1A" stroke-width="4"/>
    </g>
    <!-- Body: vertical ellipse -->
    <ellipse class="bug-body" cx="0" cy="14" rx="30" ry="40"/>
    <!-- Wing divider (horizontal line across the body) -->
    <line x1="-30" y1="14" x2="30" y2="14" stroke="#1A1A1A" stroke-width="3"/>
    <!-- Spots -->
    <circle class="bug-spot" cx="-13" cy="-2" r="4.5"/>
    <circle class="bug-spot" cx="13" cy="-4" r="4.5"/>
    <circle class="bug-spot" cx="-13" cy="28" r="4.5"/>
    <circle class="bug-spot" cx="13" cy="26" r="4.5"/>
    <!-- Head on top of body -->
    <circle class="bug-head" cx="0" cy="-32" r="16"/>
    <!-- Eyes (looking up at the wheel) -->
    <circle class="bug-eye" cx="-6" cy="-36" r="4"/>
    <circle class="bug-eye" cx="6" cy="-36" r="4"/>
    <circle class="bug-pupil" cx="-6" cy="-38" r="2"/>
    <circle class="bug-pupil" cx="6" cy="-38" r="2"/>
    <!-- Smile -->
    <path d="M -5 -26 Q 0 -22 5 -26" stroke="#1A1A1A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <!-- Antennae -->
    <path d="M -8 -46 Q -16 -54 -14 -62" stroke="#1A1A1A" stroke-width="2.5" fill="none"/>
    <circle cx="-14" cy="-62" r="3" fill="#1A1A1A"/>
    <path d="M 8 -46 Q 16 -54 14 -62" stroke="#1A1A1A" stroke-width="2.5" fill="none"/>
    <circle cx="14" cy="-62" r="3" fill="#1A1A1A"/>
    <!-- Six little legs hanging down -->
    <line x1="-24" y1="46" x2="-30" y2="58" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
    <line x1="-10" y1="52" x2="-14" y2="64" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
    <line x1="10" y1="52" x2="14" y2="64" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
    <line x1="24" y1="46" x2="30" y2="58" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
  `;
}
