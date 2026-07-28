// Bootstrap. Single state, single render, click + keyboard handlers,
// a 1-second tick when in 'question' phase.

import {
  createGame, startGame, beginRound, tickTimer, submitAnswer,
  continueFromReveal, advanceFromRoundEnd, setTypedAnswer, didWin,
} from './state.js';
import { render } from './render.js';
import * as audio from './audio.js';

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
      // Unlock the AudioContext on the very first user gesture so all
      // subsequent sounds play reliably (browsers block audio until
      // they see a click).
      audio.unlock();
      state = startGame(state);
      paint();
      return;
    case 'begin-round':
      audio.unlock(); // belt-and-braces in case the user disables sound at title and re-enables
      state = beginRound(state);
      paint();
      return;
    case 'pick-mc':
      state = setTypedAnswer(state, target.getAttribute('data-value') || '');
      audio.playPick();
      paint();
      return;
    case 'submit-answer':
      handleSubmit();
      return;
    case 'continue-from-reveal':
      state = continueFromReveal(state);
      paint();
      return;
    case 'advance-round':
      state = advanceFromRoundEnd(state);
      if (state.phase === 'ended') {
        if (didWin(state)) audio.playGameWin();
        else audio.playGameLose();
        const _c = state.roundScores.reduce((a, r) => a + r.correct, 0);
        const _t = state.roundScores.reduce((a, r) => a + r.total, 0) || 1;
        const _pct = _c / _t;
        window.DataCruiseResult && DataCruiseResult.ready({
          slug: 'decision-lab', game: 'Decision Lab',
          headline: _c + '/' + _t,
          sub: didWin(state)
            ? 'cleared every round! 🧪'
            : state.roundScores.length + '/5 rounds reached',
          stars: _pct >= 0.9 ? 3 : _pct >= 0.7 ? 2 : _pct > 0 ? 1 : 0, starsMax: 3,
        });
      }
      paint();
      return;
    case 'restart':
      state = createGame();
      paint();
      return;
    case 'toggle-mute':
      audio.setMuted(!audio.isMuted());
      paint();
      return;
  }
}

function handleSubmit() {
  state = submitAnswer(state);
  if (state.phase === 'reveal') {
    if (state.lastResult?.correct) audio.playCorrect();
    else audio.playWrong();
  }
  paint();
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
    handleSubmit();
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
      const prevTimer = state.timer;
      state = tickTimer(state);
      if (state.phase !== 'question') {
        // submitAnswer fired from timeout — full repaint + reveal sound
        if (state.lastResult?.correct) audio.playCorrect();
        else audio.playWrong();
        paint();
      } else {
        // Tick sound for the last 5 seconds
        if (state.timer <= 5 && state.timer >= 1 && state.timer !== prevTimer) {
          audio.playTick();
        }
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
  const enteringRoundEnd = state.phase === 'round-end' && lastPhase !== 'round-end';
  app.innerHTML = render(state);
  lastPhase = state.phase;

  // Play round-end fanfare on transition
  if (enteringRoundEnd) {
    const last = state.roundScores[state.roundScores.length - 1];
    if (last?.passed) audio.playRoundWin();
    else audio.playRoundFail();
    // Animate the score-fill bar into its final width
    requestAnimationFrame(() => {
      const fill = app.querySelector('.end-score-fill');
      if (fill) {
        const target = fill.style.width;
        fill.style.width = '0%';
        requestAnimationFrame(() => { fill.style.width = target; });
      }
    });
  }

  if (state.phase === 'question') {
    ensureTimerRunning();
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
