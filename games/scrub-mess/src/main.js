// Scrub the Data Mess — game controller.
// The heap is rendered as absolutely-positioned word tiles in a triangular envelope.
// Click a messy tile -> flies into the bin. Click a clean tile -> shakes + time penalty.

import { buildHeap, CLEAN_TERMS } from './words.js';
import { beeSvg, trashBinSvg } from './mascot.js';
import { sfx, isMuted, toggleMuted } from './sound.js';

const CLEAN_SET = new Set(CLEAN_TERMS);

const DIFFICULTIES = {
  easy:   { label: 'EASY',   total: 22, messyRatio: 0.40, seconds: 40, wrongPenalty: 2 },
  medium: { label: 'MEDIUM', total: 32, messyRatio: 0.45, seconds: 30, wrongPenalty: 3 },
  hard:   { label: 'HARD',   total: 44, messyRatio: 0.50, seconds: 20, wrongPenalty: 4 },
};

const state = {
  screen: 'menu',       // 'menu' | 'play'
  phase: 'live',        // 'live' | 'reveal'  — only meaningful on screen=play
  difficulty: 'medium',
  items: [],
  totalMessy: 0,
  trashedMessy: 0,
  wrongClicks: 0,
  streak: 0,
  timeLeft: 0,
  timerId: null,
  startedAt: 0,
  endReason: '',        // 'time' | 'clean' | 'manual'
};

const $app = document.getElementById('app');

// ---------- rendering ----------

function render() {
  if (state.screen === 'menu') return renderMenu();
  if (state.screen === 'play') return renderPlay();
}

function renderMenu() {
  const muteLabel = isMuted() ? '🔇 SOUND OFF' : '🔊 SOUND ON';
  $app.innerHTML = `
    <div class="screen screen-menu">
      <header class="brand">
        <div class="brand-tag">DataCruise · Word Games · #04</div>
        <h1 class="title">SCRUB THE DATA <span class="accent">MESS</span></h1>
        <p class="subtitle">Toss the typos, dupes, junk and off-topic words into the bin. Save the clean data.</p>
      </header>

      <div class="menu-magni" aria-hidden="true">${beeSvg({ mood: 'smirk' })}</div>

      <section class="card">
        <div class="card-label">SELECT DIFFICULTY</div>
        <div class="diff-row">
          ${Object.entries(DIFFICULTIES).map(([key, d]) => `
            <button class="diff-btn ${state.difficulty === key ? 'on' : ''}" data-diff="${key}">
              <span class="diff-name">${d.label}</span>
              <span class="diff-meta">${d.total} words · ${d.seconds}s · -${d.wrongPenalty}s err</span>
            </button>
          `).join('')}
        </div>
      </section>

      <div class="actions">
        <button class="btn-primary" id="startBtn">▶ START SCRUB</button>
        <button class="btn-ghost" id="muteBtn">${muteLabel}</button>
      </div>

      <section class="howto">
        <div class="howto-title">HOW TO PLAY</div>
        <ul>
          <li>Click any <span class="t-messy">messy</span> item to fling it into the bin.</li>
          <li>Messy = misspellings, duplicates, junk symbols, off-topic, bad formatting.</li>
          <li>Trashing a <span class="t-clean">clean</span> word costs time.</li>
          <li>Score = % of messy items you trash before the timer ends.</li>
        </ul>
      </section>
    </div>
  `;

  $app.querySelectorAll('[data-diff]').forEach(el => {
    el.addEventListener('click', () => {
      state.difficulty = el.dataset.diff;
      sfx.click();
      render();
    });
  });
  $app.querySelector('#startBtn').addEventListener('click', () => { sfx.click(); startGame(); });
  $app.querySelector('#muteBtn').addEventListener('click', () => { toggleMuted(); sfx.click(); render(); });
}

