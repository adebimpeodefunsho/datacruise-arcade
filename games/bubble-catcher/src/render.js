// DOM/SVG rendering. innerHTML for title/end. The game shell is built once
// then patched per frame: bubbles re-rendered, slots class-toggled, strings
// transformed, Bug-Bug positioned, flash chip + timer updated.

import {
  VIEW, SLOTS, BUG_Y, STRINGS_X, STRINGS_TOP_Y, STRINGS_BOTTOM_Y,
  MAX_MISSES, PULL_MS, CHEER_MS, starsForWin,
  DIFFICULTIES, DIFFICULTY_ORDER,
  CHART_AREA, CHART_AXIS_TICKS,
} from "./state.js?v=4";
import { isMuted } from "./sound.js?v=2";

// ---------- TITLE SCREEN ----------

export function renderTitle({ bestByDifficulty, currentDifficulty }) {
  const cur = DIFFICULTIES[currentDifficulty] || DIFFICULTIES.medium;
  const curBest = (bestByDifficulty && bestByDifficulty[currentDifficulty]) || 0;
  return `
  <div class="screen">
    <div class="card">
      ${bugSvg(140, 120)}
      <h1>BUG-BUG'S<br>BUBBLE CATCHER</h1>
      <p class="subtitle">DATACRUISE ARCADE · GAME 4</p>
      <div class="howto">
        <p><strong>Goal:</strong> snap every falling bubble into its sketched slot to build a bubble chart.</p>
        <p><strong>Watch:</strong> bubbles drop from the ceiling, each heading toward one slot. The slot's <b>size</b> and <b>position</b> tell you which one.</p>
        <p><strong>Pull:</strong> when a bubble lines up with its slot, click the matching numbered <b>string</b> on Bug-Bug's side. Time it right and the bubble snaps in alive.</p>
        <p><strong>Don't miss:</strong> ${MAX_MISSES} misses or the clock running out = chart stays sketched.</p>
      </div>
      <p class="prompt">PICK YOUR SPEED</p>
      <div class="difficulty-group" role="radiogroup" aria-label="Speed level">
        ${DIFFICULTY_ORDER.map((k) => renderDifficultyPill(k, k === currentDifficulty, bestByDifficulty?.[k] || 0)).join("")}
      </div>
      <p class="prompt">BEST ON ${cur.icon} ${cur.label}: ${renderStarsInline(curBest)}</p>
      <button data-action="start">START CATCHING</button>
    </div>
  </div>`;
}

function renderDifficultyPill(key, active, best) {
  const d = DIFFICULTIES[key];
  return `
    <button type="button" class="diff-pill ${active ? "active" : ""}" data-action="set-difficulty" data-difficulty="${key}" aria-pressed="${active}">
      <span class="diff-icon">${d.icon}</span>
      <span class="diff-label">${d.label}</span>
      <span class="diff-best">${renderStarsTiny(best)}</span>
    </button>`;
}

function renderStarsTiny(n) {
  if (!n) return `<span class="dim">★★★</span>`;
  let s = "";
  for (let i = 0; i < 3; i++) s += i < n ? "★" : `<span class="dim">★</span>`;
  return s;
}

function renderStarsInline(n) {
  if (!n) return `<span class="dim">★ ★ ★</span>`;
  let s = "";
  for (let i = 0; i < 3; i++) s += i < n ? "★" : `<span class="dim">★</span>`;
  return s;
}

// ---------- END SCREEN ----------

