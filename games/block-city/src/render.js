// DOM/SVG rendering. Reads state, writes innerHTML for title/end screens
// and patches transforms/text for the live game stage.

import {
  VIEW, AXIS_W, GROUND_Y, TOP_Y, FLOOR_H, FLOOR_W,
  PLOT_COUNT, BUG_Y, CARRY_MAX,
  DIFFICULTIES, DIFFICULTY_ORDER,
  plotCenterX,
} from "./state.js?v=14";
import { isMuted } from "./sound.js?v=14";

const PLOT_WIDTH = (VIEW.W - AXIS_W - 20) / PLOT_COUNT;
const PLOT_LABELS = ["Bar 1", "Bar 2", "Bar 3", "Bar 4"];

// ---------- TITLE SCREEN ----------

export function renderTitle(bestByDifficulty) {
  return `
  <div class="screen">
    <div class="card">
      ${bugSvg(130, 110)}
      <h1>BUG-BUG'S<br>BLOCK CITY</h1>
      <p class="subtitle">DATACRUISE ARCADE · GAME 2</p>
      <div class="howto">
        <p><strong>Goal:</strong> match every building's target height EXACTLY before the timer runs out — that's how you finish your bar chart.</p>
        <p><strong>Walk:</strong> click the ground or hold <b>←</b> / <b>→</b> arrow keys. Bug-Bug catches any falling block that lands on him.</p>
        <p><strong>Carry max 4:</strong> Bug-Bug can only hold <b>4 blocks</b> at a time. When the tracker shows <b>4/4</b>, drop them right away — Bug-Bug can't catch any more until you do, so you'd just be wasting time.</p>
        <p><strong>Drop:</strong> click the orange <b>CLICK TO DROP</b> button at the base of a plot, or press <b>1</b>, <b>2</b>, <b>3</b>, <b>4</b> for Bar 1, Bar 2, Bar 3, Bar 4. Drops are instant.</p>
        <p><strong>Demolish to win:</strong> each plot must end <em>exactly</em> on its target. If you overshoot, click the red <b>−</b> to remove a floor — overbuilt plots can't lock, so you must demolish to complete the bar chart.</p>
      </div>
      <p class="prompt">CHOOSE YOUR SPEED</p>
      <div class="speed-row">
        ${DIFFICULTY_ORDER.map((k) => renderSpeedButton(DIFFICULTIES[k], bestByDifficulty[k] || 0)).join("")}
      </div>
    </div>
  </div>`;
}

function renderSpeedButton(d, best) {
  return `
    <button class="speed-btn" data-action="start:${d.key}">
      <span class="speed-emoji">${d.emoji}</span>
      <span class="speed-name">${d.label}</span>
      <span class="speed-hint">${d.hint}</span>
      <span class="speed-best">${renderStarsInline(best)}</span>
    </button>`;
}

function renderStarsInline(n) {
  if (!n) return `<span class="dim">— — —</span>`;
  let s = "";
  for (let i = 0; i < 3; i++) s += i < n ? "★" : `<span class="dim">★</span>`;
  return s;
}

// ---------- END SCREEN ----------

export function renderEnd(state, bestForThisDifficulty) {
  const win = state.outcome === "win";
  const timeUsed = Math.round(state.elapsedMs / 100) / 10;
  const d = state.settings;
  const isPersonalBest = win && state.stars > bestForThisDifficulty;
  return `
  <div class="screen">
    <div class="card">
      ${win ? "" : bugSvg(110, 92)}
      <h1>${win ? "CITY BUILT!" : "TIME'S UP"}</h1>
      <p class="subtitle">${d.emoji} ${d.label} · ${win ? "Bug-Bug, the master architect." : "The skyline is unfinished."}</p>
      ${win ? renderEndChart(state) : ""}
      ${win ? `<p class="chart-trophy">🎉 YOU JUST PLOTTED A BAR CHART! 🎉</p>` : ""}
      ${renderStarsBig(state.stars)}
      ${isPersonalBest ? `<p class="new-best">NEW BEST!</p>` : ""}
      <div class="stats">
        Time used: <b>${timeUsed}s</b><br>
        Demolitions: <b>${state.demolitions}</b><br>
        Blocks caught: <b>${state.blocksCaught}</b> &nbsp; · &nbsp; missed: <b>${state.blocksMissed}</b>
      </div>
      <div class="end-actions">
        <button data-action="replay:${state.difficulty}">PLAY AGAIN (${d.label})</button>
        <button class="ghost" data-action="back-to-title">CHANGE SPEED</button>
      </div>
    </div>
  </div>`;
}

