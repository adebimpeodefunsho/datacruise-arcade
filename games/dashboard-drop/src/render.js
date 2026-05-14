// DOM/SVG rendering. innerHTML for title/end screens. For the live game we
// build the shell once and patch transforms / classes / text per frame.

import {
  VIEW, DASH, GROUND, DEPLOY, SILLY_FILLS, DIFFICULTIES, MAX_WRONGS,
  CHART_CATALOG, FALL_START_Y, FALL_END_Y,
  starsForResult, endMessage,
} from "./state.js?v=14";
import { isMuted } from "./sound.js?v=4";

// ---------- TITLE SCREEN ----------

export function renderTitle(best) {
  return `
  <div class="screen">
    <div class="card">
      ${bugSvg(130, 110)}
      <h1>BUG-BUG'S<br>DASHBOARD DROP</h1>
      <p class="subtitle">DATACRUISE ARCADE · GAME 5</p>
      <div class="howto">
        <p><strong>The goal:</strong> fill the dashboard's six slots with their six real charts before three mistakes end your run.</p>
        <p><span class="ok">✓ The dashboard changes every game.</span> Glance at the faint sketch when the round starts — those six chart types are the <b>real</b> charts you need to catch.</p>
        <p><span class="bad">✗ Everything else is a decoy.</span> <b>Let Bug-Bug eat up the decoys</b> — don't deploy them. He's hungry and they don't belong on the dashboard.</p>
        <p><strong>Timing:</strong> press <b>SPACE</b> (or <b>DEPLOY</b>) only when a real chart's <em>height</em> lines up with its slot on the dashboard. X doesn't matter — vertical alignment does. Press too early or too late and nothing happens; try again.</p>
        <p><strong>${MAX_WRONGS} wrongs = game over.</strong> Deploying a decoy is a wrong. Miss a real chart and its slot fills with a silly object — watermelon, cat, mop, whatever lands.</p>
      </div>
      <p class="prompt">CHOOSE A SPEED</p>
      <div class="diff-row">
        <button class="green" data-action="start-easy">${DIFFICULTIES.easy.label}</button>
        <button data-action="start-medium">${DIFFICULTIES.medium.label}</button>
        <button class="sky" data-action="start-hard">${DIFFICULTIES.hard.label}</button>
      </div>
      <p class="prompt">BEST: ${renderStarsInline(best || 0)}</p>
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
  const msg = endMessage(state);
  const win = state.outcome === "win";
  const stars = starsForResult(state);
  const isNewBest = win && stars > prevBest;
  const youArt   = renderMiniDashboard(state, /* ideal */ false);
  const idealArt = renderMiniDashboard(state, /* ideal */ true);
  const diffLabel = DIFFICULTIES[state.difficulty]?.label || state.difficulty.toUpperCase();
  return `
  <div class="screen">
    <div class="card">
      <h1>${msg.title}</h1>
      <p class="subtitle">${msg.subtitle}</p>
      <div class="end-charts">
        <div>
          ${youArt}
          <div class="end-chart-label">YOUR DASHBOARD</div>
        </div>
        <div>
          ${idealArt}
          <div class="end-chart-label">THE GOAL</div>
        </div>
      </div>
      <p class="flavour-line">${msg.flavour}</p>
      ${renderStarsBig(stars)}
      ${isNewBest ? `<p class="new-best">NEW BEST!</p>` : ""}
      <div class="stats">
        Difficulty: <b>${diffLabel}</b><br>
        Clean catches: <b>${state.correctCatches}</b> / ${state.slots.length}
        · Junk ignored: <b>${state.junkIgnored}</b>
        · Junk deployed: <b>${state.junkDeploys}</b>
      </div>
      <div class="end-actions">
        <button data-action="replay">PLAY AGAIN</button>
        <button class="ghost" data-action="back-to-title">TITLE SCREEN</button>
      </div>
    </div>
  </div>`;
}

function renderStarsBig(n) {
  let s = "";
  for (let i = 0; i < 3; i++) s += i < n ? "★" : `<span class="dim">★</span>`;
  return `<div class="stars">${s}</div>`;
}

// Mini dashboard for the end card.
function renderMiniDashboard(state, ideal) {
  const W = 260, H = 200;
  function mini(s) {
    return {
      x: ((s.x - DASH.x) / DASH.w) * W,
      y: ((s.y - DASH.y) / DASH.h) * H,
      w: (s.w / DASH.w) * W,
      h: (s.h / DASH.h) * H,
    };
  }
  let g = `<rect x="0" y="0" width="${W}" height="${H}" fill="#FFF7E2"/>`;
  for (const slot of state.slots) {
    const m = mini(slot);
    const showReal = ideal || slot.filled === "real";
    const showSilly = !ideal && slot.filled && slot.filled !== "real";
    const frameFill = showReal ? "#FFF" : (showSilly ? "#FFE1EC" : "#F0E5C0");
    const frameStroke = showReal ? "#1A1A1A" : (showSilly ? "#E84A8B" : "#C7B98E");
    const dash = (showReal || showSilly) ? "" : `stroke-dasharray="3 3"`;
    g += `<rect x="${m.x.toFixed(1)}" y="${m.y.toFixed(1)}" width="${m.w.toFixed(1)}" height="${m.h.toFixed(1)}" rx="4" fill="${frameFill}" stroke="${frameStroke}" stroke-width="1.5" ${dash}/>`;
    if (showReal) {
      g += renderMiniRealArt(slot, m);
    } else if (showSilly) {
      g += renderMiniSillyArt(slot.filled, m);
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${g}</svg>`;
}

