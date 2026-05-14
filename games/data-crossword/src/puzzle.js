// Crack the Data Crossword — puzzle library.
// Hand-crafted 10x10 crosswords using only data-jargon terms.
//
// CROSSWORD RULE: every contiguous run of >=2 filled cells in any row or any
// column MUST be exactly one defined across- or down-word. Otherwise the player
// sees a "phantom word" like BINL (BIN + ETL's leading L stacked vertically),
// which reads as a nonsense word.
//
// The validator at the bottom of this file enforces this on every puzzle at
// module load — any violation throws and shows you which run is the problem.

export const GRID_SIZE = 10;

export const PUZZLES = [

  // --------------------------------------------------------------------------
  {
    id: 'tables-trees',
    name: 'Tables & Trees',
    theme: 'Spreadsheets, lookups, and the shape of stored data.',
    words: [
      { num: 1, row: 0, col: 2, dir: 'D', answer: 'DATA',  clue: 'Information collected so you can analyze it.' },
      { num: 2, row: 1, col: 6, dir: 'D', answer: 'MEAN',  clue: 'Add the numbers up and divide — the average.' },
      { num: 3, row: 2, col: 2, dir: 'A', answer: 'TABLE', clue: 'A grid of rows and columns.' },
      { num: 4, row: 2, col: 4, dir: 'D', answer: 'BIN',   clue: 'A bucket that groups values in a histogram.' },
      { num: 5, row: 6, col: 4, dir: 'A', answer: 'ROW',   clue: 'One horizontal record in a table.' },
      { num: 6, row: 6, col: 6, dir: 'D', answer: 'WIDE',  clue: 'A table layout with lots of columns.' },
    ],
  },

  // --------------------------------------------------------------------------
  {
    id: 'chart-builder',
    name: 'Chart Builder',
    theme: 'The visual vocabulary of charts and graphs.',
    words: [
      { num: 1, row: 0, col: 1, dir: 'A', answer: 'COUNT', clue: 'Tally up how many — a basic data summary.' },
      { num: 1, row: 0, col: 1, dir: 'D', answer: 'CHART', clue: 'A picture that shows numbers visually.' },
      { num: 2, row: 2, col: 1, dir: 'A', answer: 'AREA',  clue: 'A chart that fills the space under a line.' },
      { num: 3, row: 4, col: 1, dir: 'A', answer: 'TIME',  clue: 'What the X-axis usually shows in a trend chart.' },
      { num: 4, row: 6, col: 2, dir: 'A', answer: 'KEY',   clue: 'A chart legend explaining what each color means.' },
      { num: 5, row: 6, col: 3, dir: 'D', answer: 'ETL',   clue: 'Extract, Transform, ___ — moving data between systems.' },
    ],
  },

  // --------------------------------------------------------------------------
  {
    id: 'database-day',
    name: 'Database Day',
    theme: 'Inside the database: lookups, schemas, and pipelines.',
    words: [
      { num: 1, row: 0, col: 5, dir: 'A', answer: 'INPUT', clue: 'Data that goes in to a program or model.' },
      { num: 1, row: 0, col: 5, dir: 'D', answer: 'INDEX', clue: 'A shortcut a database uses to find rows fast.' },
      { num: 2, row: 2, col: 5, dir: 'A', answer: 'DATA',  clue: 'Information collected so you can analyze it.' },
      { num: 3, row: 4, col: 4, dir: 'A', answer: 'AXIS',  clue: 'The horizontal or vertical line of a chart.' },
      { num: 4, row: 6, col: 4, dir: 'D', answer: 'KEY',   clue: 'A unique value that identifies a row.' },
      { num: 5, row: 7, col: 0, dir: 'A', answer: 'TABLE', clue: 'A grid of rows and columns inside a database.' },
    ],
  },

  // --------------------------------------------------------------------------
  {
    id: 'network-nodes',
    name: 'Network & Nodes',
    theme: 'Graphs, trees, and the words for parts of a network.',
    words: [
      { num: 1, row: 0, col: 0, dir: 'A', answer: 'NODE',  clue: 'A point in a network — the dots in a graph.' },
      { num: 1, row: 0, col: 0, dir: 'D', answer: 'NULL',  clue: 'Missing or empty — no value at all.' },
      { num: 2, row: 0, col: 2, dir: 'D', answer: 'DEPTH', clue: 'How far a node is from the root of a tree.' },
      { num: 3, row: 5, col: 3, dir: 'A', answer: 'TREE',  clue: 'A branching structure of parents and children.' },
      { num: 3, row: 5, col: 3, dir: 'D', answer: 'TYPE',  clue: 'The kind of value a field holds (text, number, ...).' },
      { num: 4, row: 4, col: 5, dir: 'D', answer: 'LEAF',  clue: 'A node at the end of a branch — no children.' },
    ],
  },

];