function renderPlay() {
  const muteLabel = isMuted() ? '🔇' : '🔊';
  $app.innerHTML = `
    <div class="screen screen-play">
      <header class="hud">
        <div class="hud-left">
          <div class="hud-stat">
            <span class="hud-key">TRASHED</span>
            <span class="hud-val" id="hudTrashed">${state.trashedMessy}<span class="hud-tot">/${state.totalMessy}</span></span>
          </div>
          <div class="hud-stat">
            <span class="hud-key">MISTAKES</span>
            <span class="hud-val" id="hudWrong">${state.wrongClicks}</span>
          </div>
          <div class="hud-stat">
            <span class="hud-key">STREAK</span>
            <span class="hud-val" id="hudStreak">${state.streak}</span>
          </div>
        </div>
        <div class="hud-right">
          <div class="timer" id="timer">${formatTime(state.timeLeft)}</div>
          <button class="btn-ghost btn-ghost-sm" id="muteBtnPlay">${muteLabel}</button>
          <button class="btn-ghost btn-ghost-sm" id="quitBtn">QUIT</button>
        </div>
      </header>

      <main class="playfield" id="playfield">
        <div class="heap" id="heap"></div>
        <div class="bin-area">
          <div class="magni-side" aria-hidden="true">${beeSvg({ mood: 'smirk' })}</div>
          <div class="bin" id="bin">${trashBinSvg()}</div>
        </div>
      </main>

      <div class="bubble" id="bubble">scrub the mess →</div>
    </div>
  `;

  $app.querySelector('#muteBtnPlay').addEventListener('click', () => {
    toggleMuted();
    sfx.click();
    $app.querySelector('#muteBtnPlay').textContent = isMuted() ? '🔇' : '🔊';
  });
  $app.querySelector('#quitBtn').addEventListener('click', () => {
    sfx.click();
    stopTimer();
    state.screen = 'menu';
    render();
  });

  layoutHeap();
}

// At round end we stay on the play screen and replace the bin-area DOM
// with a results panel, while remaining tiles light up in their kind-colors.
function renderResultPanel() {
  const total = state.totalMessy || 1;
  const pct = Math.round((state.trashedMessy / total) * 100);
  const grade = pct >= 95 ? 'S' : pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : pct >= 25 ? 'D' : 'F';
  const cheer = pct >= 70;
  const headline =
    state.endReason === 'clean' ? 'HEAP CLEARED' :
    state.endReason === 'time'  ? "TIME'S UP"   : 'ROUND ENDED';

  return `
    <div class="result-panel">
      <div class="result-magni ${cheer ? 'cheer' : ''}" aria-hidden="true">
        ${beeSvg({ mood: cheer ? 'cheer' : 'frown' })}
      </div>
      <div class="result-headline">${headline}</div>
      <div class="result-score">
        <div class="score-grade grade-${grade.toLowerCase()}">${grade}</div>
        <div class="score-pct">${pct}<span class="pct-sym">%</span></div>
      </div>
      <div class="result-meta">${state.trashedMessy} of ${state.totalMessy} messy binned</div>
      <ul class="result-stats">
        <li><span>Mistakes</span><strong>${state.wrongClicks}</strong></li>
        <li><span>Best streak</span><strong>${state.bestStreak || 0}</strong></li>
      </ul>
      <div class="result-actions">
        <button class="btn-primary" id="againBtn">▶ NEW HEAP</button>
        <button class="btn-ghost" id="menuBtn">MENU</button>
      </div>
    </div>
  `;
}

// ---------- heap layout ----------