function renderMiniRealArt(slot, m) {
  const meta = CHART_CATALOG[slot.type];
  if (!meta) return "";
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;

  if (meta.kind === "kpi") {
    return `<text x="${cx.toFixed(1)}" y="${(cy+4).toFixed(1)}" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="13" fill="${meta.color}">${meta.value}</text>`;
  }

  switch (slot.type) {
    case "line": {
      const px = m.x + 4, py = m.y + 4, pw = m.w - 8, ph = m.h - 8;
      const pts = [0.15, 0.45, 0.30, 0.65, 0.55, 0.85, 0.70].map((v, i, a) =>
        `${(px + (i/(a.length-1))*pw).toFixed(1)},${(py + (1-v)*ph).toFixed(1)}`
      ).join(" ");
      return `<polyline points="${pts}" fill="none" stroke="${meta.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    case "bar": {
      const px = m.x + 6, py = m.y + 4, ph = m.h - 8, bw = (m.w - 16) / 4;
      const heights = [0.55, 0.85, 0.40, 0.70];
      let bars = "";
      heights.forEach((h, i) => {
        const bh = h * ph;
        bars += `<rect x="${(px + i*bw + 1).toFixed(1)}" y="${(py + ph - bh).toFixed(1)}" width="${(bw-2).toFixed(1)}" height="${bh.toFixed(1)}" fill="${meta.color}" stroke="#1A1A1A" stroke-width="0.7"/>`;
      });
      return bars;
    }
    case "pie": {
      const r = Math.min(m.w, m.h) / 2 - 8;
      const cuts = [0.40, 0.25, 0.20, 0.15];
      const palette = ["#FF6A1A", "#FFC500", "#2BB673", "#5DC1E8"];
      let cursor = 0, paths = "";
      cuts.forEach((v, i) => {
        const end = cursor + v * 360;
        paths += `<path d="${slicePath(cx, cy, r, cursor, end)}" fill="${palette[i]}" stroke="#1A1A1A" stroke-width="0.7"/>`;
        cursor = end;
      });
      return paths;
    }
    case "bubble": {
      return `
        <circle cx="${(cx-12).toFixed(1)}" cy="${(cy-4).toFixed(1)}" r="9" fill="#E84A8B" stroke="#1A1A1A" stroke-width="0.6" opacity="0.85"/>
        <circle cx="${(cx+6).toFixed(1)}"  cy="${(cy+8).toFixed(1)}"  r="13" fill="#5DC1E8" stroke="#1A1A1A" stroke-width="0.6" opacity="0.85"/>
        <circle cx="${(cx+16).toFixed(1)}" cy="${(cy-8).toFixed(1)}" r="7" fill="#FFC500" stroke="#1A1A1A" stroke-width="0.6" opacity="0.85"/>`;
    }
    case "scatter": {
      const px = m.x + 4, py = m.y + 4, pw = m.w - 8, ph = m.h - 8;
      const points = [[0.15,0.30],[0.30,0.55],[0.45,0.20],[0.55,0.65],[0.70,0.40],[0.85,0.55],[0.25,0.75],[0.65,0.85],[0.40,0.45],[0.80,0.25]];
      return points.map(([fx, fy]) => `<circle cx="${(px+fx*pw).toFixed(1)}" cy="${(py+(1-fy)*ph).toFixed(1)}" r="1.6" fill="#9D62E0" stroke="#1A1A1A" stroke-width="0.4"/>`).join("");
    }
    case "gauge": {
      const cgx = cx, cgy = cy + m.h * 0.18, r = Math.min(m.w*0.32, m.h*0.45);
      return `
        <path d="${arcPath(cgx, cgy, r, 180, 240)}" stroke="#2BB673" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="${arcPath(cgx, cgy, r, 240, 300)}" stroke="#FFC500" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="${arcPath(cgx, cgy, r, 300, 360)}" stroke="#FF6A1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <line x1="${cgx}" y1="${cgy}" x2="${(cgx + r*0.6).toFixed(1)}" y2="${(cgy - r*0.5).toFixed(1)}" stroke="#1A1A1A" stroke-width="1.2"/>
        <circle cx="${cgx}" cy="${cgy}" r="1.6" fill="#1A1A1A"/>`;
    }
    case "area": {
      const px = m.x + 4, py = m.y + 4, pw = m.w - 8, ph = m.h - 8;
      const heights = [0.20, 0.45, 0.35, 0.65, 0.55, 0.50, 0.80, 0.70];
      let polyPts = `${px},${py+ph}`;
      heights.forEach((v, i, a) => {
        const xx = px + (i/(a.length-1))*pw;
        const yy = py + (1-v)*ph;
        polyPts += ` ${xx.toFixed(1)},${yy.toFixed(1)}`;
      });
      polyPts += ` ${px+pw},${py+ph}`;
      return `<polygon points="${polyPts}" fill="${meta.color}" stroke="#1A1A1A" stroke-width="0.6" opacity="0.85"/>`;
    }
    case "heatmap": {
      const px = m.x + 4, py = m.y + 4, pw = m.w - 8, ph = m.h - 8;
      const rows = 4, cols = 6;
      const cellW = pw / cols, cellH = ph / rows;
      const intens = [[0.2,0.5,0.8,0.6,0.3,0.1],[0.4,0.7,0.9,0.8,0.5,0.2],[0.3,0.6,0.7,0.9,0.6,0.3],[0.1,0.4,0.5,0.7,0.4,0.2]];
      let cells = "";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = intens[r][c];
          const rr = Math.round(255 - v*100), gg = Math.round(180 - v*100), bb = Math.round(80 - v*60);
          cells += `<rect x="${(px + c*cellW).toFixed(1)}" y="${(py + r*cellH).toFixed(1)}" width="${cellW.toFixed(1)}" height="${cellH.toFixed(1)}" fill="rgb(${rr},${gg},${bb})" stroke="#1A1A1A" stroke-width="0.3"/>`;
        }
      }
      return cells;
    }
    default: return "";
  }
}

function renderMiniSillyArt(id, m) {
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  return `<g transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${(Math.min(m.w, m.h) / 110).toFixed(2)})">${sillyInnerSvg(id)}</g>`;
}

// ---------- GAME SCREEN ----------

export function renderGameShell(state) {
  return `
  <div class="game">
    <div class="topbar">
      <div class="title">📊 DASHBOARD DROP</div>
      <div class="hud-pill" id="catches-pill">
        <span class="hud-label">CAUGHT</span>
        <span class="hud-num" id="catches-num">${state.correctCatches} / ${state.slots.length}</span>
      </div>
      <div class="hud-pill" id="wrong-pill">
        <span class="hud-label">WRONGS</span>
        <span class="hud-num" id="wrong-num">${state.junkDeploys} / ${MAX_WRONGS}</span>
      </div>
      <div class="hud-pill" id="left-pill">
        <span class="hud-label">CHART</span>
        <span class="hud-num" id="left-num">${Math.min(state.spawnedCount, state.queue.length)} / ${state.queue.length}</span>
      </div>
      <div class="hud-pill" id="diff-pill">
        <span class="hud-label">${state.cfg.label}</span>
      </div>
      <button class="sound-toggle" id="sound-toggle" data-action="toggle-sound" aria-label="Toggle sound">${isMuted() ? "🔇" : "🔊"}</button>
    </div>

    <div class="stage">
      <svg viewBox="0 0 ${VIEW.W} ${VIEW.H}" preserveAspectRatio="xMidYMid meet" id="stage-svg">
        <defs>
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#FFFDF5"/>
            <stop offset="100%" stop-color="#FFE9C6"/>
          </linearGradient>
          <linearGradient id="ground-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#B6814E"/>
            <stop offset="100%" stop-color="#6E4A24"/>
          </linearGradient>
        </defs>

        <!-- Sky background -->
        <rect x="0" y="0" width="${VIEW.W}" height="${GROUND.y}" fill="url(#sky-grad)"/>

        <!-- Ground -->
        <rect x="${GROUND.x}" y="${GROUND.y}" width="${GROUND.w}" height="${VIEW.H - GROUND.y}" fill="url(#ground-grad)"/>
        <rect x="${GROUND.x}" y="${GROUND.y - 6}" width="${GROUND.w}" height="14" fill="#2BB673" stroke="#1A1A1A" stroke-width="2.5"/>
        <g opacity="0.9">
          ${renderGrassTufts(GROUND.y - 3)}
        </g>

        <!-- Sky decorations -->
        <g opacity="0.55">
          <circle cx="120" cy="60"  r="22" fill="#FFF"/>
          <circle cx="150" cy="58"  r="18" fill="#FFF"/>
          <circle cx="170" cy="72"  r="16" fill="#FFF"/>
          <circle cx="830" cy="95"  r="20" fill="#FFF"/>
          <circle cx="865" cy="93"  r="22" fill="#FFF"/>
          <circle cx="890" cy="105" r="16" fill="#FFF"/>
          <circle cx="500" cy="40"  r="14" fill="#FFF"/>
          <circle cx="525" cy="35"  r="18" fill="#FFF"/>
          <circle cx="545" cy="45"  r="14" fill="#FFF"/>
        </g>

        <!-- Dashboard panel -->
        <rect x="${DASH.x}" y="${DASH.y}" width="${DASH.w}" height="${DASH.h}" rx="14" fill="#FFFDF5" stroke="#1A1A1A" stroke-width="3"/>
        <g transform="translate(${DASH.x + DASH.w / 2}, ${DASH.y + 22})">
          <rect x="-180" y="-18" width="360" height="36" rx="12" fill="#1A1A1A"/>
          <text x="0" y="6" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="18" fill="#FFC500" letter-spacing="2">BUILD THIS DASHBOARD</text>
        </g>

        <!-- Slots -->
        <g id="slots">${renderSlots(state)}</g>

        <!-- Falling chart layer (patched live, above dashboard, below DEPLOY) -->
        <g id="falling-layer"></g>

        <!-- Bug-Bug standing on the ground, watching the dashboard -->
        <g id="bug" class="bug-group" transform="translate(95, 660)">
          <g class="bug-inner">${bugInnerSvg()}</g>
        </g>

        <!-- Deploy bar -->
        <g id="deploy-btn" data-action="deploy">
          <rect class="deploy-bg" x="${DEPLOY.x}" y="${DEPLOY.y}" width="${DEPLOY.w}" height="${DEPLOY.h}" rx="18"/>
          <text x="${DEPLOY.x + DEPLOY.w / 2}" y="${DEPLOY.y + DEPLOY.h / 2 - 2}" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="28" fill="#1A1A1A" letter-spacing="3">DEPLOY</text>
          <text x="${DEPLOY.x + DEPLOY.w / 2}" y="${DEPLOY.y + DEPLOY.h / 2 + 22}" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="13" fill="#1A1A1A" letter-spacing="3">[SPACE]</text>
        </g>

        <!-- Result chip -->
        <g id="result-chip" transform="translate(${VIEW.W / 2}, 30)" opacity="0">
          <rect id="result-chip-rect" x="-180" y="-22" width="360" height="44" rx="14" fill="#1A1A1A"/>
          <text id="result-chip-text" x="0" y="6" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="18" fill="#FFC500" letter-spacing="1">—</text>
        </g>
      </svg>
    </div>
  </div>`;
}

function renderGrassTufts(yTop) {
  let g = "";
  for (let x = 16; x < VIEW.W; x += 28) {
    const h = 6 + Math.sin(x * 0.13) * 2;
    g += `<path d="M ${x} ${yTop} Q ${x + 3} ${yTop - h} ${x + 6} ${yTop}" fill="#2BB673" stroke="#1A1A1A" stroke-width="1.2" stroke-linejoin="round"/>`;
  }
  return g;
}

function renderSlots(state) {
  let g = "";
  for (const slot of state.slots) {
    g += `
      <g class="slot" id="slot-${slot.id}" data-type="${slot.type}">
        <rect class="slot-frame" x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" rx="10"/>
        <g class="slot-ghost">${renderSlotChartArt(slot, /* ghost */ true)}</g>
        <g class="slot-real">${renderSlotChartArt(slot, /* ghost */ false)}</g>
        <g class="slot-silly">${renderSlotSillyFills(slot)}</g>
      </g>`;
  }
  return g;
}

function renderSlotSillyFills(slot) {
  const cx = slot.x + slot.w / 2;
  const cy = slot.y + slot.h / 2;
  const scale = Math.min(slot.w / 130, slot.h / 110);
  let g = "";
  for (const silly of SILLY_FILLS) {
    g += `<g class="silly-art" data-silly="${silly.id}" transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${scale.toFixed(2)})">${sillyInnerSvg(silly.id)}</g>`;
  }
  return g;
}

// ---------- Per-frame patch ----------

export function patchGame(state) {
  const cnum = document.getElementById("catches-num");
  if (cnum) cnum.textContent = `${state.correctCatches} / ${state.slots.length}`;
  const lnum = document.getElementById("left-num");
  if (lnum) lnum.textContent = `${Math.min(state.spawnedCount, state.queue.length)} / ${state.queue.length}`;
  const wnum = document.getElementById("wrong-num");
  if (wnum) wnum.textContent = `${state.junkDeploys} / ${MAX_WRONGS}`;
  const wpill = document.getElementById("wrong-pill");
  if (wpill) {
    wpill.classList.toggle("warn", state.junkDeploys === MAX_WRONGS - 2);
    wpill.classList.toggle("danger", state.junkDeploys >= MAX_WRONGS - 1);
  }

  // Slots — no more targeted-slot pulse (the player must recognize from the
  // falling tile, not look for a glowing destination).
  for (const slot of state.slots) {
    const node = document.getElementById(`slot-${slot.id}`);
    if (!node) continue;
    node.classList.toggle("filled-real", slot.filled === "real");
    node.classList.toggle("filled-silly", !!slot.filled && slot.filled !== "real");
    node.classList.toggle("just-filled", slot.justFilledMs > 0);
    if (slot.filled && slot.filled !== "real") {
      node.setAttribute("data-silly", slot.filled);
    } else {
      node.removeAttribute("data-silly");
    }
  }

  // Falling chart
  const layer = document.getElementById("falling-layer");
  if (layer) {
    if (!state.falling) {
      if (layer.firstChild) layer.innerHTML = "";
    } else {
      const f = state.falling;
      const wantId = `fall-${f.id}`;
      let node = document.getElementById(wantId);
      if (!node) {
        layer.innerHTML = `
          <g id="${wantId}" class="falling-chart${f.kind === "junk" ? " junk" : ""}">
            <g class="falling-chart-inner">${renderFallingArt(f.type, f.kind === "junk")}</g>
          </g>`;
        node = document.getElementById(wantId);
      }
      const cx = f.x;
      const cy = FALL_START_Y + (FALL_END_Y - FALL_START_Y) * f.y;

      if (f.locked === "snap") {
        const slot = state.slots.find((s) => s.id === f.slotId);
        const tx = slot.x + slot.w / 2;
        const ty = slot.y + slot.h / 2;
        const t = Math.min(1, f.animatingMs / 380);
        const eased = 1 - Math.pow(1 - t, 2);
        const x = cx + (tx - cx) * eased;
        const y = cy + (ty - cy) * eased;
        node.setAttribute("transform", `translate(${x.toFixed(1)}, ${y.toFixed(1)})`);
        if (!node.classList.contains("snap")) node.classList.add("snap");
      } else if (f.locked === "shatter") {
        if (!node.classList.contains("shatter")) node.classList.add("shatter");
        node.setAttribute("transform", `translate(${cx.toFixed(1)}, ${cy.toFixed(1)})`);
      } else if (f.locked === "dissolve") {
        if (!node.classList.contains("dissolve")) node.classList.add("dissolve");
        node.setAttribute("transform", `translate(${cx.toFixed(1)}, ${cy.toFixed(1)})`);
      } else {
        node.setAttribute("transform", `translate(${cx.toFixed(1)}, ${cy.toFixed(1)})`);
      }
    }
  }

  // Result chip
  const chip = document.getElementById("result-chip");
  const chipText = document.getElementById("result-chip-text");
  const chipRect = document.getElementById("result-chip-rect");
  if (chip && chipText && chipRect) {
    if (state.resultFlashMs > 0 && state.lastResult) {
      const r = state.lastResult;
      let txt, fill, width;
      switch (r.kind) {
        case "lock":         txt = `✓  ${r.label} LANDED`;              fill = "#FFC500"; width = 380; break;
        case "missed":       txt = `…  MISSED THE ${r.label}`;          fill = "#FF6A1A"; width = 400; break;
        case "junk-deploy":  txt = `✕  WRONG! — ${r.label}  (−1 ★)`;        fill = "#E84A8B"; width = 460; break;
        case "junk-ignored": txt = `✓  IGNORED — ${r.label}`;           fill = "#5DC1E8"; width = 380; break;
        case "fizzle":       txt = `✕  TIMING — ${r.label}`;             fill = "#B0AAA0"; width = 360; break;
        default:             txt = r.label;                              fill = "#FFC500"; width = 320;
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

  // Deploy bar armed-state hint while a chart is in flight.
  const btn = document.getElementById("deploy-btn");
  if (btn) btn.classList.toggle("armed", !!(state.falling && !state.falling.locked));

  // Bug-Bug shuffles along the ground under the currently falling chart
  // (lerping toward state.falling.x), and chomps when a decoy lands.
  const bug = document.getElementById("bug");
  if (bug) {
    if (state.falling && typeof state.falling.x === "number") {
      const m = bug.getAttribute("transform")?.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
      const curX = m ? parseFloat(m[1]) : 95;
      const curY = m ? parseFloat(m[2]) : 660;
      const targetX = Math.max(50, Math.min(VIEW.W - 50, state.falling.x));
      const newX = curX + (targetX - curX) * 0.12;
      bug.setAttribute("transform", `translate(${newX.toFixed(1)}, ${curY})`);
    }
    bug.classList.toggle("chomping", state.bugChompMs > 0);
  }
}

// ---------- REAL CHART ART (inside slots) ----------

function renderSlotChartArt(slot, ghost) {
  // Ghost previews use a greyscale palette so the empty dashboard reads as
  // clearly "waiting" — fully visible, but lifeless. When the slot fills,
  // the same chart art is re-rendered in full colour and pops in.
  const stroke = ghost ? "#5C5C5C" : "#1A1A1A";
  const sw = ghost ? 1.8 : 2.5;
  const titleFill = ghost ? "#4A4A4A" : "#1A1A1A";
  const meta = CHART_CATALOG[slot.type];
  if (!meta) return "";
  const { x, y, w, h, label, color } = slot;
  const slotTitle = `<text x="${x + 14}" y="${y + 22}" font-family="Fredoka,sans-serif" font-weight="800" font-size="13" fill="${titleFill}" letter-spacing="1.5">${label}</text>`;
  const ghostC = "#9E9E9E";

  // KPI: big number + label
  if (meta.kind === "kpi") {
    const numColor = ghost ? ghostC : color;
    // Adjust font size for longer values like "$24k" vs "+62" vs "12.3k"
    const fs = meta.value.length <= 3 ? 38 : meta.value.length <= 4 ? 34 : 30;
    return `
      <text x="${x + 16}" y="${y + 22}" font-family="Fredoka,sans-serif" font-weight="800" font-size="13" fill="${titleFill}" letter-spacing="1.5">${label}</text>
      <text x="${x + w / 2}" y="${y + h * 0.78}" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="${fs}" fill="${numColor}">${meta.value}</text>
    `;
  }

  // Chart-shaped slot art — dispatch per type
  switch (slot.type) {
    case "line": {
      const px = x + 14, py = y + 38, pw = w - 28, ph = h - 50;
      const pts = [0.15, 0.45, 0.30, 0.65, 0.55, 0.85, 0.70];
      const polyPts = pts.map((v, i, a) => `${(px + (i/(a.length-1))*pw).toFixed(1)},${(py + (1-v)*ph).toFixed(1)}`).join(" ");
      const dots = pts.map((v, i, a) => {
        const xx = px + (i/(a.length-1))*pw, yy = py + (1-v)*ph;
        return `<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="3.5" fill="${ghost ? ghostC : color}" stroke="${stroke}" stroke-width="${sw*0.6}"/>`;
      }).join("");
      return `${slotTitle}
        <line x1="${px}" y1="${py+ph}" x2="${px+pw}" y2="${py+ph}" stroke="${stroke}" stroke-width="${sw*0.7}"/>
        <line x1="${px}" y1="${py}" x2="${px}" y2="${py+ph}" stroke="${stroke}" stroke-width="${sw*0.7}"/>
        <polyline points="${polyPts}" fill="none" stroke="${ghost ? ghostC : color}" stroke-width="${sw*1.4}" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}`;
    }
    case "bar": {
      const px = x + 18, py = y + 38, pw = w - 34, ph = h - 52;
      const heights = [0.55, 0.85, 0.40, 0.70];
      const bw = pw / heights.length;
      let bars = "";
      heights.forEach((hf, i) => {
        const bh = hf * ph;
        bars += `<rect x="${(px + i*bw + 4).toFixed(1)}" y="${(py + ph - bh).toFixed(1)}" width="${(bw-8).toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${ghost ? ghostC : color}" stroke="${stroke}" stroke-width="${sw*0.8}"/>`;
      });
      return `${slotTitle}
        <line x1="${px}" y1="${py+ph}" x2="${px+pw}" y2="${py+ph}" stroke="${stroke}" stroke-width="${sw*0.7}"/>
        ${bars}`;
    }
    case "pie": {
      const cx = x + w*0.32, cy = y + h*0.62, r = Math.min(w*0.24, h*0.40);
      const palette = ghost ? ["#B8B8B8", "#9E9E9E", "#828282", "#666666"] : ["#FF6A1A", "#FFC500", "#2BB673", "#5DC1E8"];
      const cuts = [0.40, 0.25, 0.20, 0.15];
      let cursor = 0, paths = "";
      cuts.forEach((v, i) => {
        const end = cursor + v*360;
        paths += `<path d="${slicePath(cx, cy, r, cursor, end)}" fill="${palette[i]}" stroke="${stroke}" stroke-width="${sw*0.8}"/>`;
        cursor = end;
      });
      const lx = x + w*0.58;
      const legendLabels = ["A 40%", "B 25%", "C 20%", "D 15%"];
      let legend = "";
      cuts.forEach((_v, i) => {
        const ly = y + 50 + i*26;
        legend += `<rect x="${lx}" y="${ly-11}" width="18" height="14" fill="${palette[i]}" stroke="${stroke}" stroke-width="${sw*0.6}"/>`;
        legend += `<text x="${lx+24}" y="${ly+1}" font-family="Fredoka,sans-serif" font-weight="700" font-size="13" fill="${titleFill}">${legendLabels[i]}</text>`;
      });
      return `${slotTitle}${paths}${legend}`;
    }
    case "bubble": {
      const cx = x + w*0.5, cy = y + h*0.58;
      const balls = [
        { dx: -60, dy: -10, r: 26, c: "#E84A8B" },
        { dx:  10, dy:  25, r: 42, c: "#5DC1E8" },
        { dx:  70, dy: -20, r: 22, c: "#FFC500" },
        { dx: -25, dy:  35, r: 16, c: "#2BB673" },
        { dx:  50, dy:  35, r: 14, c: "#FF6A1A" },
      ];
      return `${slotTitle}${balls.map(b => `<circle cx="${cx+b.dx}" cy="${cy+b.dy}" r="${b.r}" fill="${ghost ? ghostC : b.c}" stroke="${stroke}" stroke-width="${sw*0.7}" opacity="0.85"/>`).join("")}`;
    }
    case "scatter": {
      const px = x + 14, py = y + 32, pw = w - 28, ph = h - 44;
      const points = [
        [0.10, 0.30], [0.20, 0.55], [0.25, 0.20], [0.35, 0.65], [0.45, 0.40],
        [0.50, 0.75], [0.55, 0.15], [0.60, 0.85], [0.65, 0.45], [0.70, 0.30],
        [0.75, 0.60], [0.80, 0.20], [0.85, 0.50], [0.90, 0.75], [0.30, 0.85],
        [0.40, 0.10], [0.15, 0.70], [0.55, 0.55], [0.78, 0.65], [0.25, 0.40],
      ];
      const palette = ["#FF6A1A", "#5DC1E8", "#2BB673", "#FFC500", "#E84A8B", "#9D62E0"];
      const dots = points.map(([fx, fy], i) => {
        const dx = px + fx*pw, dy = py + (1-fy)*ph;
        const cc = ghost ? ghostC : palette[i % palette.length];
        return `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="4.5" fill="${cc}" stroke="${stroke}" stroke-width="${sw*0.5}"/>`;
      }).join("");
      return `${slotTitle}
        <line x1="${px}" y1="${py+ph}" x2="${px+pw}" y2="${py+ph}" stroke="${stroke}" stroke-width="${sw*0.6}"/>
        <line x1="${px}" y1="${py}" x2="${px}" y2="${py+ph}" stroke="${stroke}" stroke-width="${sw*0.6}"/>
        ${dots}`;
    }
    case "gauge": {
      const cx = x + w*0.5, cy = y + h*0.78, r = Math.min(w*0.34, h*0.52);
      const arc = (a0, a1, col) => `<path d="${arcPath(cx, cy, r, a0, a1)}" stroke="${col}" stroke-width="${sw*5}" fill="none" stroke-linecap="round"/>`;
      const colA = ghost ? ghostC : "#2BB673";
      const colB = ghost ? ghostC : "#FFC500";
      const colC = ghost ? ghostC : "#FF6A1A";
      const needleAngle = -120 + 0.65*120;
      const nx = cx + Math.cos(needleAngle*Math.PI/180) * r * 0.85;
      const ny = cy + Math.sin(needleAngle*Math.PI/180) * r * 0.85;
      return `${slotTitle}
        ${arc(180, 240, colA)}
        ${arc(240, 300, colB)}
        ${arc(300, 360, colC)}
        <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="${sw*2.4}" fill="${stroke}"/>`;
    }
    case "area": {
      const px = x + 14, py = y + 38, pw = w - 28, ph = h - 50;
      const heights = [0.20, 0.45, 0.35, 0.65, 0.55, 0.50, 0.80, 0.70];
      let polyPts = `${px},${py+ph}`;
      heights.forEach((v, i, a) => {
        const xx = px + (i/(a.length-1))*pw;
        const yy = py + (1-v)*ph;
        polyPts += ` ${xx.toFixed(1)},${yy.toFixed(1)}`;
      });
      polyPts += ` ${px+pw},${py+ph}`;
      return `${slotTitle}
        <line x1="${px}" y1="${py+ph}" x2="${px+pw}" y2="${py+ph}" stroke="${stroke}" stroke-width="${sw*0.7}"/>
        <polygon points="${polyPts}" fill="${ghost ? ghostC : color}" stroke="${stroke}" stroke-width="${sw*0.8}" opacity="${ghost ? 0.5 : 0.85}"/>`;
    }
    case "heatmap": {
      const px = x + 14, py = y + 32, pw = w - 28, ph = h - 44;
      const rows = 4, cols = 6;
      const cellW = pw / cols, cellH = ph / rows;
      const intens = [
        [0.2, 0.5, 0.8, 0.6, 0.3, 0.1],
        [0.4, 0.7, 0.9, 0.8, 0.5, 0.2],
        [0.3, 0.6, 0.7, 0.9, 0.6, 0.3],
        [0.1, 0.4, 0.5, 0.7, 0.4, 0.2],
      ];
      const colorAt = (v) => {
        if (ghost) return ghostC;
        const r = Math.round(255 - v * 100);
        const g = Math.round(180 - v * 100);
        const b = Math.round(80  - v * 60);
        return `rgb(${r},${g},${b})`;
      };
      let cells = "";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells += `<rect x="${(px + c*cellW).toFixed(1)}" y="${(py + r*cellH).toFixed(1)}" width="${cellW.toFixed(1)}" height="${cellH.toFixed(1)}" fill="${colorAt(intens[r][c])}" stroke="${stroke}" stroke-width="${sw*0.4}"/>`;
        }
      }
      return `${slotTitle}${cells}`;
    }
  }
  return "";
}

// ---------- FALLING CHART TILE (real and junk) ----------

function renderFallingArt(type, isJunk) {
  const stroke = "#1A1A1A";
  const W = 150, H = 110;
  const fx = -W / 2, fy = -H / 2;
  const frameFill = isJunk ? "#FFEDD2" : "#FFF";
  const frame = `<rect x="${fx}" y="${fy}" width="${W}" height="${H}" rx="12" fill="${frameFill}" stroke="${stroke}" stroke-width="3"/>`;
  const title = (s) => `<text x="0" y="${fy + 22}" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="800" font-size="13" fill="#1A1A1A" letter-spacing="2">${s}</text>`;

  const meta = CHART_CATALOG[type];
  if (!meta) return frame;

  if (meta.kind === "kpi") {
    const fs = meta.value.length <= 3 ? 38 : meta.value.length <= 4 ? 34 : 30;
    return `${frame}${title(meta.label)}
      <text x="0" y="${fy + 78}" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="900" font-size="${fs}" fill="${meta.color}">${meta.value}</text>`;
  }

  switch (type) {
    case "line": {
      const pts = [0.15, 0.45, 0.30, 0.65, 0.55, 0.85, 0.70];
      const px = fx + 10, py = fy + 30, pw = W - 20, ph = H - 42;
      const poly = pts.map((v, i, a) => `${(px + (i/(a.length-1))*pw).toFixed(1)},${(py + (1-v)*ph).toFixed(1)}`).join(" ");
      return `${frame}${title("LINE")}<polyline points="${poly}" fill="none" stroke="${meta.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    case "bar": {
      const heights = [0.55, 0.85, 0.40, 0.70];
      const px = fx + 14, py = fy + 30, pw = W - 28, ph = H - 42;
      const bw = pw / heights.length;
      let bars = "";
      heights.forEach((hf, i) => {
        const bh = hf * ph;
        bars += `<rect x="${(px + i*bw + 3).toFixed(1)}" y="${(py + ph - bh).toFixed(1)}" width="${(bw-6).toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${meta.color}" stroke="${stroke}" stroke-width="2"/>`;
      });
      return `${frame}${title("BAR")}${bars}`;
    }
    case "pie": {
      const r = 30, cy = 8;
      const cuts = [{v:0.40, c:"#FF6A1A"}, {v:0.25, c:"#FFC500"}, {v:0.20, c:"#2BB673"}, {v:0.15, c:"#5DC1E8"}];
      let cursor = 0, paths = "";
      cuts.forEach((c) => {
        const end = cursor + c.v*360;
        paths += `<path d="${slicePath(0, cy, r, cursor, end)}" fill="${c.c}" stroke="${stroke}" stroke-width="2"/>`;
        cursor = end;
      });
      return `${frame}${title("PIE")}${paths}`;
    }
    case "bubble": {
      return `${frame}${title("BUBBLES")}
        <circle cx="-38" cy="2"  r="14" fill="#E84A8B" stroke="${stroke}" stroke-width="2" opacity="0.85"/>
        <circle cx="4"   cy="14" r="22" fill="#5DC1E8" stroke="${stroke}" stroke-width="2" opacity="0.85"/>
        <circle cx="38"  cy="-6" r="11" fill="#FFC500" stroke="${stroke}" stroke-width="2" opacity="0.85"/>
        <circle cx="-10" cy="-16" r="8" fill="#2BB673" stroke="${stroke}" stroke-width="2" opacity="0.85"/>`;
    }
    case "scatter": {
      const dots = [
        [-50, 12, "#FF6A1A"], [-32, -2, "#5DC1E8"], [-18, 16, "#2BB673"], [-6, -10, "#FFC500"],
        [8, 8, "#E84A8B"], [22, -6, "#9D62E0"], [38, 18, "#FF6A1A"], [-42, -12, "#FFC500"],
        [52, 4, "#2BB673"], [-50, 28, "#5DC1E8"], [28, 26, "#E84A8B"], [12, -18, "#1A1A1A"],
      ];
      return `${frame}${title("SCATTER")}${dots.map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}" stroke="${stroke}" stroke-width="1.3"/>`).join("")}`;
    }
    case "gauge": {
      return `${frame}${title("GAUGE")}
        <path d="M -42 26 A 42 42 0 0 1 -12 -18" stroke="#2BB673" stroke-width="9" fill="none"/>
        <path d="M -12 -18 A 42 42 0 0 1 12 -18" stroke="#FFC500" stroke-width="9" fill="none"/>
        <path d="M 12 -18 A 42 42 0 0 1 42 26"  stroke="#FF6A1A" stroke-width="9" fill="none"/>
        <line x1="0" y1="26" x2="22" y2="-8" stroke="${stroke}" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="0" cy="26" r="6" fill="${stroke}"/>`;
    }
    case "area": {
      return `${frame}${title("AREA")}
        <path d="M -55 30 L -55 4 L -32 -10 L -10 4 L 12 -14 L 32 -2 L 55 -18 L 55 30 Z" fill="${meta.color}" stroke="${stroke}" stroke-width="2.5" opacity="0.85"/>
        <path d="M -55 4 L -32 -10 L -10 4 L 12 -14 L 32 -2 L 55 -18" stroke="#2E9DC9" stroke-width="2.5" fill="none"/>`;
    }
    case "heatmap": {
      const colors = ["#FFE9A8", "#FFC500", "#FF6A1A", "#D44A00"];
      const cells = [[0,1,2,3], [1,2,3,2], [2,3,1,0], [3,2,0,1]];
      let g = "";
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          g += `<rect x="${-30 + c*15}" y="${-12 + r*11}" width="13" height="9" fill="${colors[cells[r][c]]}" stroke="${stroke}" stroke-width="1"/>`;
        }
      }
      return `${frame}${title("HEATMAP")}${g}`;
    }
  }
  return frame;
}

