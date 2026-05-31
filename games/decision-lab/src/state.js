// State machine for Decision Lab.
// Pure functions only — no DOM, no side effects.
//
// Phases:
//   'title'         — intro / play button
//   'round-intro'   — between rounds, shows the upcoming round's name + threshold
//   'question'      — chart + question + answer input + ticking timer
//   'reveal'        — answer locked, showing right/wrong + correct + explanation
//   'round-end'     — round complete, shows pass/fail vs threshold
//   'ended'         — game over (either ran out of rounds, or failed a round)

import { ROUNDS, checkAnswer, TIMER_SECONDS } from './questions.js';

export const TOTAL_ROUNDS = ROUNDS.length;

/** Create a fresh game state. */
export function createGame() {
  return {
    phase: 'title',
    roundIndex: 0,         // 0-based index into ROUNDS
    questionIndex: 0,      // 0-based index into the current round's questions
    timer: TIMER_SECONDS,
    typedAnswer: '',
    lastResult: null,      // { correct, correctAnswer, explanation }
    roundScores: [],       // array of { round, correct, total, percent, passed } for completed rounds
    currentRoundCorrect: 0,
  };
}

/** Get the current round object (or null if past the last round). */
export function currentRound(state) {
  return ROUNDS[state.roundIndex] || null;
}

/** Get the current question object (or null). */
export function currentQuestion(state) {
  const round = currentRound(state);
  if (!round) return null;
  return round.questions[state.questionIndex] || null;
}

/** Move from title → round-intro for round 0. */
export function startGame(state) {
  return { ...state, phase: 'round-intro', roundIndex: 0 };
}

/** Move from round-intro → question 0 of current round. */
export function beginRound(state) {
  return {
    ...state,
    phase: 'question',
    questionIndex: 0,
    timer: TIMER_SECONDS,
    typedAnswer: '',
    lastResult: null,
    currentRoundCorrect: 0,
  };
}

/** User typed a character (we just store the full string, debounced upstream). */
export function setTypedAnswer(state, text) {
  if (state.phase !== 'question') return state;
  return { ...state, typedAnswer: text };
}

/** Decrement timer by one second. Returns same state if not on 'question' phase. */
export function tickTimer(state) {
  if (state.phase !== 'question') return state;
  const next = Math.max(0, state.timer - 1);
  if (next === 0) {
    // Timeout — auto-submit whatever's typed (or count as wrong if empty)
    return submitAnswer({ ...state, timer: 0 });
  }
  return { ...state, timer: next };
}

/** Submit the current answer — moves to 'reveal' phase. */
export function submitAnswer(state) {
  if (state.phase !== 'question') return state;
  const question = currentQuestion(state);
  if (!question) return state;
  const { correct } = checkAnswer(question, state.typedAnswer);
  return {
    ...state,
    phase: 'reveal',
    lastResult: {
      correct,
      submittedAnswer: state.typedAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    },
    currentRoundCorrect: state.currentRoundCorrect + (correct ? 1 : 0),
  };
}

/** Click Continue after reveal — moves to next question, end of round, or end of game. */
export function continueFromReveal(state) {
  if (state.phase !== 'reveal') return state;
  const round = currentRound(state);
  const isLastQuestionInRound = state.questionIndex >= round.questions.length - 1;
  if (!isLastQuestionInRound) {
    return {
      ...state,
      phase: 'question',
      questionIndex: state.questionIndex + 1,
      timer: TIMER_SECONDS,
      typedAnswer: '',
      lastResult: null,
    };
  }
  // End of round — calculate round result
  const total = round.questions.length;
  const correct = state.currentRoundCorrect;
  const percent = correct / total;
  const passed = percent >= round.passThreshold;
  const roundResult = { round: round.number, name: round.name, correct, total, percent, passed };
  return {
    ...state,
    phase: 'round-end',
    roundScores: state.roundScores.concat([roundResult]),
  };
}

/** Click Continue after round summary — advances to next round, or to 'ended'. */
export function advanceFromRoundEnd(state) {
  if (state.phase !== 'round-end') return state;
  const lastRound = state.roundScores[state.roundScores.length - 1];
  if (!lastRound.passed) {
    // Failed the round — game over
    return { ...state, phase: 'ended' };
  }
  const nextRoundIndex = state.roundIndex + 1;
  if (nextRoundIndex >= TOTAL_ROUNDS) {
    // Completed all rounds — winner!
    return { ...state, phase: 'ended' };
  }
  return {
    ...state,
    phase: 'round-intro',
    roundIndex: nextRoundIndex,
    questionIndex: 0,
    currentRoundCorrect: 0,
  };
}

/** Overall % across completed rounds. */
export function overallPercent(state) {
  if (state.roundScores.length === 0) return 0;
  const totalCorrect = state.roundScores.reduce((s, r) => s + r.correct, 0);
  const totalQuestions = state.roundScores.reduce((s, r) => s + r.total, 0);
  return totalCorrect / totalQuestions;
}

/** Did the player win (completed all rounds, each passing threshold)? */
export function didWin(state) {
  return (
    state.phase === 'ended' &&
    state.roundScores.length === TOTAL_ROUNDS &&
    state.roundScores.every(r => r.passed)
  );
}
