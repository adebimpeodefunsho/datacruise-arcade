// Render functions per screen. Each returns an HTML string for #app.

import {
  ACTIONS, SUMMIT, TOTAL_DAYS, STARTING_STAMINA, canDo,
  todayWeather, summitFraction, sprintsRemaining, activeDaysRemaining,
} from "./state.js";
import {
  bug, trophy, sun, cloud, storm, gradientDefs,
} from "./svg.js";
import { isMuted } from "./audio.js";

function muteButton(extraClass = "") {
  const m = isMuted();
  return `<button class="mute-toggle ${extraClass}" data-action="toggle-mute" aria-label="${m ? "Unmute" : "Mute"} sound" title="${m ? "Sound off — click to enable" : "Sound on — click to mute"}">${m ? "🔇" : "🔊"}</button>`;
}

const WEATHER_GLYPH = {
  sunny:  { fn: sun,   label: "SUNNY",  hint: "+10m bonus · great day to sprint",     icon: "☀️" },
  cloudy: { fn: cloud, label: "CLOUDY", hint: "normal day",                            icon: "☁️" },
  storm:  { fn: storm, label: "STORM",  hint: "Bug-Bug rests — you can't act",         icon: "⛈️" },
};

// ---------- Title screen ----------

export function renderTitle(bestStars) {
  const stars = bestStars > 0 ? `⭐`.repeat(bestStars) : "—";
  return `
    <div class="screen title-screen">
      <div class="title-card">
        ${muteButton("mute-toggle-floating")}
        <svg class="title-bug" viewBox="-60 -50 120 110">
          ${gradientDefs()}
          ${bug(1.4)}
        </svg>
        <h1 class="title-heading">BUG-BUG'S<br/>MOUNTAIN CLIMB</h1>
        <p class="title-subtitle">A line-chart strategy game · DataCruise Arcade</p>
        <button class="primary-btn" data-action="start">▶ PLAY</button>
        <p class="title-best">Best: <strong>${stars}</strong></p>
        <details class="title-howto" open>
          <summary>How to play (click to expand)</summary>
          <div class="howto-body">
            <p class="howto-goal"><strong>🏔 Goal:</strong> Climb to <strong>${SUMMIT}m</strong> in <strong>${TOTAL_DAYS} days</strong>. Reach the summit and Bug-Bug wins!</p>

            <p class="howto-hook"><strong>The Twist:</strong> You only have <strong>${STARTING_STAMINA} stamina</strong> for the entire climb. It does <em>not</em> refill. Storms force ${3} days of rest — so you only really control ${TOTAL_DAYS - 3} days.</p>

            <h4>Each day's weather</h4>
            <ul class="howto-weather">
              <li><span class="howto-icon">☀️</span> <strong>Sunny</strong> — every climb / sprint earns +10m bonus. Best day to sprint.</li>
              <li><span class="howto-icon">☁️</span> <strong>Cloudy</strong> — a normal day. No bonus, no penalty.</li>
              <li><span class="howto-icon">⛈️</span> <strong>Storm</strong> — Bug-Bug must wait it out. You don't pick anything.</li>
            </ul>

            <h4>Your two actions (non-storm days)</h4>
            <ul class="howto-actions">
              <li>🥾 <strong>CLIMB</strong> — costs 1 stamina, gains <strong>~50m</strong> (sunny: ~60m)</li>
              <li>⚡ <strong>SPRINT</strong> — costs 2 stamina, gains <strong>~100m</strong> (sunny: ~110m)</li>
            </ul>

            <h4>The math you need to know</h4>
            <p>With ${STARTING_STAMINA} stamina across ${TOTAL_DAYS - 3} non-storm days, you can sprint <strong>at most 2 times</strong>:</p>
            <ul class="howto-math">
              <li>🟥 <strong>7 climbs, no sprints</strong> → ~350m → <strong>you lose</strong> (short of ${SUMMIT}m).</li>
              <li>🟧 <strong>1 sprint + 6 climbs</strong> → ~400m → <strong>bare win</strong>.</li>
              <li>🟩 <strong>2 sprints + 5 climbs</strong> → ~450m → <strong>comfortable win</strong>.</li>
              <li>⭐ <strong>2 sprints on sunny days</strong> → ~470m → <strong>3-star finish</strong>.</li>
            </ul>

            <p class="howto-tip"><strong>💡 Tip:</strong> The 10-day forecast is visible at the start. Look at <em>where</em> the sunny days fall before you spend your first sprint. Saving sprints for sunny days = best score.</p>
          </div>
        </details>
      </div>
    </div>`;
}

