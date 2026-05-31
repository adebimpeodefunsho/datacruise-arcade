// Decision Lab — render functions. Each returns an HTML string for #app.

import {
  TOTAL_ROUNDS, currentRound, currentQuestion, overallPercent, didWin,
} from './state.js';
import { ROUNDS } from './questions.js';
import { renderChart } from './charts.js';
import { capsule, logoMark, bug } from './svg.js';
import { isMuted } from './audio.js';

function muteButton() {
  const m = isMuted();
  return `<button class="mute-btn" data-action="toggle-mute" title="${m ? 'Sound off — click to enable' : 'Sound on — click to mute'}">${m ? '🔇' : '🔊'}</button>`;
}

// ---------- Top-level dispatch ----------

export function render(state) {
  if (state.phase === 'title')       return renderTitle(state);
  if (state.phase === 'round-intro') return renderRoundIntro(state);
  if (state.phase === 'question')    return renderQuestion(state);
  if (state.phase === 'reveal')      return renderReveal(state);
  if (state.phase === 'round-end')   return renderRoundEnd(state);
  if (state.phase === 'ended')       return renderEnd(state);
  return '<div>Unknown phase</div>';
}

// ---------- Title screen ----------

function renderTitle() {
  return `
    <div class="screen title-screen">
      <div class="title-card">
        <svg class="title-logo" viewBox="-40 -32 80 64">${logoMark(1)}</svg>
        <h1 class="title-heading">BUG-BUG'S<br/>DECISION LAB</h1>
        <p class="title-subtitle">A data-analysis quiz · DataCruise Arcade</p>
        <button class="primary-btn" data-action="start">▶ PLAY</button>
        <details class="title-howto" open>
          <summary>How to play (click to expand)</summary>
          <div class="howto-body">
            <p class="howto-goal"><strong>🎯 Goal:</strong> Survive all <strong>5 rounds</strong>. Each round tests a different data-analysis skill.</p>

            <h4>The 5 rounds</h4>
            <ol class="howto-rounds">
              ${ROUNDS.map((r, i) => `
                <li>
                  <strong>${r.name}</strong> —
                  <span class="howto-round-desc">${escapeHtml(r.description)}</span>
                  <span class="howto-threshold">Pass: ${Math.round(r.passThreshold * 100)}%</span>
                </li>
              `).join('')}
            </ol>

            <h4>How a question works</h4>
            <ul class="howto-flow">
              <li>📊 A chart appears on the <strong>left screen</strong>.</li>
              <li>❓ A question appears beneath it.</li>
              <li>⏱ You have <strong>30 seconds</strong> to type or pick your answer.</li>
              <li>✓ / ✗ The answer flashes right or wrong with the correct value + explanation.</li>
            </ul>

            <p class="howto-tip"><strong>💡 Tip:</strong> Miss the round's pass threshold and Bug-Bug's lab shuts down — the game ends there. Get through all 5 and your overall score (%) is shown at the end.</p>
          </div>
        </details>
      </div>
    </div>`;
}

// ---------- Round intro ----------

function renderRoundIntro(state) {
  const round = currentRound(state);
  const completed = state.roundScores.length;
  const overall = completed > 0 ? Math.round(overallPercent(state) * 100) : null;
  return `
    <div class="screen round-intro-screen">
      <div class="round-intro-card">
        <div class="round-badge">ROUND ${round.number} OF ${TOTAL_ROUNDS}</div>
        <h1 class="round-name">${escapeHtml(round.name)}</h1>
        <p class="round-desc">${escapeHtml(round.description)}</p>
        <div class="round-stats">
          <div class="round-stat">
            <span class="label">QUESTIONS</span>
            <strong>${round.questions.length}</strong>
          </div>
          <div class="round-stat">
            <span class="label">PASS THRESHOLD</span>
            <strong>${Math.round(round.passThreshold * 100)}%</strong>
          </div>
          ${overall !== null ? `<div class="round-stat">
            <span class="label">YOUR AVERAGE</span>
            <strong>${overall}%</strong>
          </div>` : ''}
        </div>
        <button class="primary-btn" data-action="begin-round">START ROUND →</button>
      </div>
    </div>`;
}

// ---------- Question screen (the main gameplay layout) ----------

function renderQuestion(state) {
  const round = currentRound(state);
  const q = currentQuestion(state);
  const qIndex = state.questionIndex + 1;
  const total = round.questions.length;
  return `
    <div class="screen game-screen">
      ${headerBar(state)}
      <main class="game-main">
        ${bigScreen(state, round, q, qIndex, total)}
        ${podPanel(state, q, 'thinking')}
      </main>
    </div>`;
}

