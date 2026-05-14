// Crack the Data Crossword — DOM rendering.

import { GRID_SIZE, PUZZLES, clueGroups, wordCells } from './puzzle.js';
import { magniSvg } from './mascot.js';
import { CONFIG, getActiveWord } from './state.js';
import { isMuted } from './sound.js';

const root = document.getElementById('app');

export function renderSplash(state, handlers) {
  // On the splash we don't have an active puzzle yet, so use the average word count
  // for the tagline. The library count itself is also useful flavor.
  const avgWordCount = Math.round(PUZZLES.reduce((n, p) => n + p.words.length, 0) / PUZZLES.length);
  root.innerHTML = `
    <div class="term">
      ${termBar('~/datacruise/word-games/crack-the-crossword $ <span class="cmd">play</span>', /*hideMute*/ true)}
      <div class="term-body">
        <div class="brand">
          <div class="brand-title">DATACRUISE <span class="pipe">/</span> WORD GAMES</div>
          <div class="brand-meta">CASE #002</div>
        </div>
        <div class="splash">
          <div class="mascot">${magniSvg()}</div>
          <h1>Crack the Data <span class="punc">::</span> Crossword<span class="cursor">_</span></h1>
          <p class="tagline">
            Magni's clipped a fresh grid of <span class="hl">data terms</span>.
            Find about <span class="hl">${avgWordCount} words</span> before the clock runs out.
            A new puzzle each game.
          </p>
          <div class="how-to">
            <div class="head">// HOW TO PLAY</div>
            <ul>
              <li><span>Tap a clue or a cell to pick a word.</span></li>
              <li><span>Type letters — they fill the active word.</span></li>
              <li><span class="key">Tab</span><span>jumps to the next clue.</span></li>
              <li><span class="key">↑ ↓ ← →</span><span>moves between cells.</span></li>
              <li><span>Find <span class="hl">every word</span> before the timer hits zero.</span></li>
            </ul>
          </div>
          <div class="start-buttons">
            <button class="btn" id="btn-start">▶ START</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('btn-start').addEventListener('click', () => handlers.onStart());
}

export function renderPlay(state, handlers) {
  const total = state.puzzle.words.length;
  root.innerHTML = `
    <div class="term">
      ${termBar('~/datacruise/word-games/crack-the-crossword $ <span class="cmd">play</span>')}
      <div class="term-body">
        <div class="brand">
          <div class="brand-title">DATACRUISE <span class="pipe">/</span> WORD GAMES</div>
          <div class="brand-meta">PUZZLE :: ${escape(state.puzzle.name).toUpperCase()}</div>
        </div>

        <div class="hud">
          <div class="hud-cell score"><div class="lbl">Score</div><div class="val" id="hud-score">${state.score}</div></div>
          <div class="hud-cell found"><div class="lbl">Found</div><div class="val" id="hud-found">${state.foundKeys.size}/${total}</div></div>
          <div class="hud-cell timer"><div class="lbl">Time</div><div class="val" id="hud-time">${formatTime(state.timeLeftMs)}</div></div>
          <div class="hud-cell"><div class="lbl">Theme</div><div class="val val small">${escape(state.puzzle.theme)}</div></div>
        </div>
        <div class="timer-row"><div class="timer-bar"><div class="timer-bar-fill" id="timer-fill" style="width:100%"></div></div></div>

        <div class="board">
          <div class="grid-wrap">${renderGrid(state)}</div>
          <div class="clues">
            ${renderClueColumn(state, 'Across', 'A')}
            ${renderClueColumn(state, 'Down', 'D')}
          </div>
        </div>

        <div class="actions-row">
          <button class="btn ghost tiny" id="btn-home">⌂ HOME</button>
          <button class="btn mag tiny" id="btn-quit">⏻ QUIT</button>
        </div>
      </div>
    </div>
  `;

  attachPlayHandlers(state, handlers);
  updateTimerBar(state.timeLeftMs, CONFIG.totalSeconds * 1000);
}

function renderGrid(state) {
  const active = getActiveWord(state);
  const activeCells = active ? wordCells(active) : [];
  const activeCellAt = (r, c) => activeCells.some((p) => p.row === r && p.col === c);
  const isCursor = (r, c) => active && activeCells[state.activeIdx] && activeCells[state.activeIdx].row === r && activeCells[state.activeIdx].col === c;

  let html = `<div class="grid" role="grid" aria-label="Crossword grid">`;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = state.cells[r][c];
      if (!cell.filled) {
        html += `<div class="cell block" aria-hidden="true"></div>`;
      } else {
        const classes = ['cell'];
        if (cell.found) classes.push('found');
        if (activeCellAt(r, c)) classes.push('active-word');
        if (isCursor(r, c)) classes.push('cursor');
        html += `<div class="${classes.join(' ')}" data-r="${r}" data-c="${c}" role="gridcell">`;
        if (cell.num != null) html += `<span class="num">${cell.num}</span>`;
        html += `<span class="letter">${cell.input || ''}</span>`;
        html += `</div>`;
      }
    }
  }
  html += `</div>`;
  return html;
}

function renderClueColumn(state, label, dir) {
  const { across, down } = clueGroups(state.puzzle);
  const list = dir === 'A' ? across : down;
  let html = `<div class="clue-col"><div class="clue-head">${label}</div><ul>`;
  for (const w of list) {
    const key = `${w.num}${w.dir}`;
    const cls = ['clue-item'];
    if (state.activeKey === key) cls.push('active');
    if (state.foundKeys.has(key)) cls.push('found');
    html += `<li class="${cls.join(' ')}" data-key="${key}"><span class="cnum">${w.num}</span><span class="ctext">${escape(w.clue)}</span><span class="clen">(${w.answer.length})</span></li>`;
  }
  html += `</ul></div>`;
  return html;
}

export function renderGameOver(state, handlers) {
  const win = state.result === 'win';
  const words = state.puzzle ? state.puzzle.words : [];
  const total = words.length;
  const foundList = words.filter((w) => state.foundKeys.has(`${w.num}${w.dir}`));
  const missList = words.filter((w) => !state.foundKeys.has(`${w.num}${w.dir}`));
  root.innerHTML = `
    <div class="term">
      ${termBar('~/datacruise/word-games/crack-the-crossword $ <span class="cmd">result</span>')}
      <div class="term-body over">
        <div class="brand">
          <div class="brand-title">DATACRUISE <span class="pipe">/</span> WORD GAMES</div>
          <div class="brand-meta">PUZZLE :: ${escape(state.puzzle?.name || '').toUpperCase()}</div>
        </div>
        <h2 class="${win ? 'correct' : 'wrong'}">${win ? '✓ ALL WORDS FOUND' : '⏱ TIME OUT'}</h2>
        <div class="subtitle">${win ? 'You decoded the whole grid.' : `You filled ${state.foundKeys.size} of ${total} words.`}</div>

        <div class="final-stats">
          <div class="stat"><div class="num">${state.score}</div><div class="lbl">Score</div></div>
          <div class="stat cyan"><div class="num">${state.foundKeys.size}/${total}</div><div class="lbl">Words</div></div>
          <div class="stat yellow"><div class="num">${formatTime(state.timeLeftMs)}</div><div class="lbl">Time left</div></div>
        </div>

        ${missList.length ? `
          <div class="answer-list">
            <div class="al-head">Words you missed</div>
            <ul>
              ${missList.map((w) => `<li><span class="al-num">${w.num}${w.dir}</span> <span class="al-word">${w.answer}</span> — <span class="al-clue">${escape(w.clue)}</span></li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${foundList.length && !win ? `
          <div class="answer-list found">
            <div class="al-head">Words you found</div>
            <ul>
              ${foundList.map((w) => `<li><span class="al-num">${w.num}${w.dir}</span> <span class="al-word">${w.answer}</span></li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="start-buttons">
          <button class="btn" id="btn-restart">▶ NEW PUZZLE</button>
          <button class="btn ghost" id="btn-home">⌂ HOME</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('btn-restart').addEventListener('click', () => handlers.onStart());
  document.getElementById('btn-home').addEventListener('click', () => handlers.onHome());
}

function attachPlayHandlers(state, handlers) {
  root.querySelectorAll('.clue-item').forEach((el) => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-key');
      if (state.foundKeys.has(key)) return;
      handlers.onSelectClue(key);
    });
  });
  root.querySelectorAll('.cell[data-r]').forEach((el) => {
    el.addEventListener('click', () => {
      const r = +el.getAttribute('data-r');
      const c = +el.getAttribute('data-c');
      handlers.onCellClick(r, c);
    });
  });
  document.getElementById('btn-home').addEventListener('click', () => handlers.onHome());
  document.getElementById('btn-quit').addEventListener('click', () => handlers.onQuit());
}

export function updateTimerBar(timeLeftMs, totalMs) {
  const fill = document.getElementById('timer-fill');
  if (!fill) return;
  const pct = Math.max(0, Math.min(100, (timeLeftMs / totalMs) * 100));
  fill.style.width = pct + '%';
  if (pct < 25) fill.classList.add('warn'); else fill.classList.remove('warn');
  const t = document.getElementById('hud-time');
  if (t) t.textContent = formatTime(timeLeftMs);
}

function termBar(pathInner, hideMute = false) {
  return `
    <div class="term-bar">
      <div class="dots"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
      <div class="path"><span class="prompt">magni@datacruise</span><span class="sep">:</span>${pathInner}</div>
      ${hideMute ? '' : `<button class="mute-btn" id="btn-mute" aria-label="Toggle sound">${isMuted() ? '🔇' : '🔊'}</button>`}
    </div>
  `;
}

function formatTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function escape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