// ---------- Game screen ----------

export function renderGame(state) {
  return `
    <div class="screen game-screen">
      <svg class="defs-only" aria-hidden="true">${gradientDefs()}</svg>
      ${headerBar(state)}
      ${forecastStrip(state)}
      <main class="game-main">
        ${chartCard(state)}
        <aside class="side">
          ${todayCard(state)}
          ${actionCard(state)}
        </aside>
      </main>
      ${tipFooter(state)}
    </div>`;
}

function headerBar(state) {
  const pct = Math.round(summitFraction(state) * 100);
  return `
    <header class="status-bar card">
      <div class="brand">
        <svg viewBox="-32 -24 64 48" class="brand-bug">${bug(0.7)}</svg>
        <div>
          <h1>BUG-BUG'S MOUNTAIN CLIMB</h1>
          <p>DataCruise Arcade · Series 1</p>
        </div>
      </div>
      <div class="day-pill">
        <span class="label">DAY</span>
        <strong>${state.day} / ${TOTAL_DAYS}</strong>
      </div>
      <div class="stat stat-stamina">
        <span class="label">STAMINA</span>
        ${renderStaminaBar(state.stamina)}
      </div>
      <div class="stat stat-sprints">
        <span class="label">SPRINTS LEFT</span>
        ${renderSprintCounter(sprintsRemaining(state))}
      </div>
      <div class="stat stat-altitude">
        <span class="label">ALTITUDE</span>
        <strong>▲ ${state.altitude}m</strong>
      </div>
      <div class="stat stat-progress">
        <span class="label">TO SUMMIT</span>
        <div class="progress-bar"><div class="fill" style="width:${pct}%"></div></div>
        <strong>${pct}%</strong>
      </div>
      ${muteButton("mute-toggle-header")}
    </header>`;
}

function renderStaminaBar(stamina) {
  let pips = "";
  for (let i = 0; i < STARTING_STAMINA; i++) {
    const filled = i < stamina;
    pips += `<span class="stamina-pip ${filled ? "filled" : "spent"}"></span>`;
  }
  return `<div class="stamina-display">
    <strong class="stamina-num">${stamina}</strong>
    <span class="stamina-of">/ ${STARTING_STAMINA}</span>
    <div class="stamina-pips">${pips}</div>
  </div>`;
}

function renderSprintCounter(n) {
  let bolts = "";
  for (let i = 0; i < 2; i++) {
    bolts += `<span class="sprint-bolt ${i < n ? "available" : "used"}">⚡</span>`;
  }
  return `<div class="sprint-counter"><strong class="sprint-num">${n}</strong><div class="sprint-bolts">${bolts}</div></div>`;
}

function forecastStrip(state) {
  let tiles = "";
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    const w = state.weather[d - 1];
    const cfg = WEATHER_GLYPH[w];
    const cls =
      d === state.day && state.phase === "playing" ? "current"
      : d < state.day ? "past"
      : "future";
    tiles += `
      <div class="forecast-day forecast-${w} ${cls}" title="Day ${d} — ${cfg.label} (${cfg.hint})">
        <span class="forecast-num">${d}</span>
        <span class="forecast-icon">${cfg.icon}</span>
      </div>`;
  }
  return `
    <section class="forecast-strip card">
      <span class="forecast-label">10-DAY FORECAST</span>
      <div class="forecast-days">${tiles}</div>
      <span class="forecast-legend">
        <span class="legend-item"><span class="legend-icon">☀️</span>+10m</span>
        <span class="legend-item"><span class="legend-icon">☁️</span>normal</span>
        <span class="legend-item"><span class="legend-icon">⛈️</span>forced rest</span>
      </span>
    </section>`;
}

