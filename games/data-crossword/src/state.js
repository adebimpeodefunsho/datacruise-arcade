// Crack the Data Crossword — game state + transitions.
// Pure-ish functions that mutate a single state object.

import { buildGrid, isWordSolved, wordCells, pickPuzzle } from './puzzle.js';

export const CONFIG = {
  totalSeconds: 180,   // 3 minutes to find them all
  tickMs: 100,
  pointsPerLetter: 10,
  timeBonusPerSec: 2,
};

export function createState() {
  return {
    screen: 'splash',       // 'splash' | 'play' | 'gameover'
    puzzle: null,           // the active puzzle from the library
    cells: null,            // 2D array from buildGrid()
    foundKeys: new Set(),   // e.g. "1A", "3D"
    activeKey: null,        // currently selected word key
    activeIdx: 0,           // letter index within the active word the cursor sits on
    timeLeftMs: 0,
    score: 0,
    result: null,           // 'win' | 'timeout' | null
  };
}

export function startGame(s) {
  s.puzzle = pickPuzzle();
  s.cells = buildGrid(s.puzzle);
  s.foundKeys = new Set();
  const first = s.puzzle.words[0];
  s.activeKey = `${first.num}${first.dir}`;
  s.activeIdx = 0;
  s.timeLeftMs = CONFIG.totalSeconds * 1000;
  s.score = 0;
  s.result = null;
  s.screen = 'play';
}

export function getActiveWord(s) {
  if (!s.activeKey || !s.puzzle) return null;
  return s.puzzle.words.find((w) => `${w.num}${w.dir}` === s.activeKey) || null;
}

export function selectWord(s, key) {
  const w = s.puzzle.words.find((x) => `${x.num}${x.dir}` === key);
  if (!w) return;
  s.activeKey = key;
  const cellsList = wordCells(w);
  let idx = cellsList.findIndex(({ row, col }) => !s.cells[row][col].input);
  if (idx < 0) idx = 0;
  s.activeIdx = idx;
}

export function typeLetter(s, ch) {
  const w = getActiveWord(s);
  if (!w) return { typed: false, wrong: false, wordFound: null, allDone: false };
  if (!/^[A-Z]$/.test(ch)) return { typed: false, wrong: false, wordFound: null, allDone: false };

  const cellsList = wordCells(w);
  const pos = cellsList[s.activeIdx];
  if (!pos) return { typed: false, wrong: false, wordFound: null, allDone: false };

  const expected = w.answer[s.activeIdx];
  const wrong = (ch !== expected);
  s.cells[pos.row][pos.col].input = ch;

  let next = s.activeIdx + 1;
  while (next < cellsList.length && s.cells[cellsList[next].row][cellsList[next].col].input) {
    next++;
  }
  if (next >= cellsList.length) next = cellsList.length - 1;
  s.activeIdx = next;

  const newlyFound = [];
  for (const word of s.puzzle.words) {
    const key = `${word.num}${word.dir}`;
    if (s.foundKeys.has(key)) continue;
    if (isWordSolved(word, s.cells)) {
      s.foundKeys.add(key);
      newlyFound.push(key);
      for (const { row, col } of wordCells(word)) {
        s.cells[row][col].found = true;
      }
      s.score += word.answer.length * CONFIG.pointsPerLetter;
    }
  }

  const allDone = s.foundKeys.size === s.puzzle.words.length;
  if (allDone) {
    const secsLeft = Math.max(0, Math.ceil(s.timeLeftMs / 1000));
    s.score += secsLeft * CONFIG.timeBonusPerSec;
    s.result = 'win';
    s.screen = 'gameover';
  }

  return { typed: true, wrong, wordFound: newlyFound[0] || null, allDone };
}

export function backspace(s) {
  const w = getActiveWord(s);
  if (!w) return;
  const cellsList = wordCells(w);
  const cur = cellsList[s.activeIdx];
  const curCell = s.cells[cur.row][cur.col];
  if (curCell.found) return;
  if (curCell.input) {
    curCell.input = '';
  } else if (s.activeIdx > 0) {
    s.activeIdx -= 1;
    const prev = cellsList[s.activeIdx];
    if (!s.cells[prev.row][prev.col].found) {
      s.cells[prev.row][prev.col].input = '';
    }
  }
}

export function moveCursor(s, delta) {
  const w = getActiveWord(s);
  if (!w) return;
  const cellsList = wordCells(w);
  let next = s.activeIdx + delta;
  if (next < 0) next = 0;
  if (next >= cellsList.length) next = cellsList.length - 1;
  s.activeIdx = next;
}

export function timeout(s) {
  s.result = 'timeout';
  s.screen = 'gameover';
}

export function cycleClue(s, dir = 1) {
  const order = s.puzzle.words.map((w) => `${w.num}${w.dir}`);
  const i = order.indexOf(s.activeKey);
  let n = i + dir;
  if (n < 0) n = order.length - 1;
  if (n >= order.length) n = 0;
  let guard = order.length;
  while (s.foundKeys.has(order[n]) && guard-- > 0) {
    n += dir;
    if (n < 0) n = order.length - 1;
    if (n >= order.length) n = 0;
  }
  selectWord(s, order[n]);
}
