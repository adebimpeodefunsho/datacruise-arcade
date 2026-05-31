// Bootstrap. Single state, single render, click + keyboard handlers,
// a 1-second tick when in 'question' phase.

import {
  createGame, startGame, beginRound, tickTimer, submitAnswer,
  continueFromReveal, advanceFromRoundEnd, setTypedAnswer,
} from './state.js';
import { render } from './render.js';

const app = document.getElementById('app');

let state = createGame();
let timerInterval = null;
let lastPhase = null;

paint();
document.addEventListener('click', onClick);
document.addEventListener('input', onInput);
document.addEventListener('submit', onSubmit);
document.addEventListener('keydown', onKeydown);

// ---------- click router ----------

function onClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.getAttribute('data-action');
  if (target.hasAttribute('disabled')) return;

  switch (action) {
    case 'start':
      state = startGame(state);
      paint();
      return;
    case 'begin-round':
      state = beginRound(state);
      paint();
      return;
    case 'pick-mc':
      state = setTypedAnswer(state, target.getAttribute('data-value') || '');
      paint();
      return;
    case 'submit-answer':
      state = submitAnswer(state);
      paint();
      return;
    case 'continue-from-reveal':
      state = continueFromReveal(state);
      paint();
      return;
    case 'advance-round':
      state = advanceFromRoundEnd(state);
      paint();
      return;
    case 'restart':
      state = createGame();
      paint();
      return;
  }
}

// ---------- typed input (numeric / free text) ----------

function onInput(e) {
  if (e.target.matches('[data-answer-input]')) {
    // Update state without full re-paint to preserve focus + caret position
    state.typedAnswer = e.target.value;
    syncMinorState();
  }
}

function onSubmit(e) {
  if (e.target.matches('[data-answer-form]')) {
    e.preventDefault();
    state = submitAnswer(state);
    paint();
  }
}

function onKeydown(e) {
  // Enter advances Continue button on reveal
  if (e.key === 'Enter' && state.phase === 'reveal') {
    state = continueFromReveal(state);
    paint();
  }
  // Esc closes nothing currently (reserved for future)
}

// ---------- timer ----------

function ensureTimerRunning() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    if (state.phase === 'question') {
      state = tickTimer(state);
      // If submitAnswer fired from timeout, repaint full screen
      if (state.phase !== 'question') {
        paint();
      } else {
        syncTimerOnly();
      }
    } else {
      stopTimer();
    }
  }, 1000);
}

function stopTimer() {
  if (!timerInterval) return;
  clearInterval(timerInterval);
  timerInterval = null;
}

// ---------- render ----------

function paint() {
  app.innerHTML = render(state);
  lastPhase = state.phase;
  if (state.phase === 'question') {
    ensureTimerRunning();
    // Auto-focus input for typing-style questions
    const input = app.querySelector('[data-answer-input]');
    if (input) {
      setTimeout(() => { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }, 30);
    }
  } else {
    stopTimer();
  }
}

/** When the user types into the input, sync the small answer display
 *  without re-painting the whole screen (loses focus / caret). */
function syncMinorState() {
  const display = app.querySelector('.answer-text');
  if (display) {
    if (state.typedAnswer) {
      display.textContent = state.typedAnswer;
      display.classList.remove('placeholder');
    } else {
      display.textContent = 'awaiting input...';
      display.classList.add('placeholder');
    }
  }
  const submitBtn = app.querySelector('.pod-submit-btn');
  if (submitBtn) {
    if (state.typedAnswer) submitBtn.removeAttribute('disabled');
    else submitBtn.setAttribute('disabled', '');
  }
}

/** Sync just the timer display every second instead of re-painting. */
function syncTimerOnly() {
  const timer = app.querySelector('.header-timer strong');
  if (timer) timer.textContent = `${state.timer}s`;
  const timerWrap = app.querySelector('.header-timer');
  if (timerWrap) timerWrap.classList.toggle('urgent', state.timer <= 5);
}