function chartCard(state) {
  return `
    <section class="chart-card card">
      <header class="chart-head">
        <div>
          <h2>The climb so far</h2>
          <p>Every action you pick draws the next point.</p>
        </div>
        <span class="avg-pill">Summit: <strong>${SUMMIT}m</strong></span>
      </header>
      ${chartSVG(state)}
    </section>`;
}

/**
 * The chart itself. ViewBox is 960 × 500, CSS scales it to fit the card.
 */
function chartSVG(state) {
  const VB_W = 960, VB_H = 500;
  const X0 = 110, X1 = 910;
  const Y0 = 60, Y1 = 460;
  const Y_PER_M = (Y1 - Y0) / 500; // 500m mapped to plot height

  const xFor = (day) => X0 + ((day - 1) / (TOTAL_DAYS - 1)) * (X1 - X0);
  const yFor = (m) => Y1 - m * Y_PER_M;

  let yTicks = "";
  for (let m = 0; m <= 500; m += 100) {
    yTicks += `<text x="${X0 - 12}" y="${yFor(m) + 4}" text-anchor="end" class="y-tick">${m}m</text>`;
    yTicks += `<line x1="${X0}" y1="${yFor(m)}" x2="${X1}" y2="${yFor(m)}" class="grid-line"/>`;
  }

  const summitY = yFor(SUMMIT);
  const summitLine = `
    <line x1="${X0}" y1="${summitY}" x2="${X1}" y2="${summitY}" class="summit-line"/>
    <g transform="translate(${X1 + 24} ${summitY})">${trophy(0.85)}</g>
    <text x="${X1 + 24}" y="${summitY + 56}" text-anchor="middle" class="summit-label">SUMMIT</text>`;

  let path = "";
  let dots = "";
  state.history.forEach((d, i) => {
    const x = xFor(d.day);
    const y = yFor(d.altitudeAfter);
    path += (i === 0 ? `M${xFor(1)} ${yFor(0)} L` : "L") + ` ${x} ${y} `;
    const emoji = ACTIONS[d.action].emoji;
    dots += `
      <g class="day-marker done">
        <circle cx="${x}" cy="${y}" r="11"/>
        <text x="${x}" y="${y - 22}" text-anchor="middle" class="dot-gain">+${d.altitudeGain}</text>
        <text x="${x}" y="${y + 30}" text-anchor="middle" class="dot-action">${emoji}</text>
      </g>`;
  });

  let currentMarker = "";
  if (state.phase === "playing") {
    const x = xFor(state.day);
    const y = yFor(state.altitude);
    currentMarker = `
      <g class="day-marker current">
        <circle cx="${x}" cy="${y}" r="20" class="pulse-ring"/>
        <g transform="translate(${x} ${y - 22})">${bug(0.85)}</g>
      </g>`;
  }

  let futureDots = "";
  for (let d = state.day + (state.phase === "playing" ? 1 : 0); d <= TOTAL_DAYS; d++) {
    const x = xFor(d);
    futureDots += `<circle cx="${x}" cy="${yFor(0)}" r="6" class="future-dot"/>`;
  }

  let dayLabels = "";
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    const x = xFor(d);
    const cls = d === state.day && state.phase === "playing" ? "day-label current" : (d < state.day ? "day-label past" : "day-label future");
    dayLabels += `<text x="${x}" y="${Y1 + 32}" text-anchor="middle" class="${cls}">${d}</text>`;
  }

  return `
    <div class="chart-wrap">
      <svg viewBox="0 0 ${VB_W} ${VB_H}" class="chart" role="img" aria-label="Mountain climb chart">
        <rect x="${X0 - 20}" y="${Y0 - 20}" width="${X1 - X0 + 40}" height="${Y1 - Y0 + 40}" rx="14" class="plot-bg"/>
        ${yTicks}
        ${summitLine}
        ${path ? `<path d="${path.trim()}" class="climb-line"/>` : ""}
        ${futureDots}
        ${dots}
        ${currentMarker}
        ${dayLabels}
        <text x="${(X0 + X1) / 2}" y="${Y1 + 56}" text-anchor="middle" class="x-axis-title">Day</text>
      </svg>
    </div>`;
}

