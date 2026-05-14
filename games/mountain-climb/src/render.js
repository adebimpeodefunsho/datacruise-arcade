// Render functions per screen. Each returns an HTML string for #app.

import {
  ACTIONS, SUMMIT, TOTAL_DAYS, MAX_STAMINA, canDo,
  todayWeather, tomorrowWeather, avgNeededPerDay, summitFraction,
} from "./state.js";
import {
  bug, trophy, sun, cloud, storm, heartFull, heartEmpty, gradientDefs,
} from "./svg.js";
import { isMuted } from "./audio.js";

function muteButton(extraClass = "") {
  const m = isMuted();
  return `<button class="mute-toggle ${extraClass}" data-action="toggle-mute" aria-label="${m ? "Unmute" : "Mute"} sound" title="${m ? "Sound off — click to enable" : "Sound on — click to mute"}">${m ? "🔇" : "🔊"}</button>`;
}

const WEATHER_GLYPH = {
  sunny:  { fn: sun,   label: "SUNNY",  hint: "+10m bonus" },
  cloudy: { fn: cloud, label: "CLOUDY", hint: "no modifier" },
  storm:  { fn: storm, label: "STORM",  hint: "-10m · no sprint" },
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
        <p class="title-subtitle">A line-chart climbing game · DataCruise Arcade</p>
        <button class="primary-btn" data-action="start">▶ PLAY</button>
        <p class="title-best">Best: <strong>${stars}</strong></p>
        <details class="title-howto">
          <summary>How to play</summary>
          <ul>
            <li>You have <strong>10 days</strong> to climb to <strong>${SUMMIT}m</strong>.</li>
            <li>Each day pick <strong>🛌 Rest</strong>, <strong>🥾 Climb</strong>, or <strong>⚡ Sprint</strong>.</li>
            <li>Weather matters — ☀️ Sunny adds +10m, ⛈️ Storm subtracts 10m and blocks Sprint.</li>
            <li>Watch your <strong>stamina</strong>. Sprint costs 2, Climb costs 1, Rest gives back 2.</li>
            <li>Every choice plots the next point on your line chart. The chart is your climb.</li>
          </ul>
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
      <main class="game-main">
        ${chartCard(state)}
        <aside class="side">
          ${forecastCard(state)}
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
          <p>DataCruise Arcade · seed <code>${state.seed}</code></p>
        </div>
      </div>
      <div class="day-pill">
        <span class="label">DAY</span>
        <strong>${state.day} / ${TOTAL_DAYS}</strong>
      </div>
      <div class="stat stat-stamina">
        <span class="label">STAMINA</span>
        <div class="hearts">${renderHearts(state.stamina)}</div>
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

function renderHearts(stamina) {
  let out = "";
  for (let i = 0; i < MAX_STAMINA; i++) {
    const fn = i < stamina ? heartFull : heartEmpty;
    out += `<svg viewBox="-22 -16 44 40" class="heart">${fn(1)}</svg>`;
  }
  return out;
}

function chartCard(state) {
  return `
    <section class="chart-card card">
      <header class="chart-head">
        <div>
          <h2>The climb so far</h2>
          <p>Every action you pick draws the next point.</p>
        </div>
        <span class="avg-pill">Avg needed: <strong>${avgNeededPerDay(state)} m/day</strong></span>
      </header>
      ${chartSVG(state)}
    </section>`;
}

/**
 * The chart itself. ViewBox is 960 × 500, CSS scales it to fit the card.
 * X: day 1 -> x=110, day 10 -> x=910 (step ≈ 88.9).
 * Y: 0m -> y=460, 500m -> y=60 (range 400 / 500m, 0.8 per m).
 */
function chartSVG(state) {
  const VB_W = 960, VB_H = 500;
  const X0 = 110, X1 = 910;
  const Y0 = 60, Y1 = 460;
  const Y_PER_M = (Y1 - Y0) / 500; // 500m mapped to plot height

  const xFor = (day) => X0 + ((day - 1) / (TOTAL_DAYS - 1)) * (X1 - X0);
  const yFor = (m) => Y1 - m * Y_PER_M;

  // Y-axis ticks every 100m
  let yTicks = "";
  for (let m = 0; m <= 500; m += 100) {
    yTicks += `<text x="${X0 - 12}" y="${yFor(m) + 4}" text-anchor="end" class="y-tick">${m}m</text>`;
    yTicks += `<line x1="${X0}" y1="${yFor(m)}" x2="${X1}" y2="${yFor(m)}" class="grid-line"/>`;
  }

  // Summit dashed line
  const summitY = yFor(SUMMIT);
  const summitLine = `
    <line x1="${X0}" y1="${summitY}" x2="${X1}" y2="${summitY}" class="summit-line"/>
    <g transform="translate(${X1 + 24} ${summitY})">${trophy(0.85)}</g>
    <text x="${X1 + 24}" y="${summitY + 56}" text-anchor="middle" class="summit-label">SUMMIT</text>`;

  // Past dots + line
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

  // Current day marker (if still playing)
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

  // Future day ticks (empty dashed dots on x-axis)
  let futureDots = "";
  for (let d = state.day + (state.phase === "playing" ? 1 : 0); d <= TOTAL_DAYS; d++) {
    const x = xFor(d);
    futureDots += `<circle cx="${x}" cy="${yFor(0)}" r="6" class="future-dot"/>`;
  }

  // Day labels along the bottom
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

function forecastCard(state) {
  const today = todayWeather(state);
  const tomorrow = tomorrowWeather(state);
  return `
    <section class="forecast-card card">
      <h3>FORECAST</h3>
      <div class="forecast-row">
        ${weatherTile(today, "TODAY")}
        <span class="forecast-arrow">➜</span>
        ${weatherTile(tomorrow, "TOMORROW")}
      </div>
    </section>`;
}

function weatherTile(weather, label) {
  if (!weather) return `<div class="weather-tile empty"><span class="label">${label}</span><p>—</p></div>`;
  const cfg = WEATHER_GLYPH[weather];
  return `
    <div class="weather-tile weather-${weather}">
      <svg viewBox="-40 -40 80 80" aria-hidden="true">${cfg.fn(1)}</svg>
      <span class="label">${label}</span>
      <strong>${cfg.label}</strong>
      <p>${cfg.hint}</p>
    </div>`;
}

function actionCard(state) {
  const today = todayWeather(state);
  let hint = "Choose your action for today.";
  let bestAction = null;
  if (today === "sunny") {
    hint = "☀️ Sunny day! Sprint pays an extra +10m.";
    if (canDo(state, "sprint").ok) bestAction = "sprint";
  } else if (today === "storm") {
    hint = "⛈️ Storm today — Sprint blocked. Rest or climb gently.";
    bestAction = "rest";
  } else if (state.stamina <= 1) {
    hint = "🪫 Low stamina — a Rest now opens up Sprint tomorrow.";
    bestAction = "rest";
  }

  return `
    <section class="action-card card">
      <h3>YOUR MOVE</h3>
      <p class="action-prompt">Pick an action →</p>
      ${actionButton(state, "rest", bestAction === "rest")}
      ${actionButton(state, "climb", bestAction === "climb")}
      ${actionButton(state, "sprint", bestAction === "sprint")}
      <p class="action-hint">${hint}</p>
    </section>`;
}

function actionButton(state, action, isBest) {
  const meta = ACTIONS[action];
  const ok = canDo(state, action);
  const disabled = ok.ok ? "" : "disabled";
  const reason = ok.ok ? "" : `data-reason="${escapeAttr(ok.reason)}"`;
  const bestBadge = isBest && ok.ok ? `<span class="badge-best">BEST</span>` : "";
  const altRange = `+${meta.altMin}–${meta.altMax}m`;
  const staminaText = meta.staminaDelta >= 0 ? `+${meta.staminaDelta} stamina` : `${meta.staminaDelta} stamina`;
  return `
    <button class="action-btn action-${action}" data-action="play:${action}" ${disabled} ${reason}>
      <span class="emoji">${meta.emoji}</span>
      <span class="label">${meta.label}${bestBadge}</span>
      <span class="meta">${altRange}  ·  ${staminaText}</span>
    </button>`;
}

function tipFooter(state) {
  const recent = state.history.slice(-5).map((d) => {
    const emoji = ACTIONS[d.action].emoji;
    return `<span class="chip">${emoji} ${d.altitudeGain}m</span>`;
  }).join("");
  let tipText = "Climb steady, sprint when the sun is out.";
  const today = todayWeather(state);
  const tomorrow = tomorrowWeather(state);
  if (today === "sunny" && tomorrow === "storm") {
    tipText = "Storm rolls in tomorrow — Sprint today while the sun is out, then rest through the storm.";
  } else if (today === "storm") {
    tipText = "Storm today — Sprint isn't allowed. Climb gently or rest.";
  } else if (state.stamina === 0) {
    tipText = "Stamina is empty — Rest to bring it back.";
  } else if (today === "sunny") {
    tipText = "Sunny — every action gets +10m today.";
  }
  const lastResult = state.lastResult;
  const lastResultText = lastResult
    ? `Yesterday (${labelOfDay(lastResult)}) you ${ACTIONS[lastResult.action].label.toLowerCase()}ed for +${lastResult.altitudeGain}m.`
    : "";
  return `
    <footer class="tip-card card">
      <div class="tip">
        <span class="label">STRATEGY TIP</span>
        <p class="tip-text">${tipText}</p>
        <p class="tip-sub">You need an average <strong>${avgNeededPerDay(state)} m/day</strong>. ${lastResultText}</p>
      </div>
      <div class="recent">
        <span class="label">CLIMB SO FAR</span>
        <div class="chips">${recent || `<span class="chip dim">—</span>`}</div>
      </div>
    </footer>`;
}

function labelOfDay(d) {
  return `Day ${d.day}`;
}

// ---------- End screen ----------

export function renderEnd(state) {
  const won = state.outcome === "win";
  const headline = won ? (state.stars === 3 ? "🏆 TRIUMPH" : state.stars === 2 ? "✨ SUMMIT REACHED" : "🚩 SUMMIT (BARELY)") : "💤 TRY AGAIN";
  const sub = won
    ? `You reached <strong>${state.altitude}m</strong> in ${TOTAL_DAYS} days.`
    : `You finished at <strong>${state.altitude}m</strong> — short of the ${SUMMIT}m summit.`;
  const stars = won ? "⭐".repeat(state.stars) + "☆".repeat(3 - state.stars) : "";
  const counts = countActions(state.history);
  const successMessage = won
    ? `<p class="end-success">🎉 You just successfully plotted a line chart!</p>`
    : "";
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
          <li>🛌 Rested <strong>${counts.rest}</strong> ×</li>
          <li>⛈️ Storms encountered: <strong>${state.weather.filter((w) => w === "storm").length}</strong></li>
        </ul>
        <div class="end-actions">
          <button class="primary-btn" data-action="new-game">🆕 NEW CLIMB</button>
          <button class="ghost-btn" data-action="replay-seed">↻ REPLAY SEED <code>${state.seed}</code></button>
          <button class="ghost-btn" data-action="share-seed">🔗 SHARE SEED</button>
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
