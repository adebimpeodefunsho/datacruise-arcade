// Render functions per screen. Each returns an HTML string for #app.

import {
  SUMMIT, TOTAL_DAYS, STARTING_STAMINA,
  todayWeather, todayCards, canPick, canContinue, summitFraction,
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
  sunny:  { fn: sun,   label: "SUNNY",  hint: "watch out for heat", icon: "☀️" },
  cloudy: { fn: cloud, label: "CLOUDY", hint: "easy to get lost",   icon: "☁️" },
  storm:  { fn: storm, label: "STORMY", hint: "danger in the rain", icon: "⛈️" },
};

// ---------- Title screen ----------

export function renderTitle(bestStars) {
  // Always show 3 yellow star slots so the player can see the goal at a
  // glance. Earned stars are bright filled ⭐ (with glow); unearned stars
  // are bright YELLOW outlines (not dimmed) so all three look like part of
  // the same row. After each game ends, bestStars is updated in localStorage
  // so the row fills in over time as the player performs better.
  let stars = '';
  for (let i = 0; i < 3; i++) {
    const filled = i < bestStars;
    stars += `<span class="best-star ${filled ? 'filled' : 'empty'}">${filled ? '⭐' : '☆'}</span>`;
  }
  return `
    <div class="screen title-screen">
      <div class="title-card">
        ${muteButton("mute-toggle-floating")}
        <svg class="title-bug" viewBox="-60 -50 120 110">
          ${gradientDefs()}
          ${bug(1.4)}
        </svg>
        <h1 class="title-heading">BUG-BUG'S<br/>MOUNTAIN CLIMB</h1>
        <p class="title-subtitle">A hazard-guessing climb game · DataCruise Arcade</p>
        <button class="primary-btn" data-action="start">▶ PLAY</button>
        <p class="title-best">Best: <span class="best-stars">${stars}</span></p>
        <details class="title-howto" open>
          <summary>How to play (click to expand)</summary>
          <div class="howto-body">
            <p class="howto-goal"><strong>🏔 Goal:</strong> Survive <strong>${TOTAL_DAYS} days</strong> on the mountain with stamina still in the tank.</p>

            <p class="howto-hook"><strong>The Twist:</strong> Each day you'll see <strong>3 face-down cards</strong>. <strong>Two are hazards</strong>, only <strong>one is safe</strong>. Pick one. All three flip.</p>

            <h4>What each pick does</h4>
            <ul class="howto-actions">
              <li>✅ <strong>Safe card</strong> — Bug-Bug climbs <strong>up</strong>.</li>
              <li>⚠️ <strong>Hazard card</strong> — Bug-Bug <strong>slips and dips</strong> down the mountain, and loses 1 stamina.</li>
            </ul>

            <p>Bug-Bug has <strong>${STARTING_STAMINA} stamina</strong>. Run out of stamina and the climb is over.</p>

            <h4>Each weather brings its own hazards</h4>
            <ul class="howto-weather">
              <li><span class="howto-icon">☀️</span> <strong>Sunny</strong> — heatstroke, dehydration, sunburn.</li>
              <li><span class="howto-icon">☁️</span> <strong>Cloudy</strong> — fog, wrong turns, distractions.</li>
              <li><span class="howto-icon">⛈️</span> <strong>Stormy</strong> — lightning, rivers, mysterious doors.</li>
            </ul>

            <p class="howto-tip"><strong>💡 Why it matters:</strong> Hazards dip the line chart down. Run out of stamina early and the climb stops right where Bug-Bug stands — no slide back, but no trophy either. Survive all 7 days to plant the trophy at your final altitude. Make it to day 7 even on empty stamina and you still earn a half-star "exhausted finish".</p>
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
          ${cardsArea(state)}
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
        ${renderStaminaHearts(state.stamina)}
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

function renderStaminaHearts(stamina) {
  let hearts = "";
  for (let i = 0; i < MAX_STAMINA_VISUAL; i++) {
    const active = i < stamina;
    hearts += `<span class="stamina-heart ${active ? "alive" : "lost"}">${active ? "❤️" : "🖤"}</span>`;
  }
  return `<div class="stamina-display">
    <strong class="stamina-num">${stamina}</strong>
    <span class="stamina-of">/ ${STARTING_STAMINA}</span>
    <div class="stamina-hearts">${hearts}</div>
  </div>`;
}

const MAX_STAMINA_VISUAL = STARTING_STAMINA;

function forecastStrip(state) {
  let tiles = "";
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    const w = state.weather[d - 1];
    const cfg = WEATHER_GLYPH[w];
    const cls =
      d === state.day && state.phase === "playing" ? "current"
      : d < state.day ? "past"
      : "future";
    // If the day is past, indicate whether it was a hazard pick.
    let extra = "";
    if (cls === "past") {
      const h = state.history[d - 1];
      if (h && h.wasHazard) extra = `<span class="forecast-pick hazard">⚠️</span>`;
      else if (h) extra = `<span class="forecast-pick safe">✓</span>`;
    }
    tiles += `
      <div class="forecast-day forecast-${w} ${cls}" title="Day ${d} — ${cfg.label} (${cfg.hint})">
        <span class="forecast-num">${d}</span>
        <span class="forecast-icon">${cfg.icon}</span>
        ${extra}
      </div>`;
  }
  return `
    <section class="forecast-strip card">
      <span class="forecast-label">${TOTAL_DAYS}-DAY FORECAST</span>
      <div class="forecast-days">${tiles}</div>
      <span class="forecast-legend">
        <span class="legend-item"><span class="legend-icon">✓</span>safe</span>
        <span class="legend-item"><span class="legend-icon">⚠️</span>hazard</span>
      </span>
    </section>`;
}

function chartCard(state) {
  return `
    <section class="chart-card card">
      <header class="chart-head">
        <div>
          <h2>The climb so far</h2>
          <p>Every survived day plots the next point.</p>
        </div>
        <span class="avg-pill">Summit: <strong>${SUMMIT}m</strong></span>
      </header>
      ${chartSVG(state)}
    </section>`;
}

function chartSVG(state) {
  const VB_W = 960, VB_H = 500;
  const X0 = 140, X1 = 910;     // X0 widened to make room for the Y-axis title
  const Y0 = 60, Y1 = 460;
  const Y_PER_M = (Y1 - Y0) / 400; // 400m mapped to plot height (room above summit)

  const xFor = (day) => X0 + ((day - 1) / (TOTAL_DAYS - 1)) * (X1 - X0);
  const yFor = (m) => Y1 - m * Y_PER_M;

  let yTicks = "";
  for (let m = 0; m <= 400; m += 50) {
    yTicks += `<text x="${X0 - 12}" y="${yFor(m) + 4}" text-anchor="end" class="y-tick">${m}</text>`;
    yTicks += `<line x1="${X0}" y1="${yFor(m)}" x2="${X1}" y2="${yFor(m)}" class="grid-line"/>`;
  }

  // Y-axis title (rotated 90°)
  const yAxisTitle = `
    <text x="${X0 - 70}" y="${(Y0 + Y1) / 2}" text-anchor="middle"
          transform="rotate(-90 ${X0 - 70} ${(Y0 + Y1) / 2})"
          class="y-axis-title">Altitude (m)</text>`;

  const summitY = yFor(SUMMIT);
  const summitLine = `
    <line x1="${X0}" y1="${summitY}" x2="${X1}" y2="${summitY}" class="summit-line"/>
    <text x="${X1 + 24}" y="${summitY + 5}" text-anchor="start" class="summit-label">🏔 SUMMIT</text>`;

  let path = "";
  let dots = "";
  state.history.forEach((d, i) => {
    const x = xFor(d.day);
    const y = yFor(d.altitudeAfter);
    path += (i === 0 ? `M${xFor(1)} ${yFor(0)} L` : "L") + ` ${x} ${y} `;
    const icon = d.pickedCard.icon;
    const dotCls = d.wasHazard ? "hazard" : "safe";
    const altDelta = d.altitudeAfter - d.altitudeBefore;
    const deltaLabel = d.wasHazard
      ? `${altDelta < 0 ? "" : "+"}${altDelta}m · −1❤️`
      : `+${altDelta}m`;
    dots += `
      <g class="day-marker done ${dotCls}">
        <circle cx="${x}" cy="${y}" r="13"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" class="dot-icon">${icon}</text>
        <text x="${x}" y="${y - 22}" text-anchor="middle" class="dot-gain ${dotCls}">${deltaLabel}</text>
      </g>`;
  });

  // Victory trophy — appears at Bug-Bug's final landing dot on a win,
  // with the total altitude reached labelled underneath. Higher
  // landings carry the trophy + label higher up the chart.
  // Exhausted finishes (stamina 0 on day 7) still show a trophy but
  // with a wilted / faded variant.
  let victoryTrophy = "";
  if (state.phase === "ended" && state.outcome === "win" && state.history.length > 0) {
    const last = state.history[state.history.length - 1];
    const x = xFor(last.day);
    const y = yFor(last.altitudeAfter);
    const cls = state.exhaustedFinish ? "victory-trophy exhausted" : "victory-trophy";
    victoryTrophy = `
      <g class="${cls}" transform="translate(${x} ${y - 50})">
        ${trophy(1.0)}
        <g class="victory-altitude-badge" transform="translate(0 32)">
          <rect x="-44" y="-14" width="88" height="26" rx="13" class="badge-bg"/>
          <text x="0" y="5" text-anchor="middle" class="badge-text">▲ ${state.altitude}m</text>
        </g>
      </g>`;
  }

  // On loss (stamina exhausted), Bug-Bug stays where they ran out.
  // A callout near the top of the chart says "No more stamina to continue".
  let staminaOut = "";
  if (state.phase === "ended" && state.outcome === "lose" && state.history.length > 0) {
    const last = state.history[state.history.length - 1];
    const bugX = xFor(last.day);
    const bugY = yFor(last.altitudeAfter);
    const calloutX = (X0 + X1) / 2;
    const calloutY = Y0 + 36;
    staminaOut = `
      <g class="stuck-bug" transform="translate(${bugX} ${bugY - 28})">
        ${bug(0.85)}
      </g>
      <g class="stamina-out-callout" transform="translate(${calloutX} ${calloutY})">
        <rect x="-176" y="-22" width="352" height="44" rx="22" class="callout-bg"/>
        <text x="0" y="6" text-anchor="middle" class="callout-text">💔 No more stamina to continue</text>
      </g>`;
  }

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
        ${yAxisTitle}
        ${summitLine}
        ${path ? `<path d="${path.trim()}" class="climb-line"/>` : ""}
        ${futureDots}
        ${dots}
        ${staminaOut}
        ${victoryTrophy}
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

function cardsArea(state) {
  const cards = todayCards(state);
  const revealed = state.revealedToday;

  if (!revealed) {
    // Three face-down cards, click to pick.
    return `
      <section class="cards-card card">
        <h3>PICK A CARD</h3>
        <p class="cards-prompt">Two are hazards. Only one is safe. Trust your luck.</p>
        <div class="card-row">
          ${cards.map((_, i) => faceDownCard(i)).join("")}
        </div>
      </section>`;
  }

  // Cards revealed — show all three, picked one highlighted.
  const pickedCard = revealed.pickedCard;
  const wasHazard = revealed.wasHazard;
  const headline = wasHazard
    ? `<span class="reveal-headline hazard">⚠️ HAZARD — altitude −20m, stamina ${state.stamina} → ${state.stamina - 1}</span>`
    : `<span class="reveal-headline safe">✅ SAFE — altitude +50m</span>`;
  return `
    <section class="cards-card card">
      <h3>${wasHazard ? "OUCH" : "PHEW"}</h3>
      ${headline}
      <p class="cards-description">${pickedCard.icon} <strong>${pickedCard.label}</strong> — ${pickedCard.description}</p>
      <div class="card-row revealed-row">
        ${cards.map((c, i) => revealedCard(c, i === revealed.pickedIndex)).join("")}
      </div>
      <button class="primary-btn continue-btn" data-action="continue">Continue Climbing →</button>
    </section>`;
}

function faceDownCard(index) {
  return `
    <button class="pick-card face-down" data-action="pick:${index}" aria-label="Pick card ${index + 1}">
      <div class="card-back">
        <span class="card-back-q">?</span>
      </div>
    </button>`;
}

function revealedCard(card, isPicked) {
  const isHazard = card.type === "hazard";
  return `
    <div class="pick-card revealed ${isHazard ? "is-hazard" : "is-safe"} ${isPicked ? "is-picked" : "is-other"}">
      <div class="card-front">
        <span class="card-icon">${card.icon}</span>
        <span class="card-label">${card.label}</span>
        <span class="card-badge">${isHazard ? "⚠️ HAZARD" : "✓ SAFE"}</span>
      </div>
    </div>`;
}

function tipFooter(state) {
  const recent = state.history.slice(-5).map((d) => {
    const safe = d.wasHazard ? "⚠️" : "✓";
    return `<span class="chip ${d.wasHazard ? "chip-hazard" : "chip-safe"}">${safe} ${d.pickedCard.icon}</span>`;
  }).join("");

  let tipText;
  if (state.stamina === 1) {
    tipText = "⚠️ One stamina left! The next hazard ends the climb.";
  } else if (state.day > TOTAL_DAYS) {
    tipText = "Summit reached!";
  } else if (state.lastResult && state.lastResult.wasHazard) {
    tipText = "That stung. Trust your luck and keep climbing.";
  } else if (state.lastResult) {
    tipText = "Safe pick! Keep going.";
  } else {
    tipText = "Pick a card to start the climb.";
  }

  return `
    <footer class="tip-card card">
      <div class="tip">
        <span class="label">STRATEGY TIP</span>
        <p class="tip-text">${tipText}</p>
        <p class="tip-sub">Each day brings new hazards. Stamina lost is gone for good.</p>
      </div>
      <div class="recent">
        <span class="label">DAYS SO FAR</span>
        <div class="chips">${recent || `<span class="chip dim">—</span>`}</div>
      </div>
    </footer>`;
}

// ---------- End screen ----------

export function renderEnd(state) {
  const won = state.outcome === "win";
  const exhausted = won && state.exhaustedFinish === true;

  let headline;
  if (exhausted) {
    headline = "💪 EXHAUSTED FINISH";
  } else if (won) {
    headline = state.stars === 3
      ? "🏆 PERFECT CLIMB — 3 STARS"
      : state.stars === 2
        ? "✨ SUMMIT REACHED — 2 STARS"
        : "🚩 SUMMIT (BARELY)";
  } else {
    headline = "💔 OUT OF STAMINA";
  }

  let sub;
  if (exhausted) {
    sub = `Bug-Bug pushed all the way to <strong>${state.altitude}m</strong>, then collapsed at the finish line. You technically made it!`;
  } else if (won) {
    sub = `You survived all ${TOTAL_DAYS} days and finished at <strong>${state.altitude}m</strong> with <strong>${state.stamina} stamina</strong> left.`;
  } else {
    sub = `Bug-Bug ran out of stamina on day ${state.day - 1} at <strong>${state.altitude}m</strong>. The climb ends here.`;
  }

  let stars;
  if (exhausted) {
    stars = `<span class="exhausted-badge">💪 ½★ FINISH</span>`;
  } else if (won) {
    stars = "⭐".repeat(state.stars) + "☆".repeat(3 - state.stars);
  } else {
    stars = "";
  }

  const counts = countOutcomes(state.history);

  let successMessage;
  if (exhausted) {
    successMessage = `<p class="end-success">Half star earned. Bug-Bug collapsed at the summit — try again for a full ⭐ run.</p>`;
  } else if (won) {
    successMessage = `<p class="end-success">🎉 You hooked the line chart at both ends. Stars: ${state.stars} of 3.</p>`;
  } else {
    successMessage = `<p class="end-success">Try again — the cards and weather shuffle every game.</p>`;
  }
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
          <li>✓ Safe picks: <strong>${counts.safe}</strong></li>
          <li>⚠️ Hazards triggered: <strong>${counts.hazard}</strong></li>
          <li>❤️ Stamina remaining: <strong>${state.stamina} / ${STARTING_STAMINA}</strong></li>
        </ul>
        <div class="end-actions">
          <button class="primary-btn" data-action="new-game">🆕 NEW CLIMB</button>
          <button class="ghost-btn" data-action="replay-seed">↻ REPLAY GAME</button>
        </div>
      </div>
    </div>`;
}

function countOutcomes(history) {
  return history.reduce((acc, d) => {
    if (d.wasHazard) acc.hazard++;
    else acc.safe++;
    return acc;
  }, { safe: 0, hazard: 0 });
}