function headerBar(state) {
  const round = currentRound(state);
  const qNum = state.questionIndex + 1;
  return `
    <header class="status-bar">
      <div class="brand">
        <svg viewBox="-32 -24 64 48" class="brand-logo">${logoMark(0.6)}</svg>
        <div>
          <h1>DECISION LAB</h1>
          <p>DataCruise Arcade · Series 1</p>
        </div>
      </div>
      <div class="header-stat">
        <span class="label">ROUND</span>
        <strong>${round.number} <span class="dim">/ ${TOTAL_ROUNDS}</span></strong>
      </div>
      <div class="header-stat">
        <span class="label">QUESTION</span>
        <strong>${qNum} <span class="dim">/ ${round.questions.length}</span></strong>
      </div>
      <div class="header-stat">
        <span class="label">SCORE THIS ROUND</span>
        <strong>${state.currentRoundCorrect} <span class="dim">/ ${state.questionIndex + (state.phase === 'reveal' ? 1 : 0)}</span></strong>
      </div>
      <div class="header-stat header-timer ${state.timer <= 5 ? 'urgent' : ''}">
        <span class="label">TIME</span>
        <strong>${state.timer}s</strong>
      </div>
      ${muteButton()}
    </header>`;
}

function bigScreen(state, round, q, qIndex, total) {
  const phase = state.phase;
  const showingReveal = phase === 'reveal';
  return `
    <section class="big-screen">
      <div class="screen-bezel">
        <div class="screen-inner">
          <div class="chart-area">
            ${renderChart(q.chart)}
          </div>
          <div class="question-area">
            <div class="question-meta">
              <span class="question-tag">${escapeHtml(round.name)}</span>
              <span class="question-counter">Q${qIndex} / ${total}</span>
            </div>
            <p class="question-prompt">${escapeHtml(q.prompt)}</p>
          </div>
          ${showingReveal ? renderRevealBanner(state.lastResult, q) : ''}
        </div>
      </div>
    </section>`;
}

function renderRevealBanner(result, q) {
  const correctText = formatAnswerForDisplay(q, q.correctAnswer);
  return `
    <div class="reveal-banner ${result.correct ? 'correct' : 'wrong'}">
      <div class="reveal-headline">
        ${result.correct ? '✓ CORRECT' : '✗ WRONG'}
      </div>
      <div class="reveal-correct">
        Correct answer: <strong>${escapeHtml(correctText)}</strong>
      </div>
      <div class="reveal-explanation">${escapeHtml(q.explanation || '')}</div>
    </div>`;
}

function podPanel(state, q, mood = 'neutral') {
  // The right-hand "pod" area: small screen above the capsule + answer entry below.
  return `
    <aside class="pod-panel">
      <div class="answer-display">
        <span class="label">ANSWER</span>
        <div class="answer-text ${state.typedAnswer ? '' : 'placeholder'}">
          ${state.typedAnswer ? escapeHtml(state.typedAnswer) : 'awaiting input...'}
        </div>
      </div>
      <div class="capsule-wrap capsule-${mood}">
        ${capsule(220, 280, mood)}
      </div>
      <div class="answer-input-area">
        ${renderAnswerInput(state, q)}
      </div>
    </aside>`;
}

function renderAnswerInput(state, q) {
  if (state.phase !== 'question') {
    // On reveal, show the Continue button instead of the input
    return `
      <button class="primary-btn pod-continue-btn" data-action="continue-from-reveal">
        Continue →
      </button>`;
  }

  if (q.type === 'multiple_choice') {
    return `
      <div class="mc-options">
        ${q.options.map((opt) => `
          <button class="mc-btn ${state.typedAnswer === opt ? 'selected' : ''}"
                  data-action="pick-mc"
                  data-value="${escapeAttr(opt)}">
            ${escapeHtml(opt)}
          </button>
        `).join('')}
        <button class="primary-btn pod-submit-btn"
                data-action="submit-answer"
                ${state.typedAnswer ? '' : 'disabled'}>
          Submit →
        </button>
      </div>`;
  }

  // Numeric or free text
  const placeholder = q.type === 'numeric'
    ? (q.unit ? `e.g. 8.4 (${q.unit})` : 'type a number…')
    : 'type your answer…';
  return `
    <form class="answer-form" data-answer-form>
      <input
        type="text"
        class="answer-input"
        data-answer-input
        value="${escapeAttr(state.typedAnswer)}"
        placeholder="${escapeAttr(placeholder)}"
        autocomplete="off"
        spellcheck="false"
        autofocus
      />
      <button class="primary-btn pod-submit-btn" type="submit"
              ${state.typedAnswer ? '' : 'disabled'}>
        Submit →
      </button>
    </form>`;
}

