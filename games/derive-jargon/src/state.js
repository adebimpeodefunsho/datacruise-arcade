// Game state for Derive the Data Jargon.
// Two modes:
//   - 'classic'   : 10 rounds, 3 lives, score + streak (original game)
//   - 'daily'     : one curated puzzle, deterministic by date, one attempt

import { TERMS, shuffle, checkAnswer } from './jargon.js';
import { puzzleFor, readSavedAttempt, writeSavedAttempt, buildShareText, todayKey } from './daily.js';

export const CONFIG = {
  roundsPerGame: 10,
  startingLives: 3,
  roundSeconds: 25,
  dailySeconds: 60,
  basePoints: 100,
  speedBonusPerSecond: 6,
  streakBonus: 25,
  hintPenalty: 50,
  tickMs: 100,
  revealMsCorrect: 2200,
  revealMsWrong: 3200
};

export function createState() {
  return {
    screen: 'splash',
    mode: 'classic',            // 'classic' | 'daily'
    score: 0,
    streak: 0,
    bestStreak: 0,
    lives: CONFIG.startingLives,
    roundIndex: 0,
    deck: [],
    current: null,
    revealMeaning: false,
    lastResult: null,           // 'correct' | 'wrong' | 'timeout'
    lastPointsEarned: 0,
    correctCount: 0,
    hintsUsedTotal: 0,
    dailyMeta: null             // { number, dateKey, result, attempted, hintUsed, shareText }
  };
}

export function startGame(s) {
  s.mode = 'classic';
  s.score = 0;
  s.streak = 0;
  s.bestStreak = 0;
  s.lives = CONFIG.startingLives;
  s.roundIndex = 0;
  s.correctCount = 0;
  s.hintsUsedTotal = 0;
  s.lastResult = null;
  s.lastPointsEarned = 0;
  s.dailyMeta = null;
  s.deck = shuffle(TERMS).slice(0, CONFIG.roundsPerGame);
  s.screen = 'round';
  nextRound(s);
}

export function startDailyGame(s, now = new Date()) {
  const { puzzle, number, dateKey } = puzzleFor(now);
  const saved = readSavedAttempt(dateKey);
  s.mode = 'daily';
  s.score = 0;
  s.streak = 0;
  s.bestStreak = 0;
  s.lives = 1;
  s.roundIndex = 0;
  s.correctCount = 0;
  s.hintsUsedTotal = 0;
  s.lastResult = null;
  s.lastPointsEarned = 0;
  s.deck = [puzzle];
  s.dailyMeta = { number, dateKey, puzzle: puzzle.term };

  if (saved) {
    // Already played today — jump straight to the result screen.
    s.dailyMeta = {
      number: saved.number || number,
      dateKey,
      puzzle: puzzle.term,
      result: saved.result,
      attempted: saved.attempted || '',
      hintUsed: !!saved.hintUsed,
      shareText: saved.shareText || buildShareText({
        number, dateKey, result: saved.result,
        hintUsed: !!saved.hintUsed
      })
    };
    s.lastResult = saved.result;
    s.current = null;
    s.screen = 'gameover';
    return;
  }

  s.screen = 'round';
  nextRound(s);
}

export function nextRound(s) {
  if (s.mode === 'classic' && (s.lives <= 0 || s.roundIndex >= s.deck.length)) {
    s.screen = 'gameover';
    s.current = null;
    return;
  }
  if (s.mode === 'daily' && s.roundIndex >= s.deck.length) {
    s.screen = 'gameover';
    s.current = null;
    return;
  }
  const puzzle = s.deck[s.roundIndex];
  const seconds = s.mode === 'daily' ? CONFIG.dailySeconds : CONFIG.roundSeconds;
  s.current = {
    puzzle,
    timeLeftMs: seconds * 1000,
    locked: false,
    inputValue: '',
    hintUsed: false,
    submittedValue: ''
  };
  s.lastResult = null;
  s.lastPointsEarned = 0;
  s.revealMeaning = false;
}

export function useHint(s) {
  const c = s.current;
  if (!c || c.locked || c.hintUsed) return;
  c.hintUsed = true;
  s.hintsUsedTotal += 1;
}

export function submitAnswer(s, raw) {
  const c = s.current;
  if (!c || c.locked) return;
  const text = String(raw || '').trim();
  c.locked = true;
  c.submittedValue = text;
  const correct = !!text && checkAnswer(text, c.puzzle);
  if (correct) {
    const secondsLeft = Math.max(0, c.timeLeftMs / 1000);
    const speedBonus = Math.round(secondsLeft * CONFIG.speedBonusPerSecond);
    s.streak += 1;
    if (s.streak > s.bestStreak) s.bestStreak = s.streak;
    const streakBonus = (s.streak >= 2 ? (s.streak - 1) * CONFIG.streakBonus : 0);
    let earned = CONFIG.basePoints + speedBonus + streakBonus;
    if (c.hintUsed) earned = Math.max(0, earned - CONFIG.hintPenalty);
    s.score += earned;
    s.lastPointsEarned = earned;
    s.lastResult = 'correct';
    s.correctCount += 1;
  } else {
    s.streak = 0;
    s.lives -= 1;
    s.lastResult = 'wrong';
    s.lastPointsEarned = 0;
  }
  s.revealMeaning = true;

  if (s.mode === 'daily') persistDailyResult(s);
}

export function timeout(s) {
  const c = s.current;
  if (!c || c.locked) return;
  c.locked = true;
  c.submittedValue = c.inputValue || '';
  s.streak = 0;
  s.lives -= 1;
  s.lastResult = 'timeout';
  s.lastPointsEarned = 0;
  s.revealMeaning = true;

  if (s.mode === 'daily') persistDailyResult(s);
}

function persistDailyResult(s) {
  const meta = s.dailyMeta;
  const c = s.current;
  if (!meta || !c) return;
  const result = (s.lastResult === 'correct') ? 'correct' : 'wrong';
  const shareText = buildShareText({
    number: meta.number,
    dateKey: meta.dateKey,
    result,
    hintUsed: !!c.hintUsed
  });
  const record = {
    dateKey: meta.dateKey,
    number: meta.number,
    result,
    attempted: c.submittedValue || '',
    hintUsed: !!c.hintUsed,
    shareText,
    savedAt: Date.now()
  };
  writeSavedAttempt(record);
  s.dailyMeta = {
    ...meta,
    result,
    attempted: record.attempted,
    hintUsed: record.hintUsed,
    shareText
  };
}

export function advance(s) {
  s.roundIndex += 1;
  nextRound(s);
}

export function rankFor(score) {
  if (score >= 1500) return { name: 'CHIEF DATA WIZARD',    color: 'yellow' };
  if (score >= 1100) return { name: 'SENIOR ANALYST',        color: 'green'  };
  if (score >= 700)  return { name: 'DATA APPRENTICE',       color: 'cyan'   };
  if (score >= 400)  return { name: 'JUNIOR DECODER',        color: 'cyan'   };
  return { name: 'ROOKIE — keep cruising', color: 'green' };
}

export { todayKey };
