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
    focusKbd();
  },
  onSelectClue: (key) => {
    sfx.clueSelect();
    selectWord(state, key);
    draw();
    focusKbd();
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
      focusKbd();
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
    focusKbd();
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

// --- Mobile keyboard proxy --------------------------------------------------
// Grid cells are <div>s, so tapping them can't open a phone keyboard, and
// Android/on-screen keyboards don't report letters via `keydown`. A hidden but
// focusable <input> fixes both: tapping a cell focuses it (which opens the
// on-screen keyboard) and its `input` events feed letters + backspace reliably
// on every platform. A sentinel character means backspace still fires `input`
// even though the field is logically empty.
const kbd = document.createElement('input');
kbd.type = 'text';
kbd.setAttribute('inputmode', 'text');
kbd.setAttribute('autocapitalize', 'characters');
kbd.setAttribute('autocomplete', 'off');
kbd.setAttribute('autocorrect', 'off');
kbd.setAttribute('spellcheck', 'false');
kbd.setAttribute('aria-hidden', 'true');
kbd.tabIndex = -1;
kbd.style.cssText =
  'position:fixed;bottom:0;left:0;width:1px;height:1px;opacity:0;border:0;padding:0;' +
  'margin:0;font-size:16px;background:transparent;color:transparent;caret-color:transparent;z-index:-1;';
const KBD_SENT = ' ';
document.body.appendChild(kbd);
kbd.value = KBD_SENT;

function focusKbd() {
  if (state.screen !== 'play') return;
  kbd.value = KBD_SENT;
  try { kbd.focus({ preventScroll: true }); } catch (_) { kbd.focus(); }
  try { kbd.setSelectionRange(KBD_SENT.length, KBD_SENT.length); } catch (_) {}
}

kbd.addEventListener('input', () => {
  if (state.screen !== 'play') { kbd.value = KBD_SENT; return; }
  const v = kbd.value;
  if (v.length > KBD_SENT.length) {
    const added = v.slice(KBD_SENT.length);
    for (let i = 0; i < added.length; i++) {
      const ch = added[i];
      if (!/[a-zA-Z]/.test(ch)) continue;
      const res = typeLetter(state, ch.toUpperCase());
      if (res.typed) {
        if (res.wordFound) sfx.wordFound();
        else if (res.wrong) sfx.wrong();
        else sfx.key();
        draw();
        if (res.allDone) sfx.win();
      }
    }
  } else {
    // sentinel was deleted -> a backspace
    backspace(state);
    sfx.key();
    draw();
  }
  kbd.value = KBD_SENT;
  try { kbd.setSelectionRange(KBD_SENT.length, KBD_SENT.length); } catch (_) {}
});

function draw() {
  if (state.screen === 'splash') renderSplash(state, handlers);
  else if (state.screen === 'play') renderPlay(state, handlers);
  else if (state.screen === 'gameover') renderGameOver(state, handlers);
  // Wire the mute button on every render (it lives in the term bar).
  const m = document.getElementById('btn-mute');
  if (m) m.addEventListener('click', handlers.onToggleMute);

  // Fire the shareable result once, the first draw after entering game-over.
  if (state.screen === 'gameover') {
    if (!draw._over) {
      draw._over = true;
      const words = (state.puzzle && state.puzzle.words.length) || 1;
      const found = state.foundKeys ? state.foundKeys.size : 0;
      const pct = found / words;
      window.DataCruiseResult && DataCruiseResult.ready({
        slug: 'data-crossword', game: 'Crack the Data Crossword',
        headline: state.score + ' pts',
        sub: found + '/' + words + ' words solved ✏️',
        stars: pct >= 1 ? 3 : pct >= 0.6 ? 2 : pct > 0 ? 1 : 0, starsMax: 3,
      });
    }
  } else {
    draw._over = false;
  }
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
    if (document.activeElement === kbd) return; // handled by the input proxy
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
    if (document.activeElement === kbd) return; // handled by the input proxy
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
