// Term bank for "Derive the Data Jargon"
// Each puzzle is a two-icon compound-word rebus, matching the
// format of the original Data Cruise gallery puzzles.
//
//   iconA  +  iconB  =  TERM
//
// Each icon is an ASCII-art glyph rendered in <pre> with a monospace font.
// Keep each glyph ~5–7 lines × 9–12 chars so it fits the mobile card.
//
// `answers` lists accepted spellings (canonical + aliases). Matching is
// lenient — see normalizeAnswer() / checkAnswer() below.

export const TERMS = [
  {
    term: 'Data Profiling',
    answers: ['Data Profiling', 'Profile Data', 'Data Profile', 'Profiling'],
    iconA: '  .────.\n ╱  1%  ╲\n │  ◔   │\n  ╲    ╱\n   ────',
    iconB: ' ┌──────┐\n │ ╭─╮   │\n │ │•│ ─ │\n │ ╰─╯ ─ │\n │     ─ │\n └──────┘',
    labelA: 'distribution',
    labelB: 'profile',
    clue: 'Getting an understanding of a dataset.',
    meaning: 'Examining a dataset to summarize its structure, content, and quality before analysis.'
  },
  {
    term: 'A/B Testing',
    answers: ['A/B Testing', 'AB Testing', 'A B Testing', 'A/B Test', 'AB Test', 'Split Testing'],
    iconA: '┌───┐┌───┐\n│ A ││ B │\n└───┘└───┘\n  ───────\n  vs.',
    iconB: '   ╱─╲\n   │ │\n  ╱   ╲\n ╱  ~  ╲\n ╲─────╱',
    labelA: 'variants',
    labelB: 'experiment',
    clue: 'Two-sample hypothesis testing to compare a control and variant.',
    meaning: 'Splitting users into two groups to compare which version performs better on a metric.'
  },
  {
    term: 'Big Data',
    answers: ['Big Data'],
    iconA: '██████\n██  ██\n██████\n██  ██\n██████',
    iconB: '╔═════╗\n║ 0101║\n╠═════╣\n║ 1010║\n╠═════╣\n║ 0110║\n╚═════╝',
    labelA: 'huge',
    labelB: 'binary store',
    clue: 'Datasets so large that traditional tools struggle to process them.',
    meaning: 'Extremely high-volume, high-velocity, or high-variety information assets.'
  },
  {
    term: 'Data Lake',
    answers: ['Data Lake'],
    iconA: ' 0 1 0 1\n 1 0 1 1\n 0 1 1 0\n 1 0 0 1\n binary',
    iconB: '  ~~~~~~\n ~ ≈≈≈≈ ~\n ≈      ≈\n  ~≈≈≈≈~\n   ~~~~',
    labelA: 'data',
    labelB: 'large body of water',
    clue: 'A central repository for raw data, structured or not.',
    meaning: 'A storage repository that holds vast raw data in its native format until needed.'
  },
  {
    term: 'Data Warehouse',
    answers: ['Data Warehouse'],
    iconA: '┌───┬───┐\n│010│101│\n├───┼───┤\n│101│010│\n└───┴───┘',
    iconB: ' ╱──────╲\n╱        ╲\n│ ┌┐ ┌┐  │\n│ └┘ └┘  │\n│________│',
    labelA: 'data',
    labelB: 'storage building',
    clue: 'A central, integrated store of curated data for analytics.',
    meaning: 'A system that aggregates data from multiple sources into a unified store for reporting and analysis.'
  },
  {
    term: 'Data Pipeline',
    answers: ['Data Pipeline', 'Pipeline'],
    iconA: ' 0101010\n 1010101\n 0110110\n  data→',
    iconB: ' ═══╗\n    ║\n    ╚══════\n         →',
    labelA: 'flow',
    labelB: 'pipe',
    clue: 'A series of steps that move and transform data from source to sink.',
    meaning: 'An automated chain of processes that ingests, transforms, and delivers data downstream.'
  },
  {
    term: 'Data Mining',
    answers: ['Data Mining', 'Mining Data'],
    iconA: ' 0 1 0 1\n 1 0 1 1\n 0 1 1 0\n   ░░░',
    iconB: '   ╱╲╲\n  ╱  ╲╲\n ╱    ╲╲\n‾‾‾‾‾‾‾╲╲\n  pickaxe',
    labelA: 'raw data',
    labelB: 'extract',
    clue: 'Discovering patterns and insights from large datasets.',
    meaning: 'The process of analyzing large datasets to uncover patterns, trends, and useful relationships.'
  },
  {
    term: 'Data Cleansing',
    answers: ['Data Cleansing', 'Data Cleaning', 'Cleansing Data', 'Cleaning Data'],
    iconA: ' ✗  ╳  ?\n ░  ?  ✗\n null ▒ ✗\n  messy',
    iconB: '   ╭───╮\n  │ ◯◯◯ │\n   ╰─┬─╯\n     │\n   ░░░░░',
    labelA: 'dirty data',
    labelB: 'soap & water',
    clue: 'Removing or correcting inaccurate, corrupt, or duplicate records.',
    meaning: 'Detecting and fixing or removing errors and inconsistencies from data to improve its quality.'
  },
  {
    term: 'Pivot Table',
    answers: ['Pivot Table'],
    iconA: '    ↻\n   ╱ ╲\n  ↓   ↑\n   ╲ ╱\n    ↺',
    iconB: ' ┌─┬─┬─┐\n ├─┼─┼─┤\n ├─┼─┼─┤\n ├─┼─┼─┤\n └─┴─┴─┘',
    labelA: 'rotate',
    labelB: 'grid',
    clue: 'A table that summarizes data by rotating fields into rows and columns.',
    meaning: 'A data summarization tool that lets you reorient rows and columns to view aggregates across dimensions.'
  },
  {
    term: 'Heat Map',
    answers: ['Heat Map', 'Heatmap'],
    iconA: '   ▲▲▲\n  ▲ ║ ▲\n    ║\n   ═╧═\n  100°F',
    iconB: ' ╔═════╗\n ║▓▒░▒▓║\n ║░▓▒▓░║\n ║▒░▓░▒║\n ╚═════╝',
    labelA: 'temperature',
    labelB: 'colored grid',
    clue: 'A 2-D plot where values are encoded as color intensity.',
    meaning: 'A visualization where individual values in a matrix are represented as colors, revealing patterns at a glance.'
  },
  {
    term: 'Time Series',
    answers: ['Time Series', 'Timeseries'],
    iconA: '   ╭──╮\n  │ 12 │\n  │ ╲│ │\n  │  ●─│\n   ╰──╯',
    iconB: '     ╱╲\n    ╱  ╲╱╲\n   ╱      ╲\n  ╱        ╲\n ╱──────────',
    labelA: 'clock',
    labelB: 'sequence',
    clue: 'A sequence of data points indexed in time order.',
    meaning: 'A series of observations collected at regular time intervals — used for trend, seasonality, and forecasting.'
  },
  {
    term: 'Bar Chart',
    answers: ['Bar Chart', 'Bar Graph'],
    iconA: ' ┌─────┐\n │ ╔═╗ │\n │ ║▓║ │\n │ ╚═╝ │\n └─────┘\n   bar',
    iconB: '  █\n  █ █\n  █ █ █\n  █ █ █ █\n  ────────',
    labelA: 'bar',
    labelB: 'plotted columns',
    clue: 'A chart that uses rectangular bars to compare values across categories.',
    meaning: 'A chart that represents categorical data with rectangular bars whose lengths are proportional to the values.'
  },
  {
    term: 'Scatter Plot',
    answers: ['Scatter Plot', 'Scatterplot', 'Scatter Graph'],
    iconA: '  •     •\n     •\n •       •\n     •  •\n •   •',
    iconB: '  ╔═══════╗\n  ║       ║\n  ║   ◾   ║\n  ║       ║\n  ╚═══════╝',
    labelA: 'scattered',
    labelB: 'plot of land',
    clue: 'A chart that uses Cartesian coordinates to show two variables for a set of data.',
    meaning: 'A chart that plots points on x/y axes to show the relationship between two numeric variables.'
  },
  {
    term: 'Decision Tree',
    answers: ['Decision Tree'],
    iconA: '   ┌───┐\n   │ ? │\n   └─┬─┘\n  ╱   ╲\n YES   NO',
    iconB: '    ▲▲▲\n   ▲▲▲▲▲\n  ▲▲▲▲▲▲▲\n     │\n     │',
    labelA: 'choice',
    labelB: 'branching tree',
    clue: 'A flowchart-like model where branches represent decisions and outcomes.',
    meaning: 'A model that uses a tree of yes/no questions to classify data or predict an outcome.'
  },
  {
    term: 'Neural Network',
    answers: ['Neural Network', 'Neural Net'],
    iconA: '   ╭───╮\n  ╱ ◕ ◕ ╲\n │ ── ── │\n  ╲ ─── ╱\n   brain',
    iconB: '  ●─●─●\n  │╳│╳│\n  ●─●─●\n  │╳│╳│\n  ●─●─●',
    labelA: 'brain',
    labelB: 'connected nodes',
    clue: 'A computing system inspired by biological neural connections.',
    meaning: 'A set of interconnected layers of nodes that learn to map inputs to outputs from examples.'
  },
  {
    term: 'Cold Start',
    answers: ['Cold Start'],
    iconA: '   *  *\n  * ❄ *\n   *  *\n  ──────\n  freezing',
    iconB: '     ▶\n    ▶▶\n   ▶▶▶\n    ▶▶\n     ▶',
    labelA: 'cold',
    labelB: 'play/begin',
    clue: "A system's first run with no prior data, history, or warm cache.",
    meaning: 'The problem of giving useful recommendations or responses when there is no historical data yet.'
  },
  {
    term: 'Drill Down',
    answers: ['Drill Down', 'Drilldown'],
    iconA: '    ╔╗\n    ║║\n   ╔╩╩╗\n   ║▼▼║\n   ╚══╝',
    iconB: '    │\n    │\n    ▼\n  ──────\n  deeper',
    labelA: 'drill',
    labelB: 'down arrow',
    clue: 'To navigate from summary data into greater levels of detail.',
    meaning: 'Moving from aggregated views into finer-grained, more detailed levels of the same dataset.'
  },
  {
    term: 'Master Data',
    answers: ['Master Data'],
    iconA: '   ╔═══╗\n  ╱  ◆  ╲\n ╱       ╲\n ╲───────╱\n  crown',
    iconB: '   ╔═════╗\n   ║ 010 ║\n   ╠═════╣\n   ║ 101 ║\n   ╚═════╝',
    labelA: 'master',
    labelB: 'data store',
    clue: 'Core business entities (customers, products, etc.) shared across systems.',
    meaning: 'The single authoritative version of critical business data used consistently across an organization.'
  },
  {
    term: 'Raw Data',
    answers: ['Raw Data'],
    iconA: '   ╭─╮\n  ╱ 🥚 ╲\n  │ ── │\n  ╲────╱\n  unbaked',
    iconB: '   ┌────┐\n   │ 010│\n   │ 110│\n   │ 001│\n   └────┘',
    labelA: 'raw',
    labelB: 'data',
    clue: 'Data in its original, unprocessed form.',
    meaning: 'Data that has not been cleaned, transformed, or aggregated — captured as it was first collected.'
  },
  {
    term: 'Cross Validation',
    answers: ['Cross Validation', 'Cross-Validation', 'K-Fold Cross Validation', 'K Fold Cross Validation'],
    iconA: '   ╲   ╱\n    ╲ ╱\n     ╳\n    ╱ ╲\n   ╱   ╲',
    iconB: '     ╱\n    ╱\n   ╱\n  ╱\n ✓ valid',
    labelA: 'cross',
    labelB: 'check / validate',
    clue: 'A model-evaluation technique that rotates training and test partitions.',
    meaning: 'A resampling technique that splits data into folds, training on some and testing on others, to estimate model skill.'
  },
  {
    term: 'Outlier',
    answers: ['Outlier'],
    iconA: ' • • • • •\n •••••••\n •••••••\n • • • •\n    cluster',
    iconB: '\n\n              *\n\n      far away',
    labelA: 'group',
    labelB: 'odd one out',
    clue: 'A data point that differs significantly from other observations.',
    meaning: 'An observation that lies an abnormal distance from other values in a sample — often worth investigating.'
  },
  {
    term: 'Confusion Matrix',
    answers: ['Confusion Matrix'],
    iconA: '   ╭───╮\n  │ @_@ │\n  │  ?  │\n   ╰───╯\n   huh?',
    iconB: '  ┌─┬─┐\n  │TP│FP│\n  ├─┼─┤\n  │FN│TN│\n  └─┴─┘',
    labelA: 'confused',
    labelB: 'grid',
    clue: 'A table showing predicted vs. actual classifications.',
    meaning: 'A table that summarizes a classifierʼs performance by comparing predicted labels to true labels.'
  },
  // ---------- Expansion bank (v1.2) ----------
  {
    term: 'Roll Up',
    answers: ['Roll Up', 'Rollup'],
    iconA: ' ╭─◉─╮\n │═══│\n │═══│\n │═══│\n ╰─◉─╯',
    iconB: '    ▲\n   ╱│╲\n  ╱ │ ╲\n    │\n    │',
    labelA: 'scroll',
    labelB: 'up arrow',
    clue: 'Aggregating detail data into higher-level summaries.',
    meaning: 'Moving from finer detail to a higher-level aggregate view — the opposite of drill-down.'
  },
  {
    term: 'Dark Data',
    answers: ['Dark Data'],
    iconA: '   ╭───╮\n  ╱     ╲\n │   ●   │\n  ╲     ╱\n   ╰───╯\n    moon',
    iconB: ' ╔═════╗\n ║ ░░░ ║\n ╠═════╣\n ║ ▒▒▒ ║\n ╚═════╝',
    labelA: 'dark / hidden',
    labelB: 'data store',
    clue: 'Collected information that is never analyzed or used.',
    meaning: 'Data an organization collects but does not analyze — often log, sensor, or archived data sitting unused.'
  },
  {
    term: 'Data Silo',
    answers: ['Data Silo'],
    iconA: ' 0101010\n 1010101\n 0110110\n 1011001\n  data',
    iconB: '  ┌───┐\n  │ ╲ │\n  ├───┤\n  │ S │\n  │   │\n  └───┘',
    labelA: 'data',
    labelB: 'isolated tower',
    clue: 'A data repository that is not shared with the rest of an organization.',
    meaning: 'An isolated collection of data controlled by one department and not easily accessible to the wider organization.'
  },
  {
    term: 'Data Mart',
    answers: ['Data Mart', 'Datamart'],
    iconA: ' 0101010\n 1010101\n 0110110\n  data',
    iconB: ' ╔═══════╗\n ║  MART ║\n ║▣ ▣ ▣ ▣║\n ╠═══════╣\n ╰─o───o─╯',
    labelA: 'data',
    labelB: 'small store',
    clue: 'A subject-oriented subset of a data warehouse.',
    meaning: 'A focused subset of a data warehouse targeted at a specific business line or team.'
  },
  {
    term: 'Data Lineage',
    answers: ['Data Lineage', 'Lineage'],
    iconA: ' 0101010\n 1010101\n 0110110\n  data',
    iconB: '     ●\n    ╱│╲\n   ● ● ●\n  ╱│ │ │╲\n  ● ● ● ●',
    labelA: 'data',
    labelB: 'ancestry tree',
    clue: 'The journey of data from source to destination.',
    meaning: 'A traceable record of where data comes from, how it moves through pipelines, and where it is used.'
  },
  {
    term: 'Data Steward',
    answers: ['Data Steward', 'Steward'],
    iconA: ' 0101010\n 1010101\n 0110110\n  data',
    iconB: '   ╭───╮\n  │ ◕ ◕ │\n   ╰─┬─╯\n   ╱ │ ╲\n  ─  │  ─\n     │',
    labelA: 'data',
    labelB: 'caretaker',
    clue: 'A person responsible for the quality and use of a data asset.',
    meaning: 'A role accountable for the accuracy, accessibility, and proper use of a defined set of data.'
  },
  {
    term: 'Data Catalog',
    answers: ['Data Catalog', 'Catalog', 'Data Catalogue'],
    iconA: ' 0101010\n 1010101\n 0110110\n  data',
    iconB: '  ┌──────┐\n ╱│ ━━━━ │\n╱ │ ━━━━ │\n╲ │ ━━━━ │\n └─┘──────┘',
    labelA: 'data',
    labelB: 'index book',
    clue: 'An organized inventory of an organization’s data assets.',
    meaning: 'A searchable inventory of datasets — what they are, where they live, who owns them, and how to use them.'
  },
  {
    term: 'Data Quality',
    answers: ['Data Quality'],
    iconA: ' 0101010\n 1010101\n 0110110\n  data',
    iconB: '   ╭───╮\n  ╱  ★  ╲\n │  ━━━  │\n  ╲     ╱\n   ═╧═\n   medal',
    labelA: 'data',
    labelB: 'gold standard',
    clue: 'A measure of the condition of data based on accuracy, completeness, and reliability.',
    meaning: 'The degree to which data is accurate, complete, consistent, timely, and fit for its intended use.'
  },
  {
    term: 'Data Governance',
    answers: ['Data Governance', 'Governance'],
    iconA: ' 0101010\n 1010101\n 0110110\n  data',
    iconB: '   ╱══╲\n  ╱    ╲\n ╱══════╲\n ────────\n   ║║║\n   ║║║\n   gavel',
    labelA: 'data',
    labelB: 'rule of law',
    clue: 'Policies and roles for managing data assets across an organization.',
    meaning: 'The framework of policies, roles, and processes that ensures data is managed properly across an organization.'
  },
  {
    term: 'Data Modeling',
    answers: ['Data Modeling', 'Data Modelling', 'Data Model'],
    iconA: ' 0101010\n 1010101\n 0110110\n  data',
    iconB: ' ┌╌╌╌╌╌╌┐\n │ ╱──╲ │\n │╱ E─R ╲│\n │  ──  │\n └╌╌╌╌╌╌┘',
    labelA: 'data',
    labelB: 'blueprint',
    clue: 'Designing the structure of data: entities, attributes, and relationships.',
    meaning: 'The process of designing how data is organized — typically as entities, attributes, and relationships.'
  },
  {
    term: 'Data Visualization',
    answers: ['Data Visualization', 'Data Visualisation', 'Data Viz', 'DataViz'],
    iconA: ' 0101010\n 1010101\n 0110110\n  data',
    iconB: '   ╭───╮\n  ╱     ╲\n │  ◉ ◉  │\n  ╲ ─── ╱\n   ╰───╯\n    eye',
    labelA: 'data',
    labelB: 'see / view',
    clue: 'Representing data graphically to reveal insights.',
    meaning: 'The use of charts, graphs, and visual encodings to make patterns and insights in data easier to perceive.'
  },
  {
    term: 'Schema Mapping',
    answers: ['Schema Mapping', 'Schema Mapper'],
    iconA: ' ┌─┐ ┌─┐\n │A│─│B│\n └┬┘ └┬┘\n  │   │\n  └─┬─┘\n   schema',
    iconB: ' ╭──────╮\n │ ▓░  ▒ │\n │   ▼   │\n │ ░  ▓  │\n ╰──────╯',
    labelA: 'schema',
    labelB: 'map',
    clue: 'Defining how fields in one data structure correspond to those in another.',
    meaning: 'The process of matching fields and types between two different schemas so data can be transferred or transformed.'
  },
  {
    term: 'Real Time',
    answers: ['Real Time', 'Realtime', 'Real-time'],
    iconA: '    ⚡\n   ╱\n  ⚡\n ╱\n⚡\n live',
    iconB: '   ╭──╮\n  │ 12 │\n  │ ╲│ │\n  │  ●─│\n   ╰──╯\n   clock',
    labelA: 'live / instant',
    labelB: 'clock',
    clue: 'Processing data immediately as it arrives.',
    meaning: 'Processing or analyzing data within milliseconds of it being generated — no batching or delay.'
  },
  {
    term: 'Batch Processing',
    answers: ['Batch Processing', 'Batch Process'],
    iconA: ' ┌─────┐\n ├─────┤\n ├─────┤\n ├─────┤\n └─────┘\n  stack',
    iconB: '   ⚙ ⚙\n  ╱   ╲\n ⚙     ⚙\n  ╲   ╱\n   ⚙ ⚙\n   gears',
    labelA: 'group of jobs',
    labelB: 'machinery',
    clue: 'Running data jobs in groups at scheduled intervals.',
    meaning: 'A method of processing data in large groups (batches) at scheduled times, instead of one record at a time.'
  },
  {
    term: 'Machine Learning',
    answers: ['Machine Learning', 'ML'],
    iconA: '   ┌─┬─┐\n   │◕│◕│\n   ├─┴─┤\n   │═══│\n    ║ ║\n   robot',
    iconB: '  ┌──────┐\n ╱│ ━━━━ │\n╱ │ ━━━━ │\n╲ │ ━━━━ │\n └─┘──────┘',
    labelA: 'machine',
    labelB: 'study / learn',
    clue: 'Algorithms that improve through experience with data.',
    meaning: 'Computer systems that learn patterns from data and improve at a task without being explicitly programmed for it.'
  },
  {
    term: 'Deep Learning',
    answers: ['Deep Learning', 'DL'],
    iconA: ' ≈≈≈≈≈\n  ↓\n   ↓\n    ↓\n     ↓\n  deep ▼',
    iconB: '  ┌──────┐\n ╱│ ━━━━ │\n╱ │ ━━━━ │\n╲ │ ━━━━ │\n └─┘──────┘',
    labelA: 'depth',
    labelB: 'study / learn',
    clue: 'Neural networks with many hidden layers.',
    meaning: 'A subset of machine learning that uses many-layered neural networks to learn complex patterns from large datasets.'
  },
  {
    term: 'Sentiment Analysis',
    answers: ['Sentiment Analysis'],
    iconA: '   ╭───╮\n  │ ◕ ◕ │\n  │  ‿  │\n   ╰───╯\n    ♥\n  emotion',
    iconB: '    ╱══╲\n   │ +- │\n    ╲══╱\n      ╲\n       ╲\n   inspect',
    labelA: 'feeling',
    labelB: 'inspect',
    clue: 'Detecting opinion or emotion in text.',
    meaning: 'Using NLP to classify the emotional tone of text — positive, negative, or neutral.'
  },
  {
    term: 'Standard Deviation',
    answers: ['Standard Deviation', 'Std Dev', 'StdDev', 'Sigma'],
    iconA: ' ┌────────┐\n │1·2·3·4·│\n │5·6·7·8·│\n └────────┘\n  ruler',
    iconB: '   ╱╲    ╱╲\n  ╱  ╲╱╲ ╱  ╲\n ╱       ╲    ╲\n away from norm',
    labelA: 'standard',
    labelB: 'departure',
    clue: 'A measure of how spread out values are from the mean.',
    meaning: 'A statistic that quantifies how much values in a dataset vary from their average.'
  },
  {
    term: 'Bell Curve',
    answers: ['Bell Curve', 'Normal Distribution', 'Gaussian'],
    iconA: '   ╭───╮\n  ╱     ╲\n │   ●   │\n  ╲_____╱\n    ▔\n   bell',
    iconB: '       ╱╲\n      ╱  ╲\n    ╱      ╲\n  ╱          ╲\n___            ___',
    labelA: 'bell',
    labelB: 'curve',
    clue: 'The classic symmetric distribution shape.',
    meaning: 'The graph of a normal distribution — symmetric, with most values clustered near the mean.'
  },
  {
    term: 'Feature Engineering',
    answers: ['Feature Engineering'],
    iconA: '  ┌┐┌─┐\n  ├┘└┤ │\n  │  └┐│\n  └───┘\n  puzzle',
    iconB: '   ⚙ ⚙\n  ╱   ╲\n ⚙     ⚙\n  ╲   ╱\n   ⚙ ⚙',
    labelA: 'piece',
    labelB: 'crafted gears',
    clue: 'Creating useful input variables for ML models.',
    meaning: 'The craft of transforming raw data into informative variables (features) that improve model performance.'
  },
  {
    term: 'Random Forest',
    answers: ['Random Forest'],
    iconA: ' ┌───┐\n │● ●│\n │ ● │\n │● ●│\n └───┘\n  dice',
    iconB: '   ▲ ▲ ▲\n  ▲▲▲▲▲\n ▲▲▲▲▲▲▲\n   │ │ │\n  forest',
    labelA: 'random',
    labelB: 'many trees',
    clue: 'An ensemble of decision trees, each trained on a random subset.',
    meaning: 'An ensemble ML model that aggregates many decision trees built on random samples and features.'
  },
  {
    term: 'Gradient Descent',
    answers: ['Gradient Descent'],
    iconA: ' ░▒▓█\n ░▒▓█\n ░▒▓█\n ░▒▓█\n gradient',
    iconB: ' ─┐\n   └─┐\n     └─┐\n       └─┐\n         └─▼',
    labelA: 'slope',
    labelB: 'step down',
    clue: 'An optimization method that follows the slope toward a minimum.',
    meaning: 'An iterative algorithm that tweaks parameters in the direction that most reduces a loss function.'
  },
  {
    term: 'Anomaly Detection',
    answers: ['Anomaly Detection'],
    iconA: '   ◉ ◉\n  ╭─⊥─╮\n  │ ?? │\n   ╲▽╱\n    !\n   weird',
    iconB: '    ╱══╲\n   │ Q  │\n    ╲══╱\n      ╲\n       ╲\n     detect',
    labelA: 'odd thing',
    labelB: 'inspect',
    clue: 'Identifying rare items that deviate from the norm.',
    meaning: 'The technique of identifying observations that depart significantly from expected patterns.'
  },
  {
    term: 'Star Schema',
    answers: ['Star Schema'],
    iconA: '    ★\n   ★★★\n  ★★★★★\n   ★★★\n    ★',
    iconB: '  ┌───┐\n  ├───┤\n  │ E │\n  │─R─│\n  └───┘\n  schema',
    labelA: 'star',
    labelB: 'blueprint',
    clue: 'A warehouse design with one fact table linked to dimension tables.',
    meaning: 'A simple warehouse model where a central fact table connects directly to surrounding dimension tables, like a star.'
  },
  {
    term: 'Snowflake Schema',
    answers: ['Snowflake Schema'],
    iconA: '    *\n  *─❅─*\n   *|*\n   *|*\n  snow',
    iconB: '  ┌───┐\n  ├───┤\n  │ E │\n  │─R─│\n  └───┘\n  schema',
    labelA: 'snowflake',
    labelB: 'blueprint',
    clue: 'A normalized warehouse design with dimensions broken into sub-tables.',
    meaning: 'A warehouse model that normalizes dimension tables into multiple related tables, branching out like a snowflake.'
  },
  {
    term: 'Primary Key',
    answers: ['Primary Key', 'PK'],
    iconA: '  ┌─────┐\n  │ #1  │\n  │ ★★★ │\n  │ pri │\n  └─────┘',
    iconB: '   ╭─╮\n  │ ◯ │\n   ╲─╱\n    │\n   ╳╳╳\n   key',
    labelA: 'number one',
    labelB: 'key',
    clue: 'The column that uniquely identifies each row in a table.',
    meaning: 'A column (or set of columns) whose value uniquely identifies every row in a database table.'
  },
  {
    term: 'Foreign Key',
    answers: ['Foreign Key', 'FK'],
    iconA: '  ┌─────┐\n  │ ▤ ▤ │\n  │ PSP │\n  │ ✈ ✈ │\n  └─────┘\n passport',
    iconB: '   ╭─╮\n  │ ◯ │\n   ╲─╱\n    │\n   ╳╳╳\n   key',
    labelA: 'foreign / other',
    labelB: 'key',
    clue: 'A column that references the primary key of another table.',
    meaning: 'A column whose values must match the primary key of another table — the basis of relational joins.'
  },
  {
    term: 'Inner Join',
    answers: ['Inner Join'],
    iconA: '  ┌──┐┌──┐\n  │  ┼┤  │\n  └──┘└──┘\n  ╱╲ ╳ ╱╲\n  fit inside',
    iconB: '  ╭───╮╭───╮\n  │   ╳   │\n  ╰───╯╰───╯\n   linked\n   rings',
    labelA: 'inside',
    labelB: 'connect',
    clue: 'A SQL join that returns only rows with matches in both tables.',
    meaning: 'A relational operation returning only the rows where the join key exists in both tables being joined.'
  }
];

// Shuffle a small array (Fisher–Yates).
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Normalize an answer for comparison — strip everything but a–z and 0–9.
//   "A/B Testing!"  →  "abtesting"
//   "HEAT MAP"      →  "heatmap"
export function normalizeAnswer(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Returns true if `input` matches any acceptable spelling of `term`.
export function checkAnswer(input, term) {
  const norm = normalizeAnswer(input);
  if (!norm) return false;
  const accepted = (term.answers && term.answers.length ? term.answers : [term.term]);
  return accepted.some(a => normalizeAnswer(a) === norm);
}
