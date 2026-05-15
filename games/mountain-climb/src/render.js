// Render functions per screen. Each returns an HTML string for #app.

import {
  ACTIONS, SUMMIT, TOTAL_DAYS, STARTING_STAMINA, canDo,
  todayWeather, summitFraction, isRestDay,
} from "./state.js";
import {
  bug, trophy, sun, cloud, storm, gradientDefs,
} from "./svg.js";
import { isMuted } from "./audio.js";

function muteButton(extraClass = "") {
  const m = isMuted();
  return `<button class="mute-toggle ${extraClass}" data-action="toggle-mute" aria-label="${m ? "Unmute" : "Mute"} sound" title="${m ? "Sound off — click to enable" : "Sound on — click to mute"}">${m ? "🔇" : "🔊"}</button>`;
}

// Weather config. Cloudy and storm are both "sleep" days mechanically.
const WEATHER_GLYPH = {
  sunny:  { fn: sun,   label: "SUNNY",   hint: "great day to climb or sprint",       icon: "☀️" },
  cloudy: { fn: cloud, label: "CLOUDY",  hint: "Bug-Bug naps in the shade",          icon: "💤" },
  storm:  { fn: storm, label: "STORMY",  hint: "Bug-Bug shelters from the storm",    icon: "💤" },
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
            <p class="howto-goal"><strong>🏔 Goal:</strong> Climb to <strong>${SUMMIT}m</strong> by day ${TOTAL_DAYS}. Reach the summit and your line chart wins!</p>

            <p class="howto-hook"><strong>The Twist:</strong> Only <strong>☀️ sunny days</strong> are climb days. On <strong>☁️ cloudy</strong> and <strong>⛈️ stormy</strong> days, Bug-Bug sleeps — no movement at all.</p>

            <h4>The weather</h4>
            <ul class="howto-weather">
              <li><span class="howto-icon">☀️</span> <strong>Sunny</strong> — climb or sprint.</li>
              <li><span class="howto-icon">💤</span> <strong>Cloudy or stormy</strong> — Bug-Bug sleeps. The day passes with no progress.</li>
            </ul>

            <h4>Your two actions on sunny days</h4>
            <ul class="howto-actions">
              <li>🥾 <strong>CLIMB</strong> — costs 1 stamina, steady altitude gain.</li>
              <li>⚡ <strong>SPRINT</strong> — costs 2 stamina, bigger altitude gain.</li>
            </ul>

            <p>You start with <strong>${STARTING_STAMINA} stamina</strong>. Stamina <em>does not refill</em>. Spend it wisely.</p>

            <p class="howto-tip"><strong>💡 Why it matters:</strong> If you don't reach the summit, the line chart slides back to zero — all your effort wasted. A line chart only counts if it's "hooked" at both ends. Figure out the right mix of climbs and sprints to make it.</p>
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
        <span class="legend-item"><span class="legend-icon">☀️</span>climb day</span>
        <span class="legend-item"><span class="legend-icon">💤</span>sleep day</span>
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
  const Y_PER_M = (Y1 - Y0) / 500;

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

  // Draw the actual climb. The path traces every day so the line stays
  // continuous, but we only place a marker / "+Xm" label on days where
  // Bug-Bug actually moved (climbs and sprints). Sleep days hold the
  // altitude flat and aren't data points worth highlighting.
  let path = "";
  let dots = "";
  state.history.forEach((d, i) => {
    const x = xFor(d.day);
    const y = yFor(d.altitudeAfter);
    path += (i === 0 ? `M${xFor(1)} ${yFor(0)} L` : "L") + ` ${x} ${y} `;
    if (d.action !== "rest") {
      const emoji = ACTIONS[d.action].emoji;
      dots += `
        <g class="day-marker done">
          <circle cx="${x}" cy="${y}" r="11"/>
          <text x="${x}" y="${y - 22}" text-anchor="middle" class="dot-gain">+${d.altitudeGain}</text>
          <text x="${x}" y="${y + 30}" text-anchor="middle" class="dot-action">${emoji}</text>
        </g>`;
    }
  });

  // Slide-back animation on loss — the line trails from the final position
  // back down to the starting point (day 1, altitude 0) to dramatise the
  // "line not hooked at both ends" idea.
  let slideBack = "";
  if (state.phase === "ended" && state.outcome === "lose" && state.history.length > 0) {
    const last = state.history[state.history.length - 1];
    const fromX = xFor(last.day);
    const fromY = yFor(last.altitudeAfter);
    const toX = xFor(1);
    const toY = yFor(0);
    slideBack = `
      <path d="M ${fromX} ${fromY} L ${toX} ${toY}" class="slide-back-line"/>
      <g class="slide-back-bug" transform="translate(${toX} ${toY - 26})">
        ${bug(0.85)}
        <text x="0" y="38" text-anchor="middle" class="slide-back-label">💤 slid back to start</text>
      </g>`;
  }

  // Current day marker (during play only).
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

  // Future-day placeholder dots on the x-axis.
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
        ${slideBack}
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
  const sleeping = isRestDay(w);
  const headline = sleeping ? `💤 ${cfg.label}` : cfg.label;
  return `
    <section class="today-card card weather-${w} ${sleeping ? "sleeping" : "active"}">
      <span class="today-label">TODAY · DAY ${state.day}</span>
      ${sleeping
        ? `<div class="today-sleep-icon">💤</div>`
        : `<svg viewBox="-40 -40 80 80" aria-hidden="true">${cfg.fn(1)}</svg>`}
      <strong class="today-name">${headline}</strong>
      <p class="today-hint">${cfg.hint}</p>
    </section>`;
}

