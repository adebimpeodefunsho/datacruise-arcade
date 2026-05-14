// Derive the Data Jargon — entry point.
// Typed-input flow + classic / daily modes + sound effects.

import {
  CONFIG, createState, startGame, startDailyGame,
  submitAnswer, useHint, timeout, advance
} from './state.js';
import {
  renderSplash, renderRound, renderGameOver, updateTimerBar
} from './render.js';
import { sfx, toggleMuted, isMuted } from './sound.js';

const state = createState();
let timerHandle = null;
let advanceHandle = null;

function clearTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

function clearAdvance() {
  if (advanceHandle) {
    clearTimeout(advanceHandle);
    advanceHandle = null;
  }
}

function totalSecondsForCurrent() {
  return state.mode === 'daily' ? CONFIG.dailySeconds : CONFIG.roundSeconds;
}

function startTimer() {
  clearTimer();
  const tick = CONFIG.tickMs;
  const total = totalSecondsForCurrent();
  timerHandle = setInterval(() => {
    if (!state.current || state.current.locked) return;
    state.current.timeLeftMs -= tick;
    if (state.current.timeLeftMs <= 0) {
      state.current.timeLeftMs = 0;
      clearTimer();
      timeout(state);
      sfx.timeout();
      draw();
      scheduleAutoAdvance();
    } else {
      updateTimerBar(state.current.timeLeftMs, total);
    }
  }, tick);
}

function scheduleAutoAdvance() {
  clearAdvance();
  // Daily mode: don't auto-advance — show result screen via explicit Next click.
  if (state.mode === 'daily') return;
  const ms = (state.lastResult === 'correct')
    ? CONFIG.revealMsCorrect
    : CONFIG.revealMsWrong;
  advanceHandle = setTimeout(() => {
    advanceHandle = null;
    if (state.screen === 'round') {
      advance(state);
      draw();
      if (state.screen === 'round') startTimer();
      else if (state.screen === 'gameover') {
        if (state.lives <= 0 || state.correctCount < state.deck.length / 2) sfx.gameover();
        else sfx.win();
      }
    }
  }, ms);
}

const handlers = {
  onStart: () => {
    clearAdvance();
    startGame(state);
    draw();
    startTimer();
  },
  onStartDaily: () => {
    clearAdvance();
    startDailyGame(state);
    draw();
    // If we jumped straight to result (already played today), no timer needed.
    if (state.screen === 'round') startTimer();
  },
  onSubmit: (text) => {
    if (!state.current || state.current.locked) return;
    clearTimer();
    sfx.submit();
    submitAnswer(state, text);
    if (state.lastResult === 'correct') sfx.correct();
    else sfx.wrong();
    draw();
    scheduleAutoAdvance();
  },
  onHint: () => {
    if (!state.current || state.current.locked || state.current.hintUsed) return;
    sfx.hint();
    useHint(state);
    draw();
  },
  onNext: () => {
    clearAdvance();
    advance(state);
    draw();
    if (state.screen === 'round') startTimer();
    else if (state.screen === 'gameover' && state.mode === 'classic') {
      if (state.lives <= 0 || state.correctCount < state.deck.length / 2) sfx.gameover();
      else sfx.win();
    }
  },
  onKeyTick: () => {
    sfx.key();
  },
  onQuit: () => {
    clearTimer();
    clearAdvance();
    state.screen = 'gameover';
    state.current = null;
    draw();
  },
  onHome: () => {
    clearTimer();
    clearAdvance();
    state.screen = 'splash';
    state.mode = 'classic';
    draw();
  },
  onToggleMute: () => {
    toggleMuted();
    // Update the mute icon without a full re-render by toggling text content.
    const btn = document.getElementById('btn-mute');
    if (btn) btn.textContent = isMuted() ? '🔇' : '🔊';
  }
};

function draw() {
  if (state.screen === 'splash') renderSplash(state, handlers);
  else if (state.screen === 'round') renderRound(state, handlers);
  else if (state.screen === 'gameover') renderGameOver(state, handlers);
}

// Keyboard:
//   - Splash / GameOver: Enter or Space → start (unless focus is in an input)
//   - Round (unlocked): Enter is handled by the form submit
//   - Round (locked):   Enter or Space → next round immediately
window.addEventListener('keydown', (e) => {
  if (state.screen === 'round' && state.current && state.current.locked) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlers.onNext();
    }
  } else if (state.screen === 'splash' && (e.key === 'Enter' || e.key === ' ')) {
    if (!isTextInputFocused()) {
      e.preventDefault();
      handlers.onStart();
    }
  } else if (state.screen === 'gameover' && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    handlers.onStart();
  }
});

function isTextInputFocused() {
  const el = document.activeElement;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
}

draw();