// SVG arc path helper for the gauge.
function arcPath(cx, cy, r, startDeg, endDeg) {
  const a0 = (startDeg) * Math.PI / 180;
  const a1 = (endDeg) * Math.PI / 180;
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

// ---------- SILLY OBJECT ART ----------

function sillyInnerSvg(id) {
  switch (id) {
    case "watermelon": return `
      <path d="M -55 0 A 55 55 0 0 0 55 0 L 45 0 A 45 45 0 0 1 -45 0 Z" fill="#2BB673" stroke="#1A1A1A" stroke-width="2.5"/>
      <path d="M -45 0 A 45 45 0 0 0 45 0 Z" fill="#FF477E" stroke="#1A1A1A" stroke-width="2.5"/>
      <ellipse cx="-22" cy="14" rx="3" ry="6" fill="#1A1A1A"/>
      <ellipse cx="0"   cy="22" rx="3" ry="6" fill="#1A1A1A"/>
      <ellipse cx="22"  cy="14" rx="3" ry="6" fill="#1A1A1A"/>
      <ellipse cx="-12" cy="32" rx="3" ry="6" fill="#1A1A1A"/>
      <ellipse cx="14"  cy="33" rx="3" ry="6" fill="#1A1A1A"/>
    `;
    case "cat": return `
      <ellipse cx="0" cy="22" rx="32" ry="22" fill="#1A1A1A"/>
      <circle cx="0" cy="-8" r="22" fill="#1A1A1A"/>
      <polygon points="-22,-22 -10,-38 -6,-18" fill="#1A1A1A"/>
      <polygon points="22,-22 10,-38 6,-18" fill="#1A1A1A"/>
      <polygon points="-18,-26 -12,-34 -10,-22" fill="#FF6FA6"/>
      <polygon points="18,-26 12,-34 10,-22" fill="#FF6FA6"/>
      <circle cx="-7" cy="-9" r="3.5" fill="#FFC500"/>
      <circle cx="7" cy="-9" r="3.5" fill="#FFC500"/>
      <circle cx="-7" cy="-9" r="1.2" fill="#1A1A1A"/>
      <circle cx="7" cy="-9" r="1.2" fill="#1A1A1A"/>
      <path d="M -3 2 Q 0 5 3 2" stroke="#FF6FA6" stroke-width="2" fill="none" stroke-linecap="round"/>
      <line x1="-20" y1="-3" x2="-32" y2="-5" stroke="#FFF" stroke-width="1.5"/>
      <line x1="-20" y1="1"  x2="-32" y2="2"  stroke="#FFF" stroke-width="1.5"/>
      <line x1="20"  y1="-3" x2="32"  y2="-5" stroke="#FFF" stroke-width="1.5"/>
      <line x1="20"  y1="1"  x2="32"  y2="2"  stroke="#FFF" stroke-width="1.5"/>
      <path d="M 32 26 Q 50 10 44 -6" stroke="#1A1A1A" stroke-width="7" fill="none" stroke-linecap="round"/>
    `;
    case "mop": return `
      <rect x="-3" y="-44" width="6" height="60" fill="#8B5A2B" stroke="#1A1A1A" stroke-width="2"/>
      <rect x="-22" y="16" width="44" height="10" rx="3" fill="#5DC1E8" stroke="#1A1A1A" stroke-width="2.5"/>
      <line x1="-18" y1="26" x2="-22" y2="48" stroke="#E0D6B0" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="-10" y1="26" x2="-12" y2="50" stroke="#E0D6B0" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="-2"  y1="26" x2="-1"  y2="52" stroke="#E0D6B0" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="6"   y1="26" x2="8"   y2="50" stroke="#E0D6B0" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="14"  y1="26" x2="18"  y2="48" stroke="#E0D6B0" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="20"  y1="26" x2="24"  y2="44" stroke="#E0D6B0" stroke-width="3.5" stroke-linecap="round"/>
    `;
    case "duck": return `
      <ellipse cx="-2" cy="10" rx="36" ry="22" fill="#FFC500" stroke="#1A1A1A" stroke-width="2.5"/>
      <circle cx="22" cy="-12" r="18" fill="#FFC500" stroke="#1A1A1A" stroke-width="2.5"/>
      <polygon points="34,-8 52,-4 34,2" fill="#FF6A1A" stroke="#1A1A1A" stroke-width="2"/>
      <circle cx="24" cy="-16" r="3" fill="#1A1A1A"/>
      <path d="M -8 6 Q -2 20 -22 16 Q -28 6 -8 6 Z" fill="#FFE9A8" stroke="#1A1A1A" stroke-width="2"/>
      <path d="M -34 4 Q -42 -4 -38 14" stroke="#1A1A1A" stroke-width="2" fill="#FFC500"/>
    `;
    case "pizza": return `
      <polygon points="0,-38 -40,32 40,32" fill="#FFC500" stroke="#1A1A1A" stroke-width="2.5"/>
      <path d="M -40 32 Q 0 42 40 32 L 36 28 Q 0 36 -36 28 Z" fill="#8B5A2B" stroke="#1A1A1A" stroke-width="2"/>
      <circle cx="-12" cy="4"  r="6" fill="#D44A00" stroke="#1A1A1A" stroke-width="1.5"/>
      <circle cx="14"  cy="14" r="6" fill="#D44A00" stroke="#1A1A1A" stroke-width="1.5"/>
      <circle cx="2"   cy="-12" r="5" fill="#D44A00" stroke="#1A1A1A" stroke-width="1.5"/>
      <circle cx="-6" cy="24" r="3" fill="#FFE9A8"/>
      <circle cx="22" cy="-4" r="2.5" fill="#FFE9A8"/>
    `;
    case "fish": return `
      <ellipse cx="-2" cy="0" rx="38" ry="20" fill="#5DC1E8" stroke="#1A1A1A" stroke-width="2.5"/>
      <polygon points="-32,0 -54,-18 -54,18" fill="#5DC1E8" stroke="#1A1A1A" stroke-width="2.5"/>
      <circle cx="22" cy="-4" r="4" fill="#FFF" stroke="#1A1A1A" stroke-width="1.5"/>
      <circle cx="23" cy="-4" r="2" fill="#1A1A1A"/>
      <path d="M 6 6 Q 18 14 28 6" stroke="#1A1A1A" stroke-width="2" fill="none"/>
      <path d="M -8 -18 Q -14 0 -8 18"  stroke="#2E9DC9" stroke-width="3" fill="none"/>
      <path d="M 4  -19 Q -2 0  4  19"  stroke="#2E9DC9" stroke-width="3" fill="none"/>
      <polygon points="-2,-22 -10,-32 6,-30" fill="#5DC1E8" stroke="#1A1A1A" stroke-width="2"/>
    `;
    case "donut": return `
      <circle cx="0" cy="0" r="38" fill="#FF6FA6" stroke="#1A1A1A" stroke-width="2.5"/>
      <path d="M -32 -8 Q -22 -28 -10 -18 Q 0 -32 12 -18 Q 24 -28 32 -8 Q 30 4 -30 4 Z" fill="#FF477E" stroke="#1A1A1A" stroke-width="2"/>
      <circle cx="0" cy="0" r="13" fill="#FFF7E2" stroke="#1A1A1A" stroke-width="2"/>
      <rect x="-15" y="-19" width="5" height="2.5" fill="#FFC500" transform="rotate(20 -13 -18)"/>
      <rect x="4"  y="-23" width="5" height="2.5" fill="#5DC1E8" transform="rotate(-30 7 -22)"/>
      <rect x="16" y="-12" width="5" height="2.5" fill="#2BB673" transform="rotate(40 18 -11)"/>
      <rect x="-5" y="-13" width="5" height="2.5" fill="#FFF"     transform="rotate(60 -3 -12)"/>
      <rect x="22" y="-3"  width="5" height="2.5" fill="#FFC500"  transform="rotate(80 24 -2)"/>
    `;
    default: return "";
  }
}

// ---------- Geometry / Bug-Bug helpers ----------

function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx, cy, r, startDeg, endDeg) {
  const a = polar(cx, cy, r, startDeg);
  const b = polar(cx, cy, r, endDeg);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
}