// Validate every puzzle at module-load time. Any letter conflict OR phantom-word
// will throw here, so you see the problem the moment the module loads.
for (const p of PUZZLES) {
  validatePuzzle(p);
}

let lastPlayedId = null;

export function pickPuzzle() {
  const pool = PUZZLES.filter((p) => p.id !== lastPlayedId);
  const choice = pool[Math.floor(Math.random() * pool.length)];
  lastPlayedId = choice.id;
  return choice;
}

export function buildGrid(puzzle) {
  return stampGrid(puzzle);
}

function stampGrid(puzzle) {
  const cells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push({ row: r, col: c, letter: null, filled: false, input: '', num: null, found: false });
    }
    cells.push(row);
  }
  for (const w of puzzle.words) {
    const letters = w.answer.split('');
    for (let i = 0; i < letters.length; i++) {
      const r = w.dir === 'D' ? w.row + i : w.row;
      const c = w.dir === 'A' ? w.col + i : w.col;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
        throw new Error(`Puzzle '${puzzle.id}' word ${w.num}${w.dir} (${w.answer}) goes off-grid at (${r},${c}).`);
      }
      const cell = cells[r][c];
      if (cell.letter && cell.letter !== letters[i]) {
        throw new Error(`Puzzle '${puzzle.id}' conflict at (${r},${c}): ${cell.letter} vs ${letters[i]} from ${w.num}${w.dir} (${w.answer}).`);
      }
      cell.letter = letters[i];
      cell.filled = true;
    }
  }
  for (const w of puzzle.words) {
    const cell = cells[w.row][w.col];
    if (cell.num == null) cell.num = w.num;
  }
  return cells;
}

// Enforce: every contiguous filled run (length >=2) in any row or column must
// match exactly one across/down word. Single isolated cells are fine.
function validatePuzzle(puzzle) {
  const cells = stampGrid(puzzle);

  // Across runs.
  for (let r = 0; r < GRID_SIZE; r++) {
    let c = 0;
    while (c < GRID_SIZE) {
      if (!cells[r][c].filled) { c++; continue; }
      const start = c;
      while (c < GRID_SIZE && cells[r][c].filled) c++;
      const len = c - start;
      if (len >= 2) {
        const match = puzzle.words.find(
          (w) => w.dir === 'A' && w.row === r && w.col === start && w.answer.length === len
        );
        if (!match) {
          throw new Error(
            `Puzzle '${puzzle.id}' has a phantom across-run at row ${r}, cols ${start}-${start + len - 1} ` +
            `(length ${len}) — no across word matches. Add a word here, or separate the cells.`
          );
        }
      }
    }
  }

  // Down runs.
  for (let c = 0; c < GRID_SIZE; c++) {
    let r = 0;
    while (r < GRID_SIZE) {
      if (!cells[r][c].filled) { r++; continue; }
      const start = r;
      while (r < GRID_SIZE && cells[r][c].filled) r++;
      const len = r - start;
      if (len >= 2) {
        const match = puzzle.words.find(
          (w) => w.dir === 'D' && w.col === c && w.row === start && w.answer.length === len
        );
        if (!match) {
          throw new Error(
            `Puzzle '${puzzle.id}' has a phantom down-run at col ${c}, rows ${start}-${start + len - 1} ` +
            `(length ${len}) — no down word matches. Add a word here, or separate the cells.`
          );
        }
      }
    }
  }
}

export function clueGroups(puzzle) {
  const across = puzzle.words.filter((w) => w.dir === 'A').sort((a, b) => a.num - b.num);
  const down   = puzzle.words.filter((w) => w.dir === 'D').sort((a, b) => a.num - b.num);
  return { across, down };
}

export function wordCells(word) {
  const out = [];
  for (let i = 0; i < word.answer.length; i++) {
    const r = word.dir === 'D' ? word.row + i : word.row;
    const c = word.dir === 'A' ? word.col + i : word.col;
    out.push({ row: r, col: c });
  }
  return out;
}

export function isWordSolved(word, cells) {
  return wordCells(word).every(({ row, col }, i) => cells[row][col].input === word.answer[i]);
}