function todayCard(state) {
  const w = todayWeather(state);
  if (!w) return "";
  const cfg = WEATHER_GLYPH[w];
  return `
    <section class="today-card card weather-${w}">
      <span class="today-label">TODAY · DAY ${state.day}</span>
      <svg viewBox="-40 -40 80 80" aria-hidden="true">${cfg.fn(1)}</svg>
      <strong class="today-name">${cfg.label}</strong>
      <p class="today-hint">${cfg.hint}</p>
    </section>`;
}

function actionCard(state) {
  const today = todayWeather(state);

  if (today === "storm") {
    return `
      <section class="action-card card storm-action">
        <h3>YOUR MOVE</h3>
        <p class="action-prompt">⛈️ Storming today. Bug-Bug must rest.</p>
        <button class="action-btn action-rest" data-action="play:rest">
          <span class="emoji">🛌</span>
          <span class="label">RIDE OUT THE STORM</span>
          <span class="meta">0 stamina · 0m</span>
        </button>
        <p class="action-hint">No sprint or climb today — the storm decides for you.</p>
      </section>`;
  }

  // Non-storm day → climb / sprint
  const sprintsLeft = sprintsRemaining(state);
  const sunny = today === "sunny";
  let hint;
  if (sunny && sprintsLeft > 0) {
    hint = "☀️ Sunny! A great day to SPRINT (+10m bonus).";
  } else if (sunny) {
    hint = "☀️ Sunny — but you've used your sprints. Still +10m on climb.";
  } else if (sprintsLeft === 0) {
    hint = "All sprints used. Just climb your way home.";
  } else {
    hint = "☁️ Cloudy day — save sprints for sunny days if you can.";
  }

  return `
    <section class="action-card card">
      <h3>YOUR MOVE</h3>
      <p class="action-prompt">Pick climb or sprint →</p>
      ${actionButton(state, "climb")}
      ${actionButton(state, "sprint")}
      <p class="action-hint">${hint}</p>
    </section>`;
}

function actionButton(state, action) {
  const meta = ACTIONS[action];
  const ok = canDo(state, action);
  const disabled = ok.ok ? "" : "disabled";
  const reason = ok.ok ? "" : `data-reason="${escapeAttr(ok.reason)}"`;
  const altRange = `+${meta.altMin}–${meta.altMax}m`;
  const stamCost = meta.staminaDelta === -1 ? "−1 stamina" : "−2 stamina";
  return `
    <button class="action-btn action-${action}" data-action="play:${action}" ${disabled} ${reason}>
      <span class="emoji">${meta.emoji}</span>
      <span class="label">${meta.label}</span>
      <span class="meta">${altRange}  ·  ${stamCost}</span>
    </button>`;
}

