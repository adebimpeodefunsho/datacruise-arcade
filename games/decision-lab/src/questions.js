// Question bank for Decision Lab.
//
// Structured as 5 rounds × 5 questions = 25. Phase 1 ships with 1
// example per round so we can verify the full flow; Phase 2 fills
// the remaining 20.
//
// Each round represents a stage of data work:
//   1. Read the Chart      — extract specific values
//   2. Compare & Rank      — relative comparisons
//   3. Spot Trends         — patterns / direction over time
//   4. Make Decisions      — recommend an action given the data
//   5. Insight & Forecast  — what happens next, what's the takeaway
//
// Pass thresholds rise per round (50% → 80%) so the difficulty
// curve matches the task difficulty.
//
// Question types:
//   'numeric'         — accepts numbers (with tolerance)
//   'multiple_choice' — pick one from options
//   'free_text'       — short text answer, case/space tolerant
//
// Datasets are realistic-but-synthesised, sourced from ONS / World
// Bank / industry reports. CSVs of every dataset can be downloaded
// from the end screen so players can re-explore the data.

export const TIMER_SECONDS = 30;

export const ROUNDS = [
  // ─────────────────────────────────────────────────────────────
  {
    number: 1,
    name: "Read the Chart",
    description: "Look at the chart and tell us what you see. No tricks — just read the values.",
    passThreshold: 0.5, // 50%
    questions: [
      {
        id: 'r1q1',
        type: 'numeric',
        chart: {
          type: 'bar',
          title: 'UK monthly streaming-service subscribers (2024, millions)',
          ylabel: 'Subscribers (m)',
          data: [
            { label: 'Netflix',   value: 17.3 },
            { label: 'Amazon',    value: 14.8 },
            { label: 'Disney+',   value: 8.4  },
            { label: 'NOW',       value: 4.1  },
            { label: 'Apple TV+', value: 3.2  },
          ],
        },
        prompt: 'How many millions of subscribers does Disney+ have in the UK?',
        correctAnswer: 8.4,
        tolerance: 0.2,
        unit: 'million',
        explanation: 'Disney+ shows ~8.4 million UK subscribers — third largest behind Netflix (17.3m) and Amazon Prime Video (14.8m).',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    number: 2,
    name: "Compare & Rank",
    description: "Which is biggest, smallest, fastest growing? Read the chart and rank.",
    passThreshold: 0.55, // 55%
    questions: [
      {
        id: 'r2q1',
        type: 'multiple_choice',
        chart: {
          type: 'pie',
          title: 'UK households by type of heating (2023)',
          data: [
            { label: 'Gas central heating', value: 78 },
            { label: 'Electric',            value: 11 },
            { label: 'Heat pump',           value: 5  },
            { label: 'Oil',                 value: 4  },
            { label: 'Other',               value: 2  },
          ],
        },
        prompt: 'Which heating type is the LEAST common in UK households in 2023?',
        options: ['Gas central heating', 'Electric', 'Heat pump', 'Other'],
        correctAnswer: 'Other',
        explanation: '"Other" covers only 2% of households — the smallest slice. Gas dominates at 78%.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    number: 3,
    name: "Spot Trends",
    description: "What's happening over time? Look for patterns, growth, decline, anomalies.",
    passThreshold: 0.65, // 65%
    questions: [
      {
        id: 'r3q1',
        type: 'multiple_choice',
        chart: {
          type: 'line',
          title: 'UK average house price (£000s), 2014–2024',
          ylabel: 'Price (£000s)',
          xlabels: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
          series: [
            { label: 'England', values: [195, 210, 232, 244, 255, 263, 274, 313, 327, 309, 305] },
            { label: 'Scotland', values: [150, 156, 159, 165, 175, 182, 192, 217, 226, 218, 215] },
          ],
        },
        prompt: 'Which statement best describes the trend?',
        options: [
          'Steady linear growth every year, no dips',
          'Sharp jump 2020→2021, then a small correction in 2023',
          'Steady decline since 2014',
          'Flat — house prices have not moved meaningfully',
        ],
        correctAnswer: 'Sharp jump 2020→2021, then a small correction in 2023',
        explanation: 'Both countries show a pandemic-era spike (people moving / low rates) between 2020 and 2021, then prices ease back from 2022 as rates rose.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    number: 4,
    name: "Make Decisions",
    description: "You're the analyst. Given the data, what would you recommend?",
    passThreshold: 0.75, // 75%
    questions: [
      {
        id: 'r4q1',
        type: 'multiple_choice',
        chart: {
          type: 'bar',
          title: 'Marketing channel — customer acquisition cost (CAC, £)',
          ylabel: 'CAC (£)',
          data: [
            { label: 'TikTok',    value: 18 },
            { label: 'Instagram', value: 24 },
            { label: 'Google',    value: 42 },
            { label: 'Facebook',  value: 55 },
            { label: 'Billboard', value: 120 },
          ],
        },
        prompt: 'Your monthly marketing budget is fixed and you want the most NEW customers per pound. Where should you invest first?',
        options: ['Billboard', 'Google', 'Instagram', 'TikTok'],
        correctAnswer: 'TikTok',
        explanation: 'TikTok costs only £18 to acquire one customer — every pound buys ~6.7x more customers than billboards (£120). Lowest CAC = most customers per budget pound.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    number: 5,
    name: "Insight & Forecast",
    description: "What's the bigger story? Predict the next move, draw the lesson.",
    passThreshold: 0.8, // 80%
    questions: [
      {
        id: 'r5q1',
        type: 'multiple_choice',
        chart: {
          type: 'line',
          title: 'UK electric-vehicle (EV) sales as % of new cars, 2019–2024',
          ylabel: '% of new cars',
          xlabels: ['2019', '2020', '2021', '2022', '2023', '2024'],
          series: [
            { label: 'Battery EV', values: [1.6, 6.6, 11.6, 16.6, 16.5, 19.6] },
            { label: 'Hybrid',     values: [5.5, 9.0, 11.5, 11.6, 12.5, 13.2] },
          ],
        },
        prompt: 'A car dealership is planning its 2026 stock. Based on the trend, the most defensible recommendation is:',
        options: [
          'Stop ordering battery EVs — the trend is plateauing',
          'Hold steady on petrol/diesel — EVs are still niche',
          'Increase battery EV inventory — share has roughly 12×ed in 5 years',
          'Switch entirely to hybrids — they grow faster than BEVs',
        ],
        correctAnswer: 'Increase battery EV inventory — share has roughly 12×ed in 5 years',
        explanation: 'BEV share went from 1.6% (2019) to 19.6% (2024) — over a 12× rise. Hybrids grew too but much more slowly (~2.4×). The defensible call is to lean into BEVs.',
      },
    ],
  },
];

// ---------- Answer checking ----------

/**
 * Compare a player's raw input to the correct answer for a question.
 * Returns { correct: boolean, normalisedInput: string }.
 *
 * - numeric: parse as number, accept within ±tolerance
 * - multiple_choice: exact match against one of the options
 * - free_text: case-insensitive, whitespace-tolerant, trimmed
 */
export function checkAnswer(question, rawInput) {
  const raw = String(rawInput ?? '').trim();
  if (!raw) return { correct: false, normalisedInput: '' };

  if (question.type === 'numeric') {
    const cleaned = raw.replace(/[£$€,]/g, '').replace(/[a-z%]+$/i, '').trim();
    const num = Number.parseFloat(cleaned);
    if (Number.isNaN(num)) return { correct: false, normalisedInput: raw };
    const expected = Number(question.correctAnswer);
    const tolerance = question.tolerance ?? 0;
    return { correct: Math.abs(num - expected) <= tolerance, normalisedInput: String(num) };
  }

  if (question.type === 'multiple_choice') {
    return { correct: raw === String(question.correctAnswer), normalisedInput: raw };
  }

  if (question.type === 'free_text') {
    const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const candidates = [question.correctAnswer, ...(question.acceptedAnswers || [])].map(norm);
    return { correct: candidates.includes(norm(raw)), normalisedInput: norm(raw) };
  }

  return { correct: false, normalisedInput: raw };
}
