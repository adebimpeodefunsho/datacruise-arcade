import { ROUNDS } from './rounds.js?v=1';
import { sfx, isMuted, toggleMuted } from './sound.js?v=1';

const app = document.getElementById('app');

const state = {
  roundIndex: 0,
  totalScore: 0,
  timeLeft: 0,
  sentences: [],
  bank: [],
  selectedWordId: null,
  status: 'playing',
  lastRoundResult: null,
  timer: null,
};

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startRound(idx) {
  const round = ROUNDS[idx];
  state.roundIndex = idx;
  state.timeLeft = round.seconds;
  state.status = 'playing';
  state.selectedWordId = null;
  state.lastRoundResult = null;
  state.sentences = round.sentences.map((s, i) => ({
    ...s,
    slots: s.middles.map(() => null),
    rowId: i,
  }));
  let wid = 0;
  const allMiddles = [];
  state.sentences.forEach((s) => {
    s.middles.forEach((w) => {
      allMiddles.push({ id: `w${wid++}`, text: w, location: 'bank' });
    });
  });
  state.bank = shuffle(allMiddles);
  if (state.timer) clearInterval(state.timer);
  state.timer = setInterval(tick, 1000);
  render();
}

function tick() {
  if (state.status !== 'playing') return;
  state.timeLeft -= 1;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    submitRound(true);
  } else {
    render();
  }
}

function findWord(id) {
  const inBank = state.bank.find((w) => w.id === id);
  if (inBank) return { word: inBank, in: 'bank' };
  for (const s of state.sentences) {
    for (let i = 0; i < s.slots.length; i++) {
      if (s.slots[i] && s.slots[i].id === id) {
        return { word: s.slots[i], in: 'slot', rowId: s.rowId, slotIdx: i };
      }
    }
  }
  return null;
}

function removeWordFromLocation(id) {
  const idx = state.bank.findIndex((w) => w.id === id);
  if (idx >= 0) { state.bank.splice(idx, 1); return; }
  for (const s of state.sentences) {
    for (let i = 0; i < s.slots.length; i++) {
      if (s.slots[i] && s.slots[i].id === id) { s.slots[i] = null; return; }
    }
  }
}

function onWordClick(id) {
  if (state.status !== 'playing') return;
  const sel = findWord(id);
  state.selectedWordId = state.selectedWordId === id ? null : id;
  if (state.selectedWordId) sfx.pick();
  else if (sel && sel.in === 'slot') sfx.returnToBank();
  render();
}

function onSlotClick(rowId, slotIdx) {
  if (state.status !== 'playing') return;
  const row = state.sentences[rowId];
  const occupant = row.slots[slotIdx];

  if (state.selectedWordId) {
    const sel = findWord(state.selectedWordId);
    if (!sel) { state.selectedWordId = null; render(); return; }
    // Clicking the same slot the selected word is already in: just deselect.
    if (sel.in === 'slot' && sel.rowId === rowId && sel.slotIdx === slotIdx) {
      state.selectedWordId = null;
      render();
      return;
    }
    removeWordFromLocation(sel.word.id);
    if (occupant) {
      occupant.location = 'bank';
      state.bank.push(occupant);
    }
    row.slots[slotIdx] = sel.word;
    sel.word.location = `slot:${rowId}:${slotIdx}`;
    state.selectedWordId = null;
    sfx.place();
  } else if (occupant) {
    state.selectedWordId = occupant.id;
    sfx.pick();
  }
  render();
}

function onBankClick() {
  if (state.status !== 'playing') return;
  if (!state.selectedWordId) return;
  const sel = findWord(state.selectedWordId);
  if (!sel) { state.selectedWordId = null; render(); return; }
  if (sel.in === 'slot') {
    removeWordFromLocation(sel.word.id);
    sel.word.location = 'bank';
    state.bank.push(sel.word);
    sfx.returnToBank();
  }
  state.selectedWordId = null;
  render();
}

function clearAll() {
  if (state.status !== 'playing') return;
  let moved = 0;
  for (const s of state.sentences) {
    for (let i = 0; i < s.slots.length; i++) {
      const w = s.slots[i];
      if (w) {
        w.location = 'bank';
        state.bank.push(w);
        s.slots[i] = null;
        moved++;
      }
    }
  }
  if (moved > 0) {
    state.bank = shuffle(state.bank);
    sfx.shuffle();
  }
  state.selectedWordId = null;
  render();
}

/**
 * Clear a single placed answer — returns just that one word to the bank.
 * Triggered by the small × button rendered inside each filled slot.
 */
function clearSlot(rowId, slotIdx) {
  if (state.status !== 'playing') return;
  const row = state.sentences[rowId];
  const word = row.slots[slotIdx];
  if (!word) return;
  row.slots[slotIdx] = null;
  word.location = 'bank';
  state.bank.push(word);
  if (state.selectedWordId === word.id) state.selectedWordId = null;
  sfx.returnToBank();
  render();
}