function tipFooter(state) {
  const recent = state.history.slice(-5).map((d) => {
    const emoji = ACTIONS[d.action].emoji;
    return `<span class="chip">${emoji} ${d.altitudeGain}m</span>`;
  }).join("");

  const stillNeed = Math.max(0, SUMMIT - state.altitude);
  const daysLeft = activeDaysRemaining(state);
  const sprintsLeft = sprintsRemaining(state);

  // Strategic helper text
  let tipText;
  if (stillNeed === 0) {
    tipText = "Summit reached! Anything more is bonus altitude for stars.";
  } else if (daysLeft === 0) {
    tipText = "No active days left — the storms are running out the clock.";
  } else if (sprintsLeft === 0) {
    const climbsNeeded = Math.ceil(stillNeed / 50);
    tipText = `Need about ${climbsNeeded} more climb${climbsNeeded === 1 ? "" : "s"} to summit. Stay steady.`;
  } else {
    const sunnyAhead = state.weather.slice(state.day - 1).filter(w => w === "sunny").length;
    if (sunnyAhead > 0) {
      tipText = `${sunnyAhead} sunny day${sunnyAhead === 1 ? "" : "s"} ahead. Save sprints for them if you can.`;
    } else {
      tipText = `No more sunny days. Sprint today if you have stamina to spare.`;
    }
  }

  const lastResult = state.lastResult;
  const lastResultText = lastResult
    ? `Last move (Day ${lastResult.day}): ${ACTIONS[lastResult.action].label.toLowerCase()} +${lastResult.altitudeGain}m.`
    : "";

  return `
    <footer class="tip-card card">
      <div class="tip">
        <span class="label">STRATEGY TIP</span>
        <p class="tip-text">${tipText}</p>
        <p class="tip-sub">${stillNeed}m to summit · ${daysLeft} active day${daysLeft === 1 ? "" : "s"} left · ${sprintsLeft} sprint${sprintsLeft === 1 ? "" : "s"} affordable. ${lastResultText}</p>
      </div>
      <div class="recent">
        <span class="label">CLIMB SO FAR</span>
        <div class="chips">${recent || `<span class="chip dim">—</span>`}</div>
      </div>
    </footer>`;
}

// ---------- End screen ----------

export function renderEnd(state) {
  const won = state.outcome === "win";
  const headline = won
    ? (state.stars === 3 ? "🏆 SUMMIT! 3 STARS" : state.stars === 2 ? "✨ SUMMIT REACHED" : "🚩 SUMMIT (BARELY)")
    : "💤 SHORT OF THE SUMMIT";
  const sub = won
    ? `You reached <strong>${state.altitude}m</strong> in ${TOTAL_DAYS} days.`
    : `You finished at <strong>${state.altitude}m</strong> — short of the ${SUMMIT}m summit.`;
  const stars = won ? "⭐".repeat(state.stars) + "☆".repeat(3 - state.stars) : "";
  const counts = countActions(state.history);
  const successMessage = won
    ? `<p class="end-success">🎉 You just built a winning line chart!</p>`
    : `<p class="end-success">Try again — sprint on more sunny days next time.</p>`;
  return `
    <div class="screen end-screen">
      <svg class="defs-only" aria-hidden="true">${gradientDefs()}</svg>
      <div class="end-card card">
        ${muteButton("mute-toggle-floating")}
        <h1 class="end-headline ${won ? "won" : "lost"}">${headline}</h1>
        <p class="end-stars">${stars}</p>
        ${successMessage}
        <p class="end-sub">${sub}</p>
        ${chartSVG(state)}
        <ul class="end-recap">
          <li>🥾 Climbed <strong>${counts.climb}</strong> ×</li>
          <li>⚡ Sprinted <strong>${counts.sprint}</strong> ×</li>
          <li>⛈️ Storms ridden out: <strong>${counts.rest}</strong></li>
        </ul>
        <div class="end-actions">
          <button class="primary-btn" data-action="new-game">🆕 NEW CLIMB</button>
          <button class="ghost-btn" data-action="replay-seed">↻ REPLAY GAME</button>
        </div>
      </div>
    </div>`;
}

function countActions(history) {
  return history.reduce((acc, d) => ((acc[d.action]++, acc)), { rest: 0, climb: 0, sprint: 0 });
}

// ---------- util ----------

function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}
