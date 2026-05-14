// Each sentence: first word, exactly 2 middle words, last word.
// Middle words must be unique WITHIN a round (otherwise placement is ambiguous).
// Order in the array = the correct sentence reading.

export const ROUNDS = [
  {
    name: 'Round 1 · The Basics',
    seconds: 90,
    sentences: [
      { first: 'Data',     middles: ['paints', 'a'],            last: 'picture'   },
      { first: 'Charts',   middles: ['reveal', 'hidden'],       last: 'patterns'  },
      { first: 'Graphs',   middles: ['simplify', 'complex'],    last: 'ideas'     },
      { first: 'Insights', middles: ['drive', 'smart'],         last: 'decisions' },
      { first: 'Trends',   middles: ['shape', 'future'],        last: 'strategy'  },
    ],
  },
  {
    name: 'Round 2 · Chart Types',
    seconds: 90,
    sentences: [
      { first: 'Bar',     middles: ['charts', 'compare'],     last: 'values'      },
      { first: 'Line',    middles: ['graphs', 'track'],       last: 'change'      },
      { first: 'Pie',     middles: ['slices', 'show'],        last: 'share'       },
      { first: 'Maps',    middles: ['render', 'spatial'],     last: 'stories'     },
      { first: 'Color',   middles: ['highlights', 'key'],     last: 'differences' },
    ],
  },
  {
    name: 'Round 3 · The Toolkit',
    seconds: 90,
    sentences: [
      { first: 'Filters',    middles: ['reduce', 'visual'],     last: 'noise'     },
      { first: 'Outliers',   middles: ['demand', 'careful'],    last: 'attention' },
      { first: 'Dashboards', middles: ['summarize', 'daily'],   last: 'metrics'   },
      { first: 'Datasets',   middles: ['hide', 'deep'],         last: 'secrets'   },
      { first: 'Tooltips',   middles: ['explain', 'every'],     last: 'datum'     },
    ],
  },
];
