// Scrub the Data Mess — word data
// Each "round" generates a heap mixing CLEAN data terms with MESSY items
// (misspellings, duplicates, junk symbols, off-topic words, bad formatting).

export const CLEAN_TERMS = [
  'mean', 'median', 'mode', 'average', 'variance', 'stddev',
  'histogram', 'scatter', 'boxplot', 'heatmap', 'pareto', 'sparkline',
  'dashboard', 'KPI', 'metric', 'dimension', 'measure', 'segment',
  'regression', 'cluster', 'forecast', 'outlier', 'correlation', 'baseline',
  'schema', 'table', 'column', 'row', 'index', 'primary key',
  'query', 'filter', 'pivot', 'join', 'group by', 'aggregate',
  'pipeline', 'ingest', 'normalize', 'cleanse', 'enrich', 'transform',
  'sample', 'cohort', 'funnel', 'session', 'event', 'conversion',
  'percentile', 'quartile', 'median', 'rolling avg', 'z-score', 'p-value'
];

// Misspellings keyed by their canonical clean term — these are MESSY.
const MISSPELLINGS = {
  'mean':         ['meen', 'maen'],
  'median':       ['meedian', 'medain', 'medien'],
  'mode':         ['moed'],
  'average':      ['averege', 'avrage', 'avarage'],
  'variance':     ['varience', 'varriance'],
  'stddev':       ['stdev', 'st dev'],
  'histogram':    ['histgoram', 'histograam', 'histagram'],
  'scatter':      ['scatterr', 'sccater', 'scater'],
  'boxplot':      ['boxplt', 'boxpot'],
  'heatmap':      ['heetmap', 'heatmep'],
  'dashboard':    ['dashbord', 'dashboarrd', 'dashbaord'],
  'metric':       ['mertic', 'mettric'],
  'dimension':    ['dimention', 'dimmension'],
  'regression':   ['regresion', 'regressionn', 'regretion'],
  'cluster':      ['cluser', 'clustar'],
  'forecast':     ['forcast', 'forecaste'],
  'outlier':      ['outliar', 'outlyer'],
  'correlation':  ['corelation', 'correlationn', 'corellation'],
  'schema':       ['shema', 'schemma'],
  'query':        ['querie', 'qury'],
  'pivot':        ['pivt', 'pivott'],
  'pipeline':     ['pipline', 'pippeline'],
  'cleanse':      ['clense', 'cleens'],
  'percentile':   ['precentile', 'percentil'],
  'quartile':     ['quartille', 'quartil'],
  'p-value':      ['pvalue', 'p value'],
  'z-score':      ['zscore', 'z score'],
  'baseline':     ['basline', 'baseliine'],
  'aggregate':    ['agregate', 'aggreggate'],
  'normalize':    ['normalise', 'normilize'],
  'conversion':   ['convertion', 'convertsion'],
};

// Pure junk — never valid.
const JUNK = [
  '###', '???', '<<<', '>>>', '***',
  'NaN', 'null', 'undefined', 'NULL', '404', '<error>',
  '%%%', '&&&', '!!!', '...', '@@@', '~~~',
  '0x00', 'tbd', 'TODO', 'fixme', 'lorem'
];

// Off-topic words that don't belong in a data-terms heap.
const OFF_TOPIC = [
  'banana', 'potato', 'lunch', 'weekend', 'unicorn', 'sneaker',
  'pancake', 'pirate', 'wizard', 'goblin', 'pickle', 'dragon',
  'mango', 'kazoo', 'tofu', 'sandal', 'pebble', 'noodle',
  'cactus', 'walrus', 'penguin', 'koala', 'biscuit'
];

// Bad formatting variants: derived from clean terms.
function badFormat(term) {
  const variants = [
    `${term}!!!`,
    `${term}  `,
    `  ${term}`,
    term.split('').map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join(''),
    term.toUpperCase() + '?',
    term + '_' + term,
    term.replaceAll(' ', '_') + '__',
  ];
  return variants[Math.floor(Math.random() * variants.length)];
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a heap of items for a round.
 *
 * @param {object} opts
 * @param {number} opts.total       Total number of items in the heap.
 * @param {number} opts.messyRatio  Fraction of items that are messy (0–1).
 * @returns {{items: Array<{id:string, text:string, messy:boolean, reason?:string}>, totalMessy:number}}
 */
export function buildHeap({ total, messyRatio }) {
  const messyTarget = Math.round(total * messyRatio);
  const cleanTarget = total - messyTarget;

  const items = [];
  let nextId = 0;
  const usedClean = new Set();

  // 1) Clean terms — unique within the heap.
  const cleanPool = shuffle(CLEAN_TERMS);
  for (let i = 0; i < cleanTarget && i < cleanPool.length; i++) {
    const term = cleanPool[i];
    usedClean.add(term);
    items.push({ id: `i${nextId++}`, text: term, messy: false });
  }

  // 2) Messy items — distribute across categories.
  // Roughly: 35% misspellings, 20% duplicates of clean terms, 20% junk,
  // 15% off-topic, 10% bad formatting.
  const distribution = [
    { kind: 'misspell', weight: 0.35 },
    { kind: 'dup',      weight: 0.20 },
    { kind: 'junk',     weight: 0.20 },
    { kind: 'offtopic', weight: 0.15 },
    { kind: 'badfmt',   weight: 0.10 },
  ];

  const usedMessy = new Set();

  function pushMessy(kind) {
    let text, reason;
    if (kind === 'misspell') {
      // Pick a term that has misspellings, prefer ones already in the heap (more "discoverable").
      const candidates = Object.keys(MISSPELLINGS);
      const term = pick(candidates);
      text = pick(MISSPELLINGS[term]);
      reason = `misspelled "${term}"`;
    } else if (kind === 'dup') {
      // Duplicate of a clean term that's already in the heap.
      const inHeap = [...usedClean];
      if (!inHeap.length) return pushMessy('junk');
      const term = pick(inHeap);
      text = term;
      reason = 'duplicate';
    } else if (kind === 'junk') {
      text = pick(JUNK);
      reason = 'junk';
    } else if (kind === 'offtopic') {
      text = pick(OFF_TOPIC);
      reason = 'not a data term';
    } else {
      const term = pick(CLEAN_TERMS);
      text = badFormat(term);
      reason = 'bad formatting';
    }
    // Avoid the exact same messy item appearing twice unless it's a duplicate-kind.
    if (kind !== 'dup' && usedMessy.has(text)) return false;
    usedMessy.add(text);
    items.push({ id: `i${nextId++}`, text, messy: true, reason });
    return true;
  }

  let placed = 0;
  let safety = messyTarget * 6;
  while (placed < messyTarget && safety-- > 0) {
    // Weighted random pick.
    const r = Math.random();
    let acc = 0, chosen = distribution[0].kind;
    for (const d of distribution) {
      acc += d.weight;
      if (r <= acc) { chosen = d.kind; break; }
    }
    if (pushMessy(chosen) !== false) placed++;
  }

  // Final shuffle so messy items aren't grouped at the end.
  const shuffled = shuffle(items);
  return { items: shuffled, totalMessy: shuffled.filter(i => i.messy).length };
}