function layoutHeap() {
  const heap = document.getElementById('heap');
  if (!heap) return;
  const W = heap.clientWidth;
  const H = heap.clientHeight;

  heap.innerHTML = '';

  // Build every tile first so we can measure its real rendered width, then
  // flow-pack them into rows by width so they NEVER overlap (the old
  // algorithm forced a fixed count per row and piled them up on narrow
  // phones). Order is shuffled for a scattered "mess" feel.
  const items = [...state.items].sort(() => Math.random() - 0.5);
  const gapX = 8, gapY = 10, padX = 8, padTop = 12, padBottom = 14;

  const built = items.map((item) => {
    const tile = document.createElement('button');
    // Colour each tile from a hash of its TEXT — vibrant "paper scrap" look,
    // deliberately NOT tied to messy/clean so it never hints the answer.
    let _h = 0;
    for (let k = 0; k < item.text.length; k++) _h = (_h * 31 + item.text.charCodeAt(k)) >>> 0;
    tile.className = 'tile tile-c' + (_h % 8);
    tile.type = 'button';
    tile.dataset.id = item.id;
    tile.innerHTML = `<span class="tile-text">${escapeHtml(item.text)}</span>`;
    tile.addEventListener('click', (e) => handleTileClick(e, item));
    heap.appendChild(tile);
    return tile;
  });

  // Pack into rows using measured widths.
  const rowsBuf = [];
  let cur = [], x = padX, rowH = 0;
  for (const tile of built) {
    const tw = tile.offsetWidth, th = tile.offsetHeight;
    if (cur.length && x + tw > W - padX) {
      rowsBuf.push({ items: cur, h: rowH });
      cur = []; x = padX; rowH = 0;
    }
    cur.push({ tile, tw, th });
    x += tw + gapX;
    rowH = Math.max(rowH, th);
  }
  if (cur.length) rowsBuf.push({ items: cur, h: rowH });

  // Spread the rows down the heap (a loose pile), clamped to the height.
  const totalH = rowsBuf.reduce((s, r) => s + r.h, 0);
  const slack = Math.max(0, H - padTop - padBottom - totalH);
  const vGap = rowsBuf.length > 1
    ? Math.min(gapY + 12, slack / (rowsBuf.length - 1))
    : gapY;

  let y = padTop;
  rowsBuf.forEach((row, ri) => {
    const rowWidth = row.items.reduce((s, it) => s + it.tw, 0) + gapX * (row.items.length - 1);
    let cx = Math.max(padX, (W - rowWidth) / 2);
    row.items.forEach((it) => {
      const jy = (Math.random() - 0.5) * 5;
      const rot = (Math.random() - 0.5) * 7;
      it.tile.style.transform =
        `translate(${Math.round(cx)}px, ${Math.round(y + jy)}px) rotate(${rot}deg)`;
      it.tile.style.zIndex = String(100 + ri);
      cx += it.tw + gapX;
    });
    y += row.h + vGap;
  });

  // If we relayout during reveal (e.g. window resize), re-apply reveal styling.
  if (state.phase === 'reveal') revealHeap();
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    // Preserve leading/trailing spaces visibly:
    .replace(/^ /, ' ')
    .replace(/ $/, ' ');
}

// ---------- gameplay ----------

// An item is "messy to click NOW" if:
//   - its text is not a canonical clean data term (typos, junk, off-topic, bad-format), OR
//   - there are still other tiles with the same text in the heap (an excess copy).
// Once only one copy of a clean term remains, clicking it is wrong.
function isMessyNow(item) {
  if (!CLEAN_SET.has(item.text)) return true;
  const copies = state.items.filter(it => it.text === item.text).length;
  return copies > 1;
}

function handleTileClick(e, item) {
  if (state.screen !== 'play' || state.phase !== 'live') return;
  const tile = e.currentTarget;
  if (tile.classList.contains('flying') || tile.classList.contains('gone')) return;

  if (isMessyNow(item)) {
    sfx.pick();
    flyToBin(tile);
    state.items = state.items.filter(it => it.id !== item.id);
    state.trashedMessy++;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak || 0, state.streak);
    if (state.streak > 0 && state.streak % 5 === 0) {
      sfx.streak();
      showBubble(`STREAK ×${state.streak}`);
    }
    updateHud();
    openBinBriefly();
    // Round end if all messy gone.
    if (state.trashedMessy >= state.totalMessy) {
      state.endReason = 'clean';
      finishRound();
    }
  } else {
    sfx.wrong();
    tile.classList.add('shake', 'is-clean');
    setTimeout(() => tile.classList.remove('shake', 'is-clean'), 500);
    state.wrongClicks++;
    state.streak = 0;
    const penalty = DIFFICULTIES[state.difficulty].wrongPenalty;
    state.timeLeft = Math.max(0, state.timeLeft - penalty);
    showBubble(`✗ "${item.text}" is clean   -${penalty}s`);
    flashTimer();
    updateHud();
    if (state.timeLeft <= 0) {
      state.endReason = 'time';
      finishRound();
    }
  }
}