function renderEndChart(state) {
  const w = 320, h = 150;
  const padX = 18, padTop = 14, padBot = 28;
  const innerH = h - padTop - padBot;
  const maxVal = Math.max(...state.targets, 1);
  const n = state.targets.length;
  const bw = 44;
  const gap = (w - padX * 2 - bw * n) / (n - 1);
  let bars = "";
  for (let i = 0; i < n; i++) {
    const bh = (state.built[i] / maxVal) * innerH;
    const x = padX + i * (bw + gap);
    const y = padTop + innerH - bh;
    bars += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="#FFC500" stroke="#1A1A1A" stroke-width="2.5" rx="3"/>`;
    bars += `<text x="${x + bw / 2}" y="${y - 5}" text-anchor="middle" font-family="Fredoka" font-size="13" font-weight="800" fill="#5C2A0F">${state.built[i]}</text>`;
    bars += `<text x="${x + bw / 2}" y="${padTop + innerH + 18}" text-anchor="middle" font-family="Fredoka" font-size="14" font-weight="800" fill="#1A1A1A">${PLOT_LABELS[i]}</text>`;
  }
  return `<svg class="end-chart" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <line x1="${padX - 8}" y1="${padTop + innerH}" x2="${w - padX + 8}" y2="${padTop + innerH}" stroke="#1A1A1A" stroke-width="3"/>
    ${bars}
  </svg>`;
}

function renderStarsBig(n) {
  const cap = 3;
  let s = "";
  for (let i = 0; i < cap; i++) s += i < n ? "★" : `<span class="dim">★</span>`;
  return `<div class="stars">${s}</div>`;
}

// ---------- GAME SCREEN ----------

export function renderGameShell(state) {
  const d = state.settings;
  return `
  <div class="game">
    <div class="topbar">
      <div class="title">${d.emoji} ${d.label}</div>
      <div class="carry-pill" id="carry-pill">
        <span class="carry-label">BUG-BUG CARRYING</span>
        <span class="carry-slots" id="carry-slots">
          ${Array.from({length: CARRY_MAX}).map(() => `<span class="slot"></span>`).join("")}
        </span>
        <span class="carry-num" id="carry-num">0 / ${CARRY_MAX}</span>
      </div>
      <button class="sound-toggle" id="sound-toggle" data-action="toggle-sound" aria-label="Toggle sound">${isMuted() ? "🔇" : "🔊"}</button>
      <div class="timer" id="timer">0:${String(Math.floor(d.timeLimitMs/1000)).padStart(2,"0")}</div>
    </div>
    <div class="stage">
      <div class="max-warning" id="max-warning" aria-live="polite">
        <span class="max-warning-icon">⚠</span>
        BUG-BUG IS FULL (${CARRY_MAX} / ${CARRY_MAX}) — DROP NOW!
      </div>
      <svg viewBox="0 0 ${VIEW.W} ${VIEW.H}" preserveAspectRatio="xMidYMid meet" id="stage-svg">
        <rect x="0" y="0" width="${VIEW.W}" height="${VIEW.H}" fill="#FFFFFF"/>
        <rect x="${AXIS_W}" y="${TOP_Y - 40}" width="${VIEW.W - AXIS_W - 20}" height="${GROUND_Y - TOP_Y + 60}" fill="#FAF4D6"/>

        <g id="plot-columns">${renderPlotColumns()}</g>

        <g id="axis-grid">${renderAxisGrid()}</g>

        <g id="targets">${renderTargets(state.targets, state.built)}</g>

        <g id="stacks">${renderStacks(state.targets, state.built)}</g>

        <g id="plot-labels">${renderPlotLabels()}</g>

        <g id="demolish">${renderDemolish(state.targets, state.built)}</g>

        <line class="ground" x1="${AXIS_W}" y1="${GROUND_Y}" x2="${VIEW.W - 20}" y2="${GROUND_Y}"/>

        <g id="falling"></g>

        <g id="bug" class="bug-group" transform="translate(${VIEW.W / 2}, ${BUG_Y})">${bugInnerSvg()}</g>

        <g id="drop-hints"></g>
      </svg>
    </div>
  </div>`;
}

function renderAxisGrid() {
  let g = "";
  for (let i = 0; i <= 10; i++) {
    const y = GROUND_Y - i * FLOOR_H;
    if (i > 0) {
      g += `<line class="gridline" x1="${AXIS_W}" y1="${y}" x2="${VIEW.W - 20}" y2="${y}"/>`;
    }
    g += `<line class="axis-mark" x1="${AXIS_W - 8}" y1="${y}" x2="${AXIS_W}" y2="${y}"/>`;
    g += `<text class="axis-label" x="${AXIS_W - 14}" y="${y + 5}" text-anchor="end">${i}</text>`;
  }
  g += `<line class="axis-mark" x1="${AXIS_W}" y1="${TOP_Y}" x2="${AXIS_W}" y2="${GROUND_Y}"/>`;
  return g;
}

function renderPlotColumns() {
  let g = "";
  for (let i = 0; i < PLOT_COUNT; i++) {
    const cx = plotCenterX(i);
    const x = cx - PLOT_WIDTH / 2 + 4;
    const w = PLOT_WIDTH - 8;
    g += `<rect class="plot-column" x="${x}" y="${TOP_Y}" width="${w}" height="${GROUND_Y - TOP_Y}" rx="8"/>`;
  }
  return g;
}

function renderPlotLabels() {
  let g = "";
  for (let i = 0; i < PLOT_COUNT; i++) {
    const cx = plotCenterX(i);
    g += `<text class="plot-label" x="${cx}" y="${GROUND_Y + 68}">${PLOT_LABELS[i]}</text>`;
  }
  return g;
}

function renderTargets(targets, built) {
  let g = "";
  for (let i = 0; i < PLOT_COUNT; i++) {
    const cx = plotCenterX(i);
    const t = targets[i];
    const y = GROUND_Y - t * FLOOR_H;
    const locked = built[i] === t;
    const lockClass = locked ? " locked" : "";
    const half = PLOT_WIDTH / 2 - 4;
    g += `<line class="target-line${lockClass}" x1="${cx - half}" y1="${y}" x2="${cx + half}" y2="${y}"/>`;
    g += `<text class="plot-target${locked ? " plot-target-locked" : ""}" x="${cx}" y="${y - 8}">${locked ? "✓" : "🎯" + t}</text>`;
  }
  return g;
}

function renderStacks(targets, built) {
  let g = "";
  for (let i = 0; i < PLOT_COUNT; i++) {
    const cx = plotCenterX(i);
    const t = targets[i];
    const cur = built[i];
    const locked = cur === t;
    for (let f = 0; f < cur; f++) {
      const y = GROUND_Y - (f + 1) * FLOOR_H;
      const isOver = f >= t;
      const cls = isOver ? "block block-over" : `block block-built${locked ? " locked" : ""}`;
      g += `<rect class="${cls}" x="${cx - FLOOR_W / 2}" y="${y + 2}" width="${FLOOR_W}" height="${FLOOR_H - 4}"/>`;
    }
  }
  return g;
}

function renderDemolish(targets, built) {
  let g = "";
  for (let i = 0; i < PLOT_COUNT; i++) {
    if (built[i] <= targets[i]) continue;
    const cx = plotCenterX(i);
    const cy = GROUND_Y - (built[i]) * FLOOR_H - FLOOR_H / 2;
    g += `<g class="demolish-btn" data-action="demolish:${i}" transform="translate(${cx + FLOOR_W / 2 + 14}, ${cy})">
      <circle class="demolish-bg" cx="0" cy="0" r="18"/>
      <text class="demolish-glyph" x="0" y="7">−</text>
    </g>`;
  }
  return g;
}

function renderDropButtons(state) {
  if (state.carried === 0) return "";
  let g = "";
  for (let i = 0; i < PLOT_COUNT; i++) {
    if (state.built[i] === state.targets[i]) continue;     // locked plot
    if (state.built[i] > state.targets[i]) continue;       // overbuilt — must demolish first
    const cx = plotCenterX(i);
    const cy = GROUND_Y + 28;
    // Nested group: outer holds the SVG translate, inner runs the bounce
    // animation so the CSS transform doesn't override the position.
    // data-action="drop:N" — INSTANT drop (Bug-Bug stays put).
    g += `<g class="drop-button" data-action="drop:${i}" transform="translate(${cx}, ${cy})">
      <g class="drop-bounce">
        <rect class="drop-bg" x="-82" y="-18" width="164" height="36" rx="14"/>
        <text class="drop-glyph" x="0" y="6">CLICK TO DROP</text>
      </g>
    </g>`;
  }
  return g;
}

// ---------- LIVE PATCH ----------

export function patchGame(state) {
  // Timer
  const timer = document.getElementById("timer");
  if (timer) {
    const s = Math.ceil(state.timeLeftMs / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    timer.textContent = `${m}:${String(r).padStart(2, "0")}`;
    timer.classList.toggle("warn", state.timeLeftMs < 20000 && state.timeLeftMs >= 8000);
    timer.classList.toggle("danger", state.timeLeftMs < 8000);
  }

  // Carry indicator
  const pill = document.getElementById("carry-pill");
  const slots = document.getElementById("carry-slots");
  const carryNum = document.getElementById("carry-num");
  if (pill && slots && carryNum) {
    const children = slots.children;
    for (let i = 0; i < CARRY_MAX; i++) {
      if (children[i]) children[i].classList.toggle("filled", i < state.carried);
    }
    carryNum.textContent = `${state.carried} / ${CARRY_MAX}`;
    pill.classList.toggle("has", state.carried > 0);
    pill.classList.toggle("max", state.carried >= CARRY_MAX);
  }

  // Bug
  const bug = document.getElementById("bug");
  if (bug) {
    const sx = state.bugFacing < 0 ? -1 : 1;
    bug.setAttribute("transform", `translate(${state.bugX}, ${BUG_Y}) scale(${sx}, 1)`);
  }

  patchFalling(state);

  // Stage classes for plot-column tint when carrying
  const svg = document.getElementById("stage-svg");
  if (svg) {
    svg.classList.toggle("has-carry", state.carried > 0);
    svg.classList.toggle("max-carry", state.carried >= CARRY_MAX);
  }

  // Banner warning when Bug-Bug is at max load
  const maxWarn = document.getElementById("max-warning");
  if (maxWarn) maxWarn.classList.toggle("show", state.carried >= CARRY_MAX);

  patchGroup("stacks", renderStacks(state.targets, state.built));
  patchGroup("targets", renderTargets(state.targets, state.built));
  patchGroup("demolish", renderDemolish(state.targets, state.built));
  patchGroup("drop-hints", renderDropButtons(state));
}

function patchGroup(id, html) {
  const node = document.getElementById(id);
  if (node && node.innerHTML !== html) node.innerHTML = html;
}

function patchFalling(state) {
  const layer = document.getElementById("falling");
  if (!layer) return;
  const present = new Set();
  for (const b of state.falling) {
    present.add(String(b.id));
    let el = layer.querySelector(`[data-id="${b.id}"]`);
    if (!el) {
      el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      el.setAttribute("data-id", String(b.id));
      el.setAttribute("class", "block block-fall");
      el.setAttribute("width", String(FLOOR_W - 8));
      el.setAttribute("height", String(FLOOR_H - 8));
      layer.appendChild(el);
    }
    el.setAttribute("x", String(b.x - (FLOOR_W - 8) / 2));
    el.setAttribute("y", String(b.y));
  }
  for (const el of Array.from(layer.children)) {
    if (!present.has(el.getAttribute("data-id"))) el.remove();
  }
}

// ---------- BUG-BUG SVG (a friendly ladybug) ----------

function bugSvg(w, h) {
  return `<svg class="big-bug" viewBox="-60 -50 120 100" width="${w}" height="${h}">${bugInnerSvg()}</svg>`;
}

function bugInnerSvg() {
  return `
    <ellipse class="bug-body" cx="-2" cy="0" rx="38" ry="28"/>
    <line x1="-2" y1="-28" x2="-2" y2="28" stroke="#1A1A1A" stroke-width="3"/>
    <circle class="bug-spot" cx="-18" cy="-8" r="5"/>
    <circle class="bug-spot" cx="-12" cy="10" r="4"/>
    <circle class="bug-spot" cx="14" cy="-10" r="5"/>
    <circle class="bug-spot" cx="18" cy="8" r="4"/>
    <circle class="bug-head" cx="32" cy="0" r="14"/>
    <circle class="bug-eye" cx="36" cy="-4" r="4"/>
    <circle class="bug-pupil" cx="37" cy="-4" r="2"/>
    <path d="M 36 -14 Q 44 -22 48 -16" stroke="#1A1A1A" stroke-width="2.5" fill="none"/>
    <circle cx="48" cy="-16" r="2.5" fill="#1A1A1A"/>
    <path d="M 28 -14 Q 30 -24 36 -22" stroke="#1A1A1A" stroke-width="2.5" fill="none"/>
    <circle cx="36" cy="-22" r="2.5" fill="#1A1A1A"/>
  `;
}