export function renderEnd({ state, prevBest, bestByDifficulty, currentDifficulty }) {
  const win = state.outcome === "win";
  const stars = win ? starsForWin(state.elapsedMs, state.config.roundMs) : 0;
  const isNewBest = win && stars > prevBest;
  const seconds = (state.elapsedMs / 1000).toFixed(1);
  const d = state.config;
  return `
  <div class="screen">
    <div class="card">
      ${win ? "" : bugSvg(110, 92)}
      <h1>${win ? "BUBBLE CHART BUILT!" : "ROUND OVER"}</h1>
      <p class="subtitle">${win ? "Bug-Bug, master of strings." : "The chart stayed sketched."} · ${d.icon} ${d.label}</p>
      ${renderEndChart(state)}
      ${win ? `<p class="chart-trophy">🎉 YOU JUST BUILT A BUBBLE CHART! 🎉</p>` : ""}
      ${renderStarsBig(stars)}
      ${isNewBest ? `<p class="new-best">NEW BEST ON ${d.label}!</p>` : ""}
      <div class="stats">
        Bubbles snapped: <b>${state.catches}</b> / ${SLOTS.length}<br>
        Misses: <b>${state.misses}</b> / ${MAX_MISSES}<br>
        Time: <b>${seconds}s</b> / ${(d.roundMs / 1000).toFixed(0)}s
      </div>
      <p class="prompt">CHANGE SPEED</p>
      <div class="difficulty-group" role="radiogroup" aria-label="Speed level">
        ${DIFFICULTY_ORDER.map((k) => renderDifficultyPill(k, k === currentDifficulty, bestByDifficulty?.[k] || 0)).join("")}
      </div>
      <div class="end-actions">
        <button data-action="replay">PLAY AGAIN</button>
        <button class="ghost" data-action="back-to-title">TITLE SCREEN</button>
      </div>
    </div>
  </div>`;
}