function flyToBin(tile) {
  const bin = document.getElementById('bin');
  if (!bin) { tile.classList.add('gone'); return; }
  const tRect = tile.getBoundingClientRect();
  const bRect = bin.getBoundingClientRect();
  // Aim for the bin opening (top portion of the bin).
  const targetX = bRect.left + bRect.width / 2;
  const targetY = bRect.top + bRect.height * 0.25;
  const dx = targetX - (tRect.left + tRect.width / 2);
  const dy = targetY - (tRect.top + tRect.height / 2);

  // Preserve existing transform values by replacing rotate and chaining.
  const existing = tile.style.transform;
  tile.classList.add('flying');
  // Sequence: tile keeps its absolute placement, then we transition translate via a CSS variable.
  tile.style.setProperty('--fly-x', `${dx}px`);
  tile.style.setProperty('--fly-y', `${dy}px`);
  tile.style.transform = `${existing} translate(var(--fly-x), var(--fly-y)) scale(0.2) rotate(720deg)`;
  tile.style.opacity = '0';

  setTimeout(() => {
    sfx.trash();
  }, 220);
  setTimeout(() => {
    tile.classList.add('gone');
    tile.remove();
  }, 420);
}

function openBinBriefly() {
  const bin = document.getElementById('bin');
  if (!bin) return;
  bin.classList.add('open');
  clearTimeout(bin._closeTimer);
  bin._closeTimer = setTimeout(() => bin.classList.remove('open'), 280);
}

function flashTimer() {
  const t = document.getElementById('timer');
  if (!t) return;
  t.classList.add('penalty');
  setTimeout(() => t.classList.remove('penalty'), 350);
}

function showBubble(text) {
  const b = document.getElementById('bubble');
  if (!b) return;
  b.textContent = text;
  b.classList.remove('show');
  void b.offsetWidth; // restart animation
  b.classList.add('show');
}

function updateHud() {
  const t = document.getElementById('hudTrashed');
  const w = document.getElementById('hudWrong');
  const s = document.getElementById('hudStreak');
  if (t) t.innerHTML = `${state.trashedMessy}<span class="hud-tot">/${state.totalMessy}</span>`;
  if (w) w.textContent = String(state.wrongClicks);
  if (s) s.textContent = String(state.streak);
}

function startGame() {
  const cfg = DIFFICULTIES[state.difficulty];
  const heap = buildHeap({ total: cfg.total, messyRatio: cfg.messyRatio });
  state.items = heap.items;
  // Recompute totalMessy to match the click logic: every item is messy except
  // one canonical clean copy per distinct CLEAN_TERMS text appearing in the heap.
  const distinctClean = new Set(
    state.items.filter(it => CLEAN_SET.has(it.text)).map(it => it.text)
  );
  state.totalMessy = state.items.length - distinctClean.size;
  state.trashedMessy = 0;
  state.wrongClicks = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.timeLeft = cfg.seconds;
  state.startedAt = Date.now();
  state.endReason = '';
  state.screen = 'play';
  state.phase = 'live';
  render();
  startTimer();
}