function submitRound(viaTimeout = false) {
  if (state.status !== 'playing') return;
  if (state.timer) { clearInterval(state.timer); state.timer = null; }
  state.status = 'reviewing';
  if (viaTimeout) sfx.timeout(); else sfx.submit();

  let correct = 0;
  const perRow = state.sentences.map((s) => {
    const ok = s.slots.every((w, i) => w && w.text === s.middles[i]);
    if (ok) correct += 1;
    return ok;
  });
  const points = correct * 10;
  const bonus = correct === state.sentences.length ? state.timeLeft : 0;
  state.totalScore += points + bonus;
  state.lastRoundResult = { correct, total: state.sentences.length, points, bonus, perRow };
  render();

  // Stagger per-row reveal sounds, then a final flourish.
  perRow.forEach((ok, i) => {
    setTimeout(() => { ok ? sfx.correctRow(i) : sfx.wrongRow(); }, 350 + i * 320);
  });
  setTimeout(() => {
    if (correct === perRow.length) sfx.win();
    else if (correct > 0) sfx.partial();
  }, 350 + perRow.length * 320);
}

function nextRound() {
  if (state.roundIndex + 1 < ROUNDS.length) {
    startRound(state.roundIndex + 1);
  } else {
    state.status = 'finished';
    sfx.gameover();
    render();
  }
}

function restartGame() {
  state.totalScore = 0;
  startRound(0);
}

function isRoundFilled() {
  return state.sentences.every((s) => s.slots.every((w) => w !== null));
}

// ----- Rendering --------------------------------------------------

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  const flat = [].concat(children).flat(Infinity);
  for (const c of flat) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function renderHeader() {
  const round = ROUNDS[state.roundIndex];
  const timeWarn = state.timeLeft <= 15 && state.status === 'playing';
  return el('div', { class: 'hdr' }, [
    el('div', { class: 'title' }, [
      el('span', { class: 'prompt', text: '>' }),
      'Bridge the Data Sentence',
      el('span', { class: 'series', text: `DataCruise Word Games · ${round.name}` }),
    ]),
    el('div', { class: 'hud' }, [
      el('div', { class: 'stat' }, [
        el('span', { class: 'lbl', text: 'Score' }),
        el('span', { class: 'val', text: String(state.totalScore) }),
      ]),
      el('div', { class: 'stat timer' }, [
        el('span', { class: 'lbl', text: 'Time' }),
        el('span', { class: 'val' + (timeWarn ? ' warn' : ''), text: `${state.timeLeft}s` }),
      ]),
      el('button', {
        class: 'mute-btn',
        title: isMuted() ? 'Unmute' : 'Mute',
        'aria-label': isMuted() ? 'Unmute' : 'Mute',
        text: isMuted() ? '♪̸' : '♪',
        onClick: () => { toggleMuted(); render(); },
      }),
    ]),
  ]);
}

function renderRow(s, idx) {
  const result = state.lastRoundResult;
  const reviewing = state.status === 'reviewing' && result;
  const isWrong = reviewing && !result.perRow[idx];
  const cls = reviewing ? (result.perRow[idx] ? 'row correct' : 'row wrong') : 'row';
  const line = el('div', { class: 'row-line' }, [
    el('span', { class: 'num', text: `${String(idx + 1).padStart(2, '0')}.` }),
    el('span', { class: 'fixed', text: s.first }),
    ...s.slots.map((w, i) => {
      const filled = !!w;
      const isSelected = filled && state.selectedWordId === w.id;
      const slotCls = 'slot '
        + (filled ? 'filled' : 'empty')
        + (state.selectedWordId && !filled ? ' target' : '')
        + (isSelected ? ' selected' : '');
      const children = filled
        ? [
            el('span', { class: 'slot-text', text: w.text }),
            el('button', {
              class: 'slot-clear',
              title: 'Clear this answer',
              'aria-label': 'Clear this answer',
              text: '×',
              onClick: (e) => { e.stopPropagation(); clearSlot(s.rowId, i); },
            }),
          ]
        : [];
      return el('span', {
        class: slotCls,
        onClick: () => onSlotClick(s.rowId, i),
      }, children);
    }),
    el('span', { class: 'fixed', text: s.last }),
  ]);
  const children = [line];
  if (isWrong) {
    const correctSentence = [
      el('span', { class: 'corr-label', text: 'Correct:' }),
      ' ',
      s.first, ' ',
      el('span', { class: 'corr-mid', text: s.middles[0] }),
      ' ',
      el('span', { class: 'corr-mid', text: s.middles[1] }),
      ' ', s.last, '.',
    ];
    children.push(el('div', { class: 'correction' }, correctSentence));
  }
  return el('div', { class: cls }, children);
}