function renderEndChart(state) {
  // Scaled-down rendering of the final chart state.
  const sx = 0.22, sy = 0.22;
  const w = Math.round(VIEW.W * sx);
  const h = Math.round((SLOTS.reduce((m, s) => Math.max(m, s.y + s.r), 0) + 30) * sy);
  let bubbles = "";
  for (const s of state.slots) {
    const cx = s.x * sx, cy = s.y * sy, r = s.r * sx;
    const fill = s.filled ? s.color : "#EEE5C9";
    const stroke = s.filled ? "#1A1A1A" : "#9B8A5A";
    const dash = s.filled ? "" : `stroke-dasharray="${(4 * sx).toFixed(2)} ${(4 * sx).toFixed(2)}"`;
    bubbles += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="${(2.5).toFixed(2)}" ${dash}/>`;
    bubbles += `<text x="${cx.toFixed(2)}" y="${(cy + r * 0.18).toFixed(2)}" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="${(r * 0.9).toFixed(2)}" fill="${s.filled ? "#1A1A1A" : "#9B8A5A"}">${s.id}</text>`;
  }
  return `<svg class="end-chart" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${bubbles}</svg>`;
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
      <div class="title">🫧 BUBBLE CATCHER</div>
      <div class="pill level-badge level-${state.difficulty}">
        <span class="pill-label">SPEED</span>
        <span class="level-icon">${state.config.icon}</span>
        <span class="level-name">${state.config.label}</span>
      </div>
      <div class="pill" id="time-pill">
        <span class="pill-label">TIME</span>
        <span class="time-bar"><span class="time-fill" id="time-fill"></span></span>
        <span class="time-num" id="time-num">${(state.config.roundMs / 1000).toFixed(0)}s</span>
      </div>
      <div class="pill" id="miss-pill">
        <span class="pill-label">MISSES</span>
        <span class="miss-dots" id="miss-dots">${renderMissDots(state)}</span>
      </div>
      <button class="sound-toggle" id="sound-toggle" data-action="toggle-sound" aria-label="Toggle sound">${isMuted() ? "🔇" : "🔊"}</button>
    </div>

    <div class="stage">
      <svg viewBox="0 0 ${VIEW.W} ${VIEW.H}" preserveAspectRatio="xMidYMid meet" id="stage-svg">
        <!-- Backdrop: sky-paper gradient -->
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FFF7E2"/>
            <stop offset="100%" stop-color="#FFE0A8"/>
          </linearGradient>
          <pattern id="dashRing" patternUnits="userSpaceOnUse" width="8" height="8"/>
        </defs>
        <rect x="0" y="0" width="${VIEW.W}" height="${VIEW.H}" fill="url(#bgGrad)"/>

        <!-- "Build the chart" label up top -->
        <g transform="translate(${VIEW.W / 2 - 130}, 40)">
          <rect x="-110" y="-22" width="220" height="40" rx="14" fill="#1A1A1A"/>
          <text x="0" y="6" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="20" fill="#FFC500" letter-spacing="2">BUILD THE CHART!</text>
        </g>

        <!-- Chart frame: data-area background, gridlines, X/Y axes, ticks, labels, titles. -->
        <g id="axes">${renderAxes()}</g>

        <!-- Sketched bubble chart slots — dashed outlines with number badges. -->
        <g id="slots">${renderSlots(state)}</g>

        <!-- Falling bubbles layer (re-rendered each frame). -->
        <g id="bubbles">${renderBubbles(state)}</g>

        <!-- Ceiling beam where strings hang from. -->
        <line x1="${STRINGS_X[0] - 30}" y1="${STRINGS_TOP_Y - 4}" x2="${STRINGS_X[STRINGS_X.length - 1] + 30}" y2="${STRINGS_TOP_Y - 4}" stroke="#1A1A1A" stroke-width="6" stroke-linecap="round"/>

        <!-- Strings (5). Each is a clickable group: line + bead + numeric label. -->
        <g id="strings">${renderStrings(state)}</g>

        <!-- Bug-Bug under the strings. Slides horizontally to whichever was pulled last. -->
        <g id="bug" class="bug-group" transform="translate(${state.bugX}, ${BUG_Y})">
          <g class="bug-inner">${bugInnerSvg()}</g>
        </g>

        <!-- Flash chip — top centre, dynamic text. -->
        <g id="flash-chip" transform="translate(${VIEW.W / 2 + 140}, 40)" opacity="0">
          <rect id="flash-chip-rect" x="-110" y="-22" width="220" height="40" rx="14" fill="#1A1A1A"/>
          <text id="flash-chip-text" x="0" y="6" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="18" fill="#FFC500" letter-spacing="1">—</text>
        </g>
      </svg>
    </div>
  </div>`;
}

function renderMissDots(state) {
  let s = "";
  for (let i = 0; i < MAX_MISSES; i++) {
    s += `<span class="miss-dot${i < state.misses ? " used" : ""}"></span>`;
  }
  return s;
}

function renderAxes() {
  const { left: L, right: R, top: T, bottom: B } = CHART_AREA;
  const xAt = (v) => L + (v / 100) * (R - L);
  const yAt = (v) => B - (v / 100) * (B - T);
  let g = "";

  // Data-area background — a slightly brighter paper so the chart "page" reads
  // as the chart and the rest of the stage reads as scaffolding.
  g += `<rect class="chart-bg" x="${L}" y="${T}" width="${R - L}" height="${B - T}"/>`;

  // Gridlines — light dashed, drawn first so axes/ticks sit on top.
  for (const v of CHART_AXIS_TICKS) {
    if (v === 0) continue;
    const x = xAt(v);
    g += `<line class="grid-line" x1="${x}" y1="${T}" x2="${x}" y2="${B}"/>`;
  }
  for (const v of CHART_AXIS_TICKS) {
    if (v === 0) continue;
    const y = yAt(v);
    g += `<line class="grid-line" x1="${L}" y1="${y}" x2="${R}" y2="${y}"/>`;
  }

  // Axes (L-shape) with little arrowheads pointing outward.
  g += `<line class="axis-line" x1="${L}" y1="${B}" x2="${R + 14}" y2="${B}"/>`;
  g += `<line class="axis-line" x1="${L}" y1="${B}" x2="${L}" y2="${T - 14}"/>`;
  g += `<polygon class="axis-arrow" points="${R + 18},${B} ${R + 8},${B - 6} ${R + 8},${B + 6}"/>`;
  g += `<polygon class="axis-arrow" points="${L},${T - 18} ${L - 6},${T - 8} ${L + 6},${T - 8}"/>`;

  // X ticks + numeric labels.
  for (const v of CHART_AXIS_TICKS) {
    const x = xAt(v);
    g += `<line class="axis-tick" x1="${x}" y1="${B}" x2="${x}" y2="${B + 7}"/>`;
    g += `<text class="axis-text" x="${x}" y="${B + 22}" text-anchor="middle">${v}</text>`;
  }
  // Y ticks + numeric labels.
  for (const v of CHART_AXIS_TICKS) {
    const y = yAt(v);
    g += `<line class="axis-tick" x1="${L - 7}" y1="${y}" x2="${L}" y2="${y}"/>`;
    g += `<text class="axis-text" x="${L - 11}" y="${y + 5}" text-anchor="end">${v}</text>`;
  }

  // Axis titles.
  g += `<text class="axis-title" x="${(L + R) / 2}" y="${B + 44}" text-anchor="middle">VALUE X</text>`;
  g += `<text class="axis-title" transform="translate(${L - 40}, ${(T + B) / 2}) rotate(-90)" text-anchor="middle">VALUE Y</text>`;

  return g;
}

function renderSlots(state) {
  let g = "";
  for (const s of state.slots) {
    const cls = s.filled ? "slot filled" : "slot empty";
    g += `
      <g class="${cls}" id="slot-${s.id}" style="--slot-color:${s.color}">
        <circle class="slot-ring" cx="${s.x}" cy="${s.y}" r="${s.r}"/>
        <circle class="slot-fill" cx="${s.x}" cy="${s.y}" r="${s.r}"/>
        <text class="slot-num" x="${s.x}" y="${s.y + s.r * 0.34}" text-anchor="middle" font-size="${(s.r * 1.05).toFixed(1)}">${s.id}</text>
      </g>`;
  }
  return g;
}

function renderBubbles(state) {
  let g = "";
  for (const b of state.bubbles) {
    g += `
      <g class="bubble" data-bubble-id="${b.id}">
        <circle class="bubble-shadow" cx="${b.x.toFixed(2)}" cy="${(b.y + 4).toFixed(2)}" r="${b.r.toFixed(2)}" fill="rgba(0,0,0,0.18)"/>
        <circle class="bubble-body" cx="${b.x.toFixed(2)}" cy="${b.y.toFixed(2)}" r="${b.r.toFixed(2)}" fill="${b.color}" stroke="#1A1A1A" stroke-width="3.5"/>
        <ellipse class="bubble-shine" cx="${(b.x - b.r * 0.35).toFixed(2)}" cy="${(b.y - b.r * 0.4).toFixed(2)}" rx="${(b.r * 0.32).toFixed(2)}" ry="${(b.r * 0.18).toFixed(2)}" fill="rgba(255,255,255,0.7)"/>
      </g>`;
  }
  return g;
}

function renderStrings(state) {
  let g = "";
  for (let i = 0; i < STRINGS_X.length; i++) {
    const x = STRINGS_X[i];
    const id = i + 1;
    g += `
      <g class="string" id="string-${id}" data-action="pull" data-string="${id}" transform="translate(0, 0)">
        <line class="string-line" x1="${x}" y1="${STRINGS_TOP_Y}" x2="${x}" y2="${STRINGS_BOTTOM_Y}" stroke="#FFC500" stroke-width="3" stroke-linecap="round"/>
        <line class="string-line-glow" x1="${x}" y1="${STRINGS_TOP_Y}" x2="${x}" y2="${STRINGS_BOTTOM_Y}" stroke="rgba(255,255,255,0.55)" stroke-width="1" stroke-linecap="round"/>
        <circle class="string-bead" cx="${x}" cy="${STRINGS_BOTTOM_Y}" r="18" fill="#FF6A1A" stroke="#1A1A1A" stroke-width="3"/>
        <circle class="string-bead-shine" cx="${x - 5}" cy="${STRINGS_BOTTOM_Y - 5}" r="4" fill="rgba(255,255,255,0.75)"/>
        <text class="string-num" x="${x}" y="${STRINGS_BOTTOM_Y + 6}" text-anchor="middle" font-size="20">${id}</text>
      </g>`;
  }
  return g;
}

// ---------- LIVE PATCH ----------

export function patchGame(state) {
  // Timer bar + label — proportional thresholds so each level pulses the
  // pill at the same fraction-remaining instead of a hard-coded second count.
  const roundMs = state.config.roundMs;
  const fill = document.getElementById("time-fill");
  const tnum = document.getElementById("time-num");
  if (fill && tnum) {
    const remaining = Math.max(0, roundMs - state.elapsedMs);
    fill.style.width = `${(remaining / roundMs * 100).toFixed(2)}%`;
    tnum.textContent = `${(remaining / 1000).toFixed(1)}s`;
  }
  const tpill = document.getElementById("time-pill");
  if (tpill) {
    const frac = (roundMs - state.elapsedMs) / roundMs;
    tpill.classList.toggle("warn", frac <= 0.35 && frac > 0.15);
    tpill.classList.toggle("danger", frac <= 0.15);
  }

  // Miss dots
  const dots = document.getElementById("miss-dots");
  if (dots) dots.innerHTML = renderMissDots(state);
  const mpill = document.getElementById("miss-pill");
  if (mpill) {
    const left = MAX_MISSES - state.misses;
    mpill.classList.toggle("warn", left === 2);
    mpill.classList.toggle("danger", left <= 1);
  }

  // Bubbles — re-render (count is small).
  const bubbles = document.getElementById("bubbles");
  if (bubbles) bubbles.innerHTML = renderBubbles(state);

  // Slots — toggle filled class + just-filled pop.
  for (const s of state.slots) {
    const node = document.getElementById(`slot-${s.id}`);
    if (!node) continue;
    node.classList.toggle("filled", s.filled);
    node.classList.toggle("empty", !s.filled);
    node.classList.toggle("just-filled", s.justFilledMs > 0);
  }

  // String pulls — animate the group down a few px during PULL_MS.
  for (let i = 0; i < state.stringPullMs.length; i++) {
    const node = document.getElementById(`string-${i + 1}`);
    if (!node) continue;
    const t = state.stringPullMs[i] / PULL_MS;
    // Sin-curve dip: 0 → 1 → 0 over PULL_MS, peak at the midpoint.
    const dy = t > 0 ? Math.sin((1 - t) * Math.PI) * 26 : 0;
    node.setAttribute("transform", `translate(0, ${dy.toFixed(2)})`);
    node.classList.toggle("pulled", t > 0);
  }

  // Bug-Bug — slide horizontally (state.bugX) + bob vertically during cheer.
  const bug = document.getElementById("bug");
  if (bug) {
    let dy = 0;
    if (state.cheerMs > 0) {
      const t = 1 - state.cheerMs / CHEER_MS;
      dy -= 24 * Math.sin(t * Math.PI);
    }
    bug.setAttribute("transform", `translate(${state.bugX.toFixed(2)}, ${(BUG_Y + dy).toFixed(2)})`);
  }

  // Flash chip
  const chip = document.getElementById("flash-chip");
  const chipText = document.getElementById("flash-chip-text");
  const chipRect = document.getElementById("flash-chip-rect");
  if (chip && chipText && chipRect) {
    if (state.flashMs > 0) {
      let fillCol;
      if (state.flashKind === "ok") fillCol = "#FFC500";
      else if (state.flashKind === "wrong") fillCol = "#FF6A1A";
      else fillCol = "#5DC1E8";
      chip.setAttribute("opacity", "1");
      chipText.textContent = state.flashText;
      chipText.setAttribute("fill", fillCol);
    } else {
      chip.setAttribute("opacity", "0");
    }
  }
}

// ---------- BUG-BUG SVG ----------

// Title/end Bug-Bug — same vertical pose used on the stage. No reaching arms;
// just a standing bug. He moves under the active string during gameplay.
function bugSvg(w, h) {
  return `<svg class="big-bug" viewBox="-50 -70 100 140" width="${w}" height="${h}">${bugInnerSvg()}</svg>`;
}

function bugInnerSvg() {
  return `
    <!-- Body: vertical ellipse -->
    <ellipse class="bug-body" cx="0" cy="14" rx="30" ry="40"/>
    <!-- Wing divider -->
    <line x1="-30" y1="14" x2="30" y2="14" stroke="#1A1A1A" stroke-width="3"/>
    <!-- Spots -->
    <circle class="bug-spot" cx="-13" cy="-2" r="4.5"/>
    <circle class="bug-spot" cx="13" cy="-4" r="4.5"/>
    <circle class="bug-spot" cx="-13" cy="28" r="4.5"/>
    <circle class="bug-spot" cx="13" cy="26" r="4.5"/>
    <!-- Head -->
    <circle class="bug-head" cx="0" cy="-32" r="16"/>
    <!-- Eyes -->
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
    <!-- Six legs -->
    <line x1="-24" y1="46" x2="-30" y2="58" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
    <line x1="-10" y1="52" x2="-14" y2="64" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
    <line x1="10" y1="52" x2="14" y2="64" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
    <line x1="24" y1="46" x2="30" y2="58" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
  `;
}