function actionCard(state) {
  const today = todayWeather(state);

  if (isRestDay(today)) {
    const msg = today === "cloudy"
      ? "Bug-Bug yawns, snuggles deeper into the shade, and keeps sleeping. The day passes."
      : "The storm howls. Bug-Bug refuses to come out of shelter. The day passes.";
    return `
      <section class="action-card card sleep-action">
        <h3>YOUR MOVE</h3>
        <p class="action-prompt">💤 ${today === "cloudy" ? "Cloudy" : "Stormy"} — Bug-Bug is fast asleep.</p>
        <button class="action-btn action-rest" data-action="play:rest">
          <span class="emoji">💤</span>
          <span class="label">WAKE BUG-BUG UP →</span>
          <span class="meta">try anyway — see what happens</span>
        </button>
        <p class="action-hint">${msg}</p>
      </section>`;
  }

  // Sunny day → climb / sprint
  return `
    <section class="action-card card">
      <h3>YOUR MOVE</h3>
      <p class="action-prompt">☀️ Sunny — make it count.</p>
      ${actionButton(state, "climb")}
      ${actionButton(state, "sprint")}
      <p class="action-hint">Steady climbs cost less. Sprints cost more but get you further.</p>
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
    const gainText = d.action === "rest" ? "—" : `${d.altitudeGain}m`;
    return `<span class="chip">${emoji} ${gainText}</span>`;
  }).join("");

  const stillNeed = Math.max(0, SUMMIT - state.altitude);
  const lastResult = state.lastResult;

  let tipText;
  if (stillNeed === 0) {
    tipText = "Summit reached! Keep going if you want a higher star tier.";
  } else if (lastResult && lastResult.action === "rest") {
    tipText = "A day passed with Bug-Bug asleep. Sunny days are precious.";
  } else if (lastResult && lastResult.action === "sprint") {
    tipText = "Good push. That sprint cost real stamina though.";
  } else if (lastResult && lastResult.action === "climb") {
    tipText = "Steady climb. Keep your stamina in mind.";
  } else {
    tipText = "Read the forecast. Pick your moves carefully.";
  }

  const lastResultText = lastResult
    ? lastResult.action === "rest"
      ? `Day ${lastResult.day} — Bug-Bug slept.`
      : `Day ${lastResult.day} — ${ACTIONS[lastResult.action].label.toLowerCase()} +${lastResult.altitudeGain}m.`
    : "";

  return `
    <footer class="tip-card card">
      <div class="tip">
        <span class="label">STRATEGY TIP</span>
        <p class="tip-text">${tipText}</p>
        <p class="tip-sub">${stillNeed}m to summit. ${lastResultText}</p>
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
    : "💤 SLID BACK TO START";
  const sub = won
    ? `You reached <strong>${state.altitude}m</strong> in ${TOTAL_DAYS} days.`
    : `You climbed to <strong>${state.peakAltitude}m</strong>, but didn't reach the ${SUMMIT}m summit. The line slid all the way back to zero — effort wasted!`;
  const stars = won ? "⭐".repeat(state.stars) + "☆".repeat(3 - state.stars) : "";
  const counts = countActions(state.history);
  const successMessage = won
    ? `<p class="end-success">🎉 You completed a winning line chart! Both ends hooked.</p>`
    : `<p class="end-success">A line chart only counts if it's hooked at both ends. Try again — spend sprints to bridge to the summit.</p>`;
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
          <li>💤 Slept <strong>${counts.rest}</strong> days</li>
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