function renderBank() {
  if (state.status !== 'playing') return null;
  const sel = state.selectedWordId ? findWord(state.selectedWordId) : null;
  const selFromSlot = sel && sel.in === 'slot';
  let hint;
  if (!sel) hint = 'Click a word, then click a slot. Tap a placed word to move or return it.';
  else if (selFromSlot) hint = 'Click another slot to move it · click the bank to send it back.';
  else hint = 'Click a slot to place it · tap the word again to cancel.';

  const bankClass = 'bank' + (selFromSlot ? ' return-target' : '');
  return el('div', {}, [
    el('div', { class: 'bank-label' }, [
      'Word Bank',
      el('span', { class: 'hint', text: hint }),
    ]),
    el(
      'div',
      { class: bankClass, onClick: (e) => { if (e.target.classList.contains('bank')) onBankClick(); } },
      state.bank.length === 0
        ? [el('span', { class: 'bank-empty', text: selFromSlot ? 'click here to return the selected word' : 'all placed — submit to check' })]
        : state.bank.map((w) =>
            el('span', {
              class: 'word' + (state.selectedWordId === w.id ? ' selected' : ''),
              text: w.text,
              onClick: (e) => { e.stopPropagation(); onWordClick(w.id); },
            })
          )
    ),
  ]);
}

function renderControls() {
  if (state.status === 'playing') {
    const ready = isRoundFilled();
    const anyPlaced = state.sentences.some((s) => s.slots.some((w) => w !== null));
    return el('div', { class: 'controls' }, [
      el('button', {
        class: 'btn secondary',
        text: 'Clear all',
        disabled: !anyPlaced,
        onClick: clearAll,
      }),
      el('button', {
        class: 'btn secondary',
        text: 'Reshuffle bank',
        onClick: () => { state.bank = shuffle(state.bank); sfx.shuffle(); render(); },
      }),
      el('button', {
        class: 'btn',
        text: ready ? 'Submit round' : 'Fill all slots',
        disabled: !ready,
        onClick: () => submitRound(false),
      }),
    ]);
  }
  if (state.status === 'reviewing') {
    const lastRound = state.roundIndex + 1 >= ROUNDS.length;
    return el('div', { class: 'controls' }, [
      el('button', {
        class: 'btn',
        text: lastRound ? 'See final score' : 'Next round →',
        onClick: nextRound,
      }),
    ]);
  }
  return el('div', { class: 'controls' }, [
    el('button', { class: 'btn', text: 'Play again', onClick: restartGame }),
  ]);
}

function renderResult() {
  if (state.status === 'reviewing' && state.lastRoundResult) {
    const r = state.lastRoundResult;
    const win = r.correct === r.total;
    return el('div', { class: 'result' + (win ? ' win' : '') }, [
      `${r.correct} / ${r.total} sentences bridged · +`,
      el('strong', { text: `${r.points}` }),
      r.bonus > 0
        ? [' pts, with a ', el('strong', { text: `+${r.bonus}` }), ' time bonus.']
        : ' pts.',
    ]);
  }
  if (state.status === 'finished') {
    return el('div', { class: 'result win' }, [
      'Final score: ',
      el('strong', { text: String(state.totalScore) }),
      ' — bridges built across all rounds.',
    ]);
  }
  return null;
}

function renderReviewBanner() {
  if (state.status !== 'reviewing' || !state.lastRoundResult) return null;
  const r = state.lastRoundResult;
  const perfect = r.correct === r.total;
  const msg = perfect
    ? 'Every one of these is a true statement about data — and you got them all.'
    : "These aren't random sentences. Each one is a true statement about data — here are the ones you missed:";
  return el('div', { class: 'banner' + (perfect ? ' banner-win' : '') }, [msg]);
}

function render() {
  const round = ROUNDS[state.roundIndex];
  const body = el('div', { class: 'term-body' }, [
    renderHeader(),
    renderReviewBanner(),
    el(
      'div',
      { class: 'sentences' },
      state.sentences.map((s, i) => renderRow(s, i))
    ),
    renderBank(),
    renderControls(),
    renderResult(),
  ]);
  const term = el('div', { class: 'term' }, [
    el('div', { class: 'term-bar' }, [
      el('div', { class: 'dots' }, [
        el('span', { class: 'dot r' }),
        el('span', { class: 'dot y' }),
        el('span', { class: 'dot g' }),
      ]),
      el('span', { class: 'path', text: `~/datacruise/word-games/bridge — round ${state.roundIndex + 1}/${ROUNDS.length}` }),
    ]),
    body,
  ]);
  app.replaceChildren(term);
}

startRound(0);
