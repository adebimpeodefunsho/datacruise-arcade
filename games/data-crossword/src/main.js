// Crack the Data Crossword — entry point.

import {
  CONFIG, createState, startGame, selectWord, typeLetter,
  backspace, moveCursor, timeout, getActiveWord, cycleClue
} from './state.js';
import { wordCells } from './puzzle.js';
import { renderSplash, renderPlay, renderGameOver, updateTimerBar } from './render.js';
import { sfx, toggleMuted, isMuted } from './sound.js';

const state = createState();
let timerHandle = null;

function clearTimer() {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
}

function startTimer() {
  clearTimer();
  const tick = CONFIG.tickMs;
  const totalMs = CONFIG.totalSeconds * 1000;
  timerHandle = setInterval(() => {
    if (state.screen !== 'play') return;
    state.timeLeftMs -= tick;
    if (state.timeLeftMs <= 0) {
      state.timeLeftMs = 0;
      clearTimer();
      timeout(state);
      sfx.timeout();
      sfx.gameover();
      draw();
    } else {
      updateTimerBar(state.timeLeftMs, totalMs);
    }
  }, tick);
}

const handlers = {
  onStart: () => {
    startGame(state);
    draw();
    startTimer();
  },
  onSelectClue: (key) => {
    sfx.clueSelect();
    selectWord(state, key);
    draw();
  },
  onCellClick: (r, c) => {
    const cur = getActiveWord(state);
    const curCells = cur ? wordCells(cur) : [];
    const inCurrent = curCells.some((p) => p.row === r && p.col === c);
    // Find the across word and down word containing this cell.
    const containing = state.puzzle.words.filter((w) => wordCells(w).some((p) => p.row === r && p.col === c));
    if (containing.length === 0) return;

    let chosen;
    if (inCurrent && containing.length > 1) {
      // Toggle to the other direction.
      const other = containing.find((w) => `${w.num}${w.dir}` !== state.activeKey);
      chosen = other || containing[0];
    } else if (inCurrent) {
      // Same word — just move the cursor to the clicked cell.
      const list = wordCells(cur);
      state.activeIdx = list.findIndex((p) => p.row === r && p.col === c);
      sfx.clueSelect();
      draw();
      return;
    } else {
      // Prefer an unfound word; otherwise the first.
      chosen = containing.find((w) => !state.foundKeys.has(`${w.num}${w.dir}`)) || containing[0];
    }
    sfx.clueSelect();
    selectWord(state, `${chosen.num}${chosen.dir}`);
    // Snap cursor to the clicked cell within the chosen word.
    const list = wordCells(chosen);
    const idx = list.findIndex((p) => p.row === r && p.col === c);
    if (idx >= 0) state.activeIdx = idx;
    draw();
  },
  onHome: () => {
    clearTimer();
    state.screen = 'splash';
    draw();
  },
  onQuit: () => {
    clearTimer();
    state.result = 'timeout';
    state.screen = 'gameover';
    sfx.gameover();
    draw();
  },
  onToggleMute: () => {
    toggleMuted();
    const btn = document.getElementById('btn-mute');
    if (btn) btn.textContent = isMuted() ? '🔇' : '🔊';
  }
};

function draw() {
  if (state.screen === 'splash') renderSplash(state, handlers);
  else if (state.screen === 'play') renderPlay(state, handlers);
  else if (state.screen === 'gameover') renderGameOver(state, handlers);
  // Wire the mute button on every render (it lives in the term bar).
  const m = document.getElementById('btn-mute');
  if (m) m.addEventListener('click', handlers.onToggleMute);
}

window.addEventListener('keydown', (e) => {
  if (state.screen === 'splash') {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlers.onStart();
    }
    return;
  }
  if (state.screen === 'gameover') {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlers.onStart();
    }
    return;
  }
  // Play screen.
  if (e.key === 'Tab') {
    e.preventDefault();
    cycleClue(state, e.shiftKey ? -1 : 1);
    sfx.clueSelect();
    draw();
    return;
  }
  if (e.key === 'Backspace') {
    e.preventDefault();
    backspace(state);
    sfx.key();
    draw();
    return;
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    moveCursor(state, -1);
    draw();
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    moveCursor(state, 1);
    draw();
    return;
  }
  if (/^[a-zA-Z]$/.test(e.key)) {
    e.preventDefault();
    const res = typeLetter(state, e.key.toUpperCase());
    if (res.typed) {
      if (res.wordFound) sfx.wordFound();
      else if (res.wrong) sfx.wrong();
      else sfx.key();
      draw();
      if (res.allDone) sfx.win();
    }
  }
});

draw();
