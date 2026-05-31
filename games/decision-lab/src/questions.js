// Question bank for Decision Lab.
//
// 5 rounds × 5 questions = 25 total. Each round represents a stage
// of data work:
//   1. Read the Chart      — extract specific values from a chart
//   2. Compare & Rank      — relative comparisons across categories
//   3. Spot Trends         — direction / pattern / anomaly over time
//   4. Make Decisions      — recommend an action given the data
//   5. Insight & Forecast  — what's next, what's the bigger story
//
// Pass thresholds rise per round (50% → 80%) so difficulty matches
// the task difficulty.
//
// Answer types:
//   'numeric'         — accepts numbers (with tolerance)
//   'multiple_choice' — pick one from options[]
//   'free_text'       — short text answer, case/whitespace tolerant,
//                        optional acceptedAnswers[] alternatives
//
// Datasets are realistic-but-synthesised, sourced from public
// reports (ONS, World Bank, industry data). Numbers picked to be
// plausible without claiming precise authority.

export const TIMER_SECONDS = 30;

export const ROUNDS = [
  // ─────────────────────────────────────────────────────────────
  // ROUND 1 — Read the Chart (50% to pass)
  // ─────────────────────────────────────────────────────────────
  {
    number: 1,
    name: "Read the Chart",
    description: "Look at the chart and tell us what you see. No tricks — just read the values.",
    passThreshold: 0.5,
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
        tolerance: 0.3,
        unit: 'million',
        explanation: 'Disney+ shows ~8.4 million UK subscribers — third behind Netflix (17.3m) and Amazon Prime Video (14.8m).',
      },
      {
        id: 'r1q2',
        type: 'multiple_choice',
        chart: {
          type: 'pie',
          title: 'UK mobile-phone OS market share (2024)',
          data: [
            { label: 'iOS (iPhone)', value: 52 },
            { label: 'Android',      value: 47 },
            { label: 'Other',        value: 1  },
          ],
        },
        prompt: 'Which operating system has the largest share of the UK mobile market?',
        options: ['Android', 'iOS (iPhone)', 'Other', 'They are equal'],
        correctAnswer: 'iOS (iPhone)',
        explanation: 'iOS leads at 52% — the UK is one of the few markets where iPhone outsells Android.',
      },
      {
        id: 'r1q3',
        type: 'numeric',
        chart: {
          type: 'line',
          title: 'UK consumer-price inflation (CPI), annual %',
          ylabel: 'CPI (%)',
          xlabels: ['2019', '2020', '2021', '2022', '2023', '2024'],
          series: [
            { label: 'CPI', values: [1.8, 0.9, 2.6, 9.1, 7.3, 3.2] },
          ],
        },
        prompt: 'What was the UK inflation rate (CPI %) in 2022?',
        correctAnswer: 9.1,
        tolerance: 0.5,
        unit: '%',
        explanation: 'CPI peaked at 9.1% in 2022 — energy + food prices following the Ukraine war and post-pandemic supply shocks.',
      },
      {
        id: 'r1q4',
        type: 'multiple_choice',
        chart: {
          type: 'bar',
          title: 'UK regional school-leaver university applicants (2024, thousands)',
          ylabel: 'Applicants (k)',
          data: [
            { label: 'London',     value: 142 },
            { label: 'South East', value: 98  },
            { label: 'North West', value: 86  },
            { label: 'Midlands',   value: 79  },
            { label: 'Scotland',   value: 54  },
            { label: 'Wales',      value: 22  },
          ],
        },
        prompt: 'Which region had the FEWEST university applicants in 2024?',
        options: ['Scotland', 'Wales', 'Midlands', 'London'],
        correctAnswer: 'Wales',
        explanation: 'Wales had ~22k applicants — the smallest bar in the chart. Scotland was next-smallest at ~54k.',
      },
      {
        id: 'r1q5',
        type: 'numeric',
        chart: {
          type: 'bar',
          title: 'Top 5 best-selling UK music albums (2023, thousands sold)',
          ylabel: 'Sales (k)',
          data: [
            { label: 'Taylor Swift',  value: 632 },
            { label: 'The Weeknd',    value: 412 },
            { label: 'Harry Styles',  value: 385 },
            { label: 'SZA',           value: 298 },
            { label: 'Olivia Rodrigo', value: 271 },
          ],
        },
        prompt: 'In thousands, how many copies did the #1 album (Taylor Swift) sell in 2023?',
        correctAnswer: 632,
        tolerance: 20,
        unit: 'thousand',
        explanation: 'Taylor Swift sold ~632k copies — the top album of 2023 by some distance.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ROUND 2 — Compare & Rank (55% to pass)
  // ─────────────────────────────────────────────────────────────
  {
    number: 2,
    name: "Compare & Rank",
    description: "Which is bigger, smaller, fastest growing? Compare the data and rank.",
    passThreshold: 0.55,
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
        prompt: 'Which heating type is the LEAST common in UK households?',
        options: ['Gas central heating', 'Electric', 'Heat pump', 'Other'],
        correctAnswer: 'Other',
        explanation: '"Other" covers only 2% of households — the smallest slice. Gas dominates at 78%.',
      },
      {
        id: 'r2q2',
        type: 'multiple_choice',
        chart: {
          type: 'bar',
          title: 'UK daily-newspaper print circulation (2024, average daily copies, thousands)',
          ylabel: 'Daily copies (k)',
          data: [
            { label: 'The Sun',       value: 580 },
            { label: 'Daily Mail',    value: 720 },
            { label: 'Metro (free)',  value: 950 },
            { label: 'Telegraph',     value: 270 },
            { label: 'Guardian',      value: 110 },
            { label: 'i (paper)',     value: 90  },
          ],
        },
        prompt: 'Which is the LARGEST paid (non-free) daily newspaper?',
        options: ['The Sun', 'Daily Mail', 'Metro (free)', 'Telegraph'],
        correctAnswer: 'Daily Mail',
        explanation: 'Metro tops the chart but it\'s a free paper. Among paid titles, Daily Mail leads at ~720k vs Sun at ~580k.',
      },
      {
        id: 'r2q3',
        type: 'numeric',
        chart: {
          type: 'line',
          title: 'England vs Scotland — average new-build house price (£000s)',
          ylabel: 'Price (£000s)',
          xlabels: ['2019', '2020', '2021', '2022', '2023', '2024'],
          series: [
            { label: 'England',  values: [263, 274, 313, 327, 309, 305] },
            { label: 'Scotland', values: [182, 192, 217, 226, 218, 215] },
          ],
        },
        prompt: 'In 2024, roughly how many thousand pounds MORE does an average English new-build cost than a Scottish one? (in £000s)',
        correctAnswer: 90,
        tolerance: 12,
        unit: '£000s',
        explanation: 'England 305k − Scotland 215k = ~90k difference. The premium has held remarkably steady at £85–100k across all 6 years.',
      },
      {
        id: 'r2q4',
        type: 'multiple_choice',
        chart: {
          type: 'bar',
          title: 'UK takeaway market — orders per week by cuisine (2024, millions)',
          ylabel: 'Orders/week (m)',
          data: [
            { label: 'Chinese',  value: 4.8 },
            { label: 'Indian',   value: 4.2 },
            { label: 'Pizza',    value: 6.7 },
            { label: 'Burger',   value: 5.9 },
            { label: 'Sushi',    value: 1.3 },
          ],
        },
        prompt: 'Pizza orders are roughly how many times bigger than sushi orders?',
        options: ['About 2× bigger', 'About 3× bigger', 'About 5× bigger', 'About 10× bigger'],
        correctAnswer: 'About 5× bigger',
        explanation: 'Pizza 6.7 ÷ Sushi 1.3 ≈ 5.15× — pizza is just over 5 times the sushi market.',
      },
      {
        id: 'r2q5',
        type: 'free_text',
        chart: {
          type: 'bar',
          title: 'Most-listened Spotify artists in the UK (2024, monthly listeners, millions)',
          ylabel: 'Listeners (m)',
          data: [
            { label: 'Drake',        value: 78 },
            { label: 'Taylor Swift', value: 92 },
            { label: 'The Weeknd',   value: 102 },
            { label: 'Ed Sheeran',   value: 89 },
            { label: 'Bad Bunny',    value: 68 },
          ],
        },
        prompt: 'Which artist has the most UK monthly Spotify listeners? (type the name)',
        correctAnswer: 'The Weeknd',
        acceptedAnswers: ['the weeknd', 'weeknd'],
        explanation: 'The Weeknd leads at ~102m monthly listeners, narrowly ahead of Taylor Swift (~92m).',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ROUND 3 — Spot Trends (65% to pass)
  // ─────────────────────────────────────────────────────────────
  {
    number: 3,
    name: "Spot Trends",
    description: "What's happening over time? Patterns, growth, decline, anomalies — name them.",
    passThreshold: 0.65,
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
            { label: 'England',  values: [195, 210, 232, 244, 255, 263, 274, 313, 327, 309, 305] },
            { label: 'Scotland', values: [150, 156, 159, 165, 175, 182, 192, 217, 226, 218, 215] },
          ],
        },
        prompt: 'Which statement best describes the trend?',
        options: [
          'Steady linear growth every year',
          'Sharp jump then a correction',
          'Steady decline',
          'Flat — no meaningful movement',
        ],
        correctAnswer: 'Sharp jump then a correction',
        explanation: 'Both countries show a pandemic-era spike between 2020 and 2021 (low rates, demand surge), then prices ease back from 2022 as interest rates rose.',
      },
      {
        id: 'r3q2',
        type: 'multiple_choice',
        chart: {
          type: 'line',
          title: 'UK monthly average temperature (°C), 2024',
          ylabel: '°C',
          xlabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          series: [
            { label: 'Mean temp', values: [4.5, 5.8, 7.2, 9.1, 12.4, 15.6, 17.8, 17.5, 14.8, 11.2, 7.5, 5.2] },
          ],
        },
        prompt: 'When does the UK temperature peak in 2024?',
        options: ['June',  'July', 'August', 'September'],
        correctAnswer: 'July',
        explanation: 'July hits 17.8°C — the year\'s peak, with August (17.5°C) a close second. UK summer typically peaks in late July.',
      },
      {
        id: 'r3q3',
        type: 'multiple_choice',
        chart: {
          type: 'line',
          title: 'UK pub closures — net change per year, 2014–2024',
          ylabel: 'Net change (pubs)',
          xlabels: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
          series: [
            { label: 'Net pubs', values: [-900, -1100, -800, -700, -500, -600, -2300, -1200, -1450, -930, -800] },
          ],
        },
        prompt: 'Which year stands out as an anomaly (clearly different from the rest)?',
        options: ['2014', '2018', '2020', '2024'],
        correctAnswer: '2020',
        explanation: '2020 lost ~2,300 pubs net — more than double the typical year. COVID lockdowns hit hospitality hardest that year. All other years sit in the 500–1,500 range.',
      },
      {
        id: 'r3q4',
        type: 'multiple_choice',
        chart: {
          type: 'line',
          title: 'Global share of new cars sold that are electric (BEV %), 2018–2024',
          ylabel: 'BEV share (%)',
          xlabels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
          series: [
            { label: 'China',  values: [2.7, 3.6, 5.4, 13.5, 22.0, 25.5, 28.0] },
            { label: 'Europe', values: [1.0, 1.9, 4.1, 9.2, 12.1, 14.6, 16.5] },
            { label: 'USA',    values: [1.2, 1.3, 1.7, 3.2, 5.8, 7.2, 8.0] },
          ],
        },
        prompt: 'Which region is most clearly ACCELERATING away from the others?',
        options: ['USA', 'Europe', 'China', 'All three are flat'],
        correctAnswer: 'China',
        explanation: 'China went from 2.7% in 2018 to 28% in 2024 — a roughly 10× increase, while Europe ~16× and USA ~7× from similar bases. China\'s absolute lead has widened sharply.',
      },
      {
        id: 'r3q5',
        type: 'multiple_choice',
        chart: {
          type: 'line',
          title: 'UK first-time-buyer average deposit as % of price, 2014–2024',
          ylabel: 'Deposit (%)',
          xlabels: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
          series: [
            { label: 'Deposit %', values: [16, 17, 18, 19, 20, 21, 24, 26, 25, 23, 22] },
          ],
        },
        prompt: 'What\'s the long-term direction over the 10 years?',
        options: [
          'Steady decline',
          'Steady rise',
          'No clear direction',
          'Cyclical (up then down)',
        ],
        correctAnswer: 'Steady rise',
        explanation: 'Deposits climbed from 16% (2014) to 22% (2024) — a steady ~6-percentage-point rise. Affordability got tighter even before the pandemic spike.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ROUND 4 — Make Decisions (75% to pass)
  // ─────────────────────────────────────────────────────────────
  {
    number: 4,
    name: "Make Decisions",
    description: "You're the analyst. Given the data, what would you recommend?",
    passThreshold: 0.75,
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
        prompt: 'Fixed marketing budget. You want the most NEW customers per £. Where should you invest first?',
        options: ['Billboard', 'Google', 'Instagram', 'TikTok'],
        correctAnswer: 'TikTok',
        explanation: 'TikTok costs only £18 per customer — every pound buys ~6.7× more customers than billboards (£120). Lowest CAC wins.',
      },
      {
        id: 'r4q2',
        type: 'multiple_choice',
        chart: {
          type: 'bar',
          title: 'Product line — monthly profit margin (%)',
          ylabel: 'Margin (%)',
          data: [
            { label: 'Coffee',       value: 68 },
            { label: 'Pastries',     value: 22 },
            { label: 'Sandwiches',   value: 31 },
            { label: 'Bottled drinks', value: 12 },
            { label: 'Branded mugs', value: 78 },
          ],
        },
        prompt: 'You need to discontinue ONE line to free up counter space. Which is the safest cut?',
        options: ['Coffee', 'Pastries', 'Bottled drinks', 'Branded mugs'],
        correctAnswer: 'Bottled drinks',
        explanation: 'Bottled drinks have the lowest margin (12%) — every other line earns more per £ of sale. Mugs (78%) are tiny in volume but extremely profitable.',
      },
      {
        id: 'r4q3',
        type: 'multiple_choice',
        chart: {
          type: 'line',
          title: 'Weekly active users (WAU) by feature — last 12 weeks',
          ylabel: 'WAU (thousands)',
          xlabels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
          series: [
            { label: 'Search',     values: [120, 122, 119, 124, 126, 128, 131, 134, 138, 142, 145, 149] },
            { label: 'Chat',       values: [80,  79,  77,  75,  72,  68,  64,  60,  55,  50,  44,  38] },
            { label: 'Recommendations', values: [60, 62, 65, 68, 73, 79, 86, 93, 102, 110, 118, 127] },
          ],
        },
        prompt: 'You can fund only TWO of these features going forward. Which one would you sunset?',
        options: ['Search', 'Chat', 'Recommendations'],
        correctAnswer: 'Chat',
        explanation: 'Chat is in clear decline (80k → 38k, more than halved). The other two are growing steadily. Cut the one that\'s losing users.',
      },
      {
        id: 'r4q4',
        type: 'multiple_choice',
        chart: {
          type: 'pie',
          title: 'Customer support tickets — breakdown by issue type (last 30 days)',
          data: [
            { label: 'Billing',          value: 38 },
            { label: 'Login problems',   value: 27 },
            { label: 'Feature requests', value: 18 },
            { label: 'Bug reports',      value: 12 },
            { label: 'Other',            value: 5  },
          ],
        },
        prompt: 'Engineering has time for ONE big project next quarter. What should they tackle to reduce ticket volume fastest?',
        options: ['Build a new feature', 'Rewrite the billing system', 'Fix small bugs', 'Improve internal tooling'],
        correctAnswer: 'Rewrite the billing system',
        explanation: 'Billing causes 38% of tickets — by far the largest slice. Fixing the biggest source kills more tickets than any other project. Always attack the largest cause first.',
      },
      {
        id: 'r4q5',
        type: 'multiple_choice',
        chart: {
          type: 'bar',
          title: 'Possible expansion markets — TAM and competitor density',
          ylabel: 'Market score (higher = better)',
          data: [
            { label: 'Germany — large, crowded', value: 64 },
            { label: 'Netherlands — small, open', value: 88 },
            { label: 'Poland — medium, growing', value: 79 },
            { label: 'France — large, crowded',   value: 62 },
            { label: 'Spain — medium, neutral',   value: 71 },
          ],
        },
        prompt: 'You want to launch in ONE European country first. Best choice based on this score?',
        options: ['Germany', 'Netherlands', 'France', 'Poland'],
        correctAnswer: 'Netherlands',
        explanation: 'Netherlands scores highest at 88 — smaller market but less crowded, easier to win. Launching where you can establish a foothold beats fighting in a saturated giant.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ROUND 5 — Insight & Forecast (80% to pass)
  // ─────────────────────────────────────────────────────────────
  {
    number: 5,
    name: "Insight & Forecast",
    description: "What's the bigger story? Predict the next move, draw the lesson.",
    passThreshold: 0.8,
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
        prompt: 'A car dealership is planning 2026 stock. Most defensible recommendation:',
        options: [
          'Stop ordering battery EVs',
          'Hold steady on petrol / diesel',
          'Increase battery EV inventory',
          'Switch entirely to hybrids',
        ],
        correctAnswer: 'Increase battery EV inventory',
        explanation: 'BEV share went from 1.6% to 19.6% in 5 years — a ~12× rise. Hybrids grew too but much more slowly (~2.4×). The defensible call is to lean into BEVs as the market is clearly moving that way.',
      },
      {
        id: 'r5q2',
        type: 'multiple_choice',
        chart: {
          type: 'line',
          title: 'Daily active users of three social platforms, 2019–2024 (millions)',
          ylabel: 'DAU (m)',
          xlabels: ['2019', '2020', '2021', '2022', '2023', '2024'],
          series: [
            { label: 'TikTok',    values: [200, 350, 600, 850, 1050, 1200] },
            { label: 'Instagram', values: [500, 580, 650, 720, 780, 820] },
            { label: 'X/Twitter', values: [330, 350, 360, 370, 245, 220] },
          ],
        },
        prompt: 'A brand has £100k advertising budget for 2026. Most defensible call:',
        options: [
          'Pour it all into X / Twitter',
          'Split equally across all three',
          'Lean into TikTok',
          'Spend it on Instagram',
        ],
        correctAnswer: 'Lean into TikTok',
        explanation: 'TikTok 6× in 5 years (200m → 1,200m) — explosive trajectory and now the largest base. Instagram is steady but slowing; X/Twitter is shrinking sharply. TikTok offers the biggest and most rapidly growing audience.',
      },
      {
        id: 'r5q3',
        type: 'multiple_choice',
        chart: {
          type: 'line',
          title: 'Global temperature anomaly vs 1951–1980 average (°C)',
          ylabel: 'Anomaly (°C)',
          xlabels: ['1980', '1990', '2000', '2010', '2020', '2024'],
          series: [
            { label: 'Anomaly', values: [0.20, 0.34, 0.42, 0.66, 1.01, 1.17] },
          ],
        },
        prompt: 'Most accurate insight from this trend:',
        options: [
          'Stable for decades, no real change',
          'Warming has accelerated since 2000',
          'Warmed then cooled',
          'No clear signal — random noise',
        ],
        correctAnswer: 'Warming has accelerated since 2000',
        explanation: '1980→2000 added ~0.22°C (over 20 years). 2000→2024 added ~0.75°C (over 24 years) — roughly 3× faster pace. The slope is steepening, not steady.',
      },
      {
        id: 'r5q4',
        type: 'multiple_choice',
        chart: {
          type: 'bar',
          title: 'Where new graduates apply for their first job (% of applicants, 2024)',
          ylabel: 'Share (%)',
          data: [
            { label: 'Big Tech',     value: 28 },
            { label: 'Finance',      value: 22 },
            { label: 'Consulting',   value: 17 },
            { label: 'Public sector', value: 12 },
            { label: 'Startups',     value: 14 },
            { label: 'NHS / health', value: 7  },
          ],
        },
        prompt: 'If you\'re hiring graduates for a startup, what\'s the strategic insight?',
        options: [
          'No competition for talent',
          'High competition — most grads aim elsewhere',
          'Easy win — startups are the most popular destination',
          'Graduates don\'t care about employer brand',
        ],
        correctAnswer: 'High competition — most grads aim elsewhere',
        explanation: '50% of graduates aim at Big Tech (28%) + Finance (22%). Startups get only 14%. To attract talent you\'re competing against those companies\' offers — pay, prestige, training programmes — even though you might be a "more interesting" workplace.',
      },
      {
        id: 'r5q5',
        type: 'multiple_choice',
        chart: {
          type: 'line',
          title: 'UK monthly subscription churn rate by company age (%)',
          ylabel: 'Monthly churn (%)',
          xlabels: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M9', 'M12', 'M18', 'M24'],
          series: [
            { label: 'New subs (joined this year)', values: [12, 9, 8, 7, 6, 6, 5, 4, 3, 3] },
            { label: 'Old subs (joined 5+ yrs ago)', values: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
          ],
        },
        prompt: 'What\'s the most important takeaway for product strategy?',
        options: [
          'Accept churn as a fixed cost',
          'Focus on the first few months',
          'Long-term subscribers are the problem',
          'No meaningful pattern',
        ],
        correctAnswer: 'Focus on the first few months',
        explanation: 'New subscribers churn at 6–12% in months 1–6 then stabilise to ~3% by month 24. Long-tenured subs are at 2% (much stickier). Onboarding improvements pay back fastest — once you keep them past month 6, they tend to stay.',
      },
    ],
  },
];

// ---------- Answer checking ----------

/**
 * Compare a player's raw input to the correct answer for a question.
 * Returns { correct: boolean, normalisedInput: string }.
 *
 * - numeric:         parse as number, accept within ±tolerance
 * - multiple_choice: exact match against one of the options
 * - free_text:       case-insensitive, whitespace-tolerant, trimmed,
 *                    accepts any of correctAnswer + acceptedAnswers[]
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