function bugSvg(w, h) {
  return `<svg class="big-bug" viewBox="-50 -70 100 140" width="${w}" height="${h}">${bugInnerSvg(true)}</svg>`;
}

function bugInnerSvg(mini = false) {
  const armTipY = mini ? -64 : -36;
  return `
    <g class="bug-arm">
      <line x1="0" y1="-24" x2="0" y2="${armTipY + 10}" stroke="#1A1A1A" stroke-width="13" stroke-linecap="round"/>
      <circle cx="0" cy="${armTipY}" r="13" fill="#FFC500" stroke="#1A1A1A" stroke-width="4"/>
    </g>
    <ellipse class="bug-body" cx="0" cy="14" rx="30" ry="40"/>
    <line x1="-30" y1="14" x2="30" y2="14" stroke="#1A1A1A" stroke-width="3"/>
    <circle class="bug-spot" cx="-13" cy="-2" r="4.5"/>
    <circle class="bug-spot" cx="13" cy="-4" r="4.5"/>
    <circle class="bug-spot" cx="-13" cy="28" r="4.5"/>
    <circle class="bug-spot" cx="13" cy="26" r="4.5"/>
    <circle class="bug-head" cx="0" cy="-32" r="16"/>
    <circle class="bug-eye" cx="-6" cy="-36" r="4"/>
    <circle class="bug-eye" cx="6" cy="-36" r="4"/>
    <circle class="bug-pupil" cx="-6" cy="-38" r="2"/>
    <circle class="bug-pupil" cx="6" cy="-38" r="2"/>
    <path d="M -5 -26 Q 0 -22 5 -26" stroke="#1A1A1A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M -8 -46 Q -16 -54 -14 -62" stroke="#1A1A1A" stroke-width="2.5" fill="none"/>
    <circle cx="-14" cy="-62" r="3" fill="#1A1A1A"/>
    <path d="M 8 -46 Q 16 -54 14 -62" stroke="#1A1A1A" stroke-width="2.5" fill="none"/>
    <circle cx="14" cy="-62" r="3" fill="#1A1A1A"/>
    <line x1="-24" y1="46" x2="-30" y2="58" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
    <line x1="-10" y1="52" x2="-14" y2="64" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
    <line x1="10" y1="52" x2="14" y2="64" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
    <line x1="24" y1="46" x2="30" y2="58" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>
  `;
}