function startTimer() {
  stopTimer();
  state.timerId = setInterval(() => {
    state.timeLeft = Math.max(0, state.timeLeft - 1);
    const el = document.getElementById('timer');
    if (el) {
      el.textContent = formatTime(state.timeLeft);
      el.classList.toggle('low', state.timeLeft <= 10);
    }
    if (state.timeLeft <= 10 && state.timeLeft > 0) sfx.tick();
    if (state.timeLeft <= 0) {
      state.endReason = 'time';
      finishRound();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function finishRound() {
  stopTimer();
  state.missed = collectMissed();
  state.phase = 'reveal';
  if (state.endReason === 'time') sfx.timeout();
  else if (state.trashedMessy === state.totalMessy && state.wrongClicks === 0) sfx.win();
  else sfx.done();

  {
    const total = state.totalMessy || 1;
    const pct = Math.round((state.trashedMessy / total) * 100);
    const grade = pct >= 95 ? 'S' : pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : pct >= 25 ? 'D' : 'F';
    window.DataCruiseResult && DataCruiseResult.ready({
      slug: 'scrub-mess', game: 'Scrub the Data Mess',
      headline: pct + '%',
      sub: 'grade ' + grade + ' · data scrubbed',
      stars: pct >= 85 ? 3 : pct >= 70 ? 2 : pct > 0 ? 1 : 0, starsMax: 3,
    });
  }

  // Brief delay so any final trash animation finishes reading, then reveal in place.
  setTimeout(() => {
    revealHeap();
    swapBinForResult();
  }, 300);
}

// Light up every remaining tile with its kind class so the messy items pop
// against dimmed clean tiles. Mirrors collectMissed's duplicate logic.
function revealHeap() {
  const heap = document.getElementById('heap');
  if (!heap) return;
  heap.classList.add('revealing');
  const counts = state.items.reduce((m, it) => (m[it.text] = (m[it.text] || 0) + 1, m), {});
  const seenClean = new Set();

  for (const it of state.items) {
    const tile = heap.querySelector(`.tile[data-id="${it.id}"]`);
    if (!tile) continue;
    if (CLEAN_SET.has(it.text)) {
      if (counts[it.text] > 1 && seenClean.has(it.text)) {
        markTile(tile, 'duplicate', `×${counts[it.text]}`);
      } else if (counts[it.text] > 1) {
        seenClean.add(it.text);
        tile.classList.add('reveal-clean');
      } else {
        tile.classList.add('reveal-clean');
      }
    } else {
      const kind = classify(it);
      let hint = '';
      if (kind === 'typo') {
        const m = /^misspelled "(.+)"$/.exec(it.reason || '');
        if (m) hint = `→ ${m[1]}`;
      }
      markTile(tile, kind, hint);
    }
  }
}

function markTile(tile, kind, hint) {
  tile.classList.add('reveal-messy', `reveal-${cssKind(kind)}`);
  // Drop any existing badge if we're re-applying after a relayout.
  tile.querySelector('.tile-badge')?.remove();
  const badge = document.createElement('span');
  badge.className = `tile-badge tile-badge-${cssKind(kind)}`;
  badge.textContent = hint ? `${kind} ${hint}` : kind;
  tile.appendChild(badge);
}

function swapBinForResult() {
  const binArea = document.querySelector('.bin-area');
  if (!binArea) return;
  binArea.classList.add('show-result');
  binArea.innerHTML = renderResultPanel();
  binArea.querySelector('#againBtn')?.addEventListener('click', () => { sfx.click(); startGame(); });
  binArea.querySelector('#menuBtn')?.addEventListener('click', () => { sfx.click(); state.screen = 'menu'; render(); });
}

// Walk what's left on the heap and label each remaining messy item with a kind.
// Duplicates are paired with their canonical clean term.
function collectMissed() {
  const remaining = state.items;
  // Count copies per text so we can identify duplicates.
  const counts = remaining.reduce((m, it) => (m[it.text] = (m[it.text] || 0) + 1, m), {});
  // For duplicate clean texts (count > 1), keep one as "kept clean", flag the rest as duplicates.
  const seenClean = new Set();
  const missed = [];
  for (const it of remaining) {
    if (CLEAN_SET.has(it.text)) {
      if (counts[it.text] > 1 && seenClean.has(it.text)) {
        missed.push({ text: it.text, kind: 'duplicate', reason: it.reason || 'duplicate', count: counts[it.text] });
      } else if (counts[it.text] > 1) {
        // First copy of a duplicated clean term: this is the one the player would have kept.
        seenClean.add(it.text);
      }
      // Single copies of clean terms are not messy.
      continue;
    }
    // Non-canonical text — classify by reason if available.
    missed.push({ text: it.text, kind: classify(it), reason: it.reason || '' });
  }
  return missed;
}

function cssKind(k) { return String(k).replace(/[^a-z]+/gi, '-'); }

function classify(item) {
  const r = item.reason || '';
  if (r.startsWith('misspelled')) return 'typo';
  if (r === 'junk') return 'junk';
  if (r === 'not a data term') return 'off-topic';
  if (r === 'bad formatting') return 'bad format';
  if (r === 'duplicate') return 'duplicate';
  return 'messy';
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

// Relayout heap when the window resizes during a round.
window.addEventListener('resize', () => {
  if (state.screen === 'play') layoutHeap();
});

render();