// ---------- Reveal screen (re-uses question screen layout but with reveal-banner) ----------

function renderReveal(state) {
  const round = currentRound(state);
  const q = currentQuestion(state);
  const qIndex = state.questionIndex + 1;
  const total = round.questions.length;
  const mood = state.lastResult?.correct ? 'happy' : 'sad';
  return `
    <div class="screen game-screen reveal-phase">
      ${headerBar(state)}
      <main class="game-main">
        ${bigScreen(state, round, q, qIndex, total)}
        ${podPanel(state, q, mood)}
      </main>
    </div>`;
}

// ---------- Round end ----------

function renderRoundEnd(state) {
  const last = state.roundScores[state.roundScores.length - 1];
  const round = ROUNDS.find(r => r.number === last.round);
  const passed = last.passed;
  return `
    <div class="screen round-end-screen">
      <div class="round-end-card ${passed ? 'passed' : 'failed'}">
        <div class="end-icon">${passed ? '🎉' : '💔'}</div>
        <h1 class="end-headline">${passed ? 'ROUND COMPLETE' : 'ROUND FAILED'}</h1>
        <h2 class="end-roundname">Round ${last.round}: ${escapeHtml(last.name)}</h2>
        <div class="end-score-bar-wrap">
          <div class="end-score-bar">
            <div class="end-score-fill ${passed ? 'pass' : 'fail'}" style="width:${Math.round(last.percent * 100)}%"></div>
            <div class="end-score-threshold" style="left:${Math.round(round.passThreshold * 100)}%" title="Pass threshold"></div>
          </div>
          <div class="end-score-labels">
            <span><strong>${last.correct}</strong> / ${last.total} correct (${Math.round(last.percent * 100)}%)</span>
            <span class="dim">Threshold: ${Math.round(round.passThreshold * 100)}%</span>
          </div>
        </div>
        <p class="end-message">
          ${passed
            ? `Nice work — you met the ${Math.round(round.passThreshold * 100)}% threshold for this round.`
            : `You needed ${Math.round(round.passThreshold * 100)}% but scored ${Math.round(last.percent * 100)}%. The lab shuts down here.`}
        </p>
        <button class="primary-btn" data-action="advance-round">
          ${passed
            ? (last.round < TOTAL_ROUNDS ? 'NEXT ROUND →' : 'SEE FINAL SCORE →')
            : 'SEE FINAL SCORE →'}
        </button>
      </div>
    </div>`;
}

// ---------- End screen ----------

function renderEnd(state) {
  const won = didWin(state);
  const overall = Math.round(overallPercent(state) * 100);
  return `
    <div class="screen final-end-screen">
      <div class="final-end-card">
        <div class="final-icon">${won ? '🏆' : '📉'}</div>
        <h1 class="final-headline">${won ? 'LAB COMPLETE' : 'LAB CLOSED'}</h1>
        <p class="final-sub">
          ${won
            ? `You cleared all ${TOTAL_ROUNDS} rounds — that's the full data-analysis arc.`
            : `You made it to Round ${state.roundScores.length}. Try again — the lab is always open.`}
        </p>

        <div class="final-overall">
          <span class="label">OVERALL SCORE</span>
          <span class="value">${overall}%</span>
        </div>

        <table class="final-table">
          <thead><tr><th>Round</th><th>Topic</th><th>Score</th><th>Pass?</th></tr></thead>
          <tbody>
            ${state.roundScores.map(r => `
              <tr>
                <td>${r.round}</td>
                <td>${escapeHtml(r.name)}</td>
                <td>${r.correct}/${r.total} (${Math.round(r.percent * 100)}%)</td>
                <td>${r.passed ? '✓' : '✗'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="final-actions">
          <button class="primary-btn" data-action="restart">🔁 PLAY AGAIN</button>
        </div>

        <p class="final-data-note">
          📥 Data download coming in the next version — you'll be able to grab the
          datasets used in the quiz to explore them in Tableau / Excel / your tool
          of choice.
        </p>
      </div>
    </div>`;
}

// ---------- Helpers ----------

function formatAnswerForDisplay(q, answer) {
  if (q.type === 'numeric') {
    return q.unit ? `${answer} ${q.unit}` : String(answer);
  }
  return String(answer);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
