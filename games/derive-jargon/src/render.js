// Rendering for Derive the Data Jargon (typed-input flow + daily mode).

import { beeSvg } from './mascot.js';
import { CONFIG, rankFor } from './state.js';
import { puzzleFor, todayKey } from './daily.js';
import { isMuted } from './sound.js';

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

function termFrame(inner, { cmd = 'play' } = {}) {
  const muteIcon = isMuted() ? '🔇' : '🔊';
  return `
    <div class="term">
      <div class="term-bar">
        <div class="dots"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
        <div class="path">
          <span class="prompt">datacruise</span><span class="sep">@</span><span class="prompt">word-games</span><span class="sep">:</span><span class="cmd">~/${esc(cmd)}</span><span class="prompt">$</span>
        </div>
        <button class="mute-btn" id="btn-mute" type="button" aria-label="Toggle sound">${muteIcon}</button>
      </div>
      <div class="term-body">
        <div class="brand">
          <div class="brand-title">DataCruise <span class="pipe">|</span> Word Games <span class="pipe">|</span> Game #01</div>
          <div class="brand-meta">v1.2</div>
        </div>
        ${inner}
      </div>
    </div>
  `;
}

export function renderSplash(s, handlers) {
  const today = puzzleFor(new Date());
  const html = termFrame(`
    <div class="splash">
      <div class="mascot">${beeSvg()}</div>
      <h1>Derive the Data Jargon<span class="punc">.</span><span class="cursor">█</span></h1>
      <p class="tagline">
        Two cryptic icons. One <span class="hl">data term</span>.
        Type your answer, beat the timer, earn your rank.
      </p>
      <div class="how-to">
        <div class="head">// How to play</div>
        <ul>
          <li>Each round shows two ASCII icons. Together they spell a data jargon term.</li>
          <li>Type your answer and press <span class="key">Enter</span>.</li>
          <li>Stuck? Tap <span class="key">Hint</span> to reveal the definition — costs ${CONFIG.hintPenalty} pts.</li>
          <li>One guess per round. Wrong? The answer reveals and the next round loads.</li>
          <li>${CONFIG.startingLives} lives. Faster + streaks = more points.</li>
        </ul>
      </div>

      <div class="start-buttons">
        <button class="btn" id="btn-start">▶ Start ${CONFIG.roundsPerGame} rounds</button>
        <button class="btn mag" id="btn-daily">★ Daily Puzzle <span class="daily-num">#${today.number}</span></button>
      </div>
      <p class="daily-tag">Daily Puzzle · ${esc(today.dateKey)} · same puzzle for everyone, today only</p>
    </div>
  `, { cmd: 'splash' });

  setHTML(html);
  document.getElementById('btn-start').addEventListener('click', handlers.onStart);
  document.getElementById('btn-daily').addEventListener('click', handlers.onStartDaily);
  bindMute(handlers);
}

export function renderRound(s, handlers) {
  const c = s.current;
  if (!c) return;
  const isDaily = s.mode === 'daily';
  const livesWarn = s.lives === 1 && !isDaily ? ' warn' : '';
  const roundN = s.roundIndex + 1;
  const total = s.deck.length;

  // HUD: classic shows score/streak/lives/round; daily shows daily-#/attempts/timer-only
  let hudHtml;
  if (isDaily) {
    hudHtml = `
      <div class="hud daily">
        <div class="hud-cell score"><span class="lbl">DAILY</span><span class="val">#${s.dailyMeta?.number ?? '?'}</span></div>
        <div class="hud-cell round"><span class="lbl">DATE</span><span class="val small">${esc(s.dailyMeta?.dateKey ?? '')}</span></div>
        <div class="hud-cell lives"><span class="lbl">ATTEMPT</span><span class="val">1/1</span></div>
      </div>`;
  } else {
    hudHtml = `
      <div class="hud">
        <div class="hud-cell score"><span class="lbl">SCORE</span><span class="val">${s.score}</span></div>
        <div class="hud-cell streak"><span class="lbl">STREAK</span><span class="val">${s.streak}×</span></div>
        <div class="hud-cell lives"><span class="lbl">LIVES</span><span class="val${livesWarn}">${'♥'.repeat(s.lives)}${'·'.repeat(Math.max(0, CONFIG.startingLives - s.lives))}</span></div>
        <div class="hud-cell round"><span class="lbl">ROUND</span><span class="val">${roundN}/${total}</span></div>
      </div>`;
  }

  // Hint area
  let hintHtml = '';
  if (c.hintUsed) {
    hintHtml = `<div class="hint show"><span class="hint-label">// HINT</span> ${esc(c.puzzle.clue)}</div>`;
  } else if (!c.locked) {
    const cost = isDaily ? 'free in daily mode' : `−${CONFIG.hintPenalty} pts`;
    hintHtml = `<div class="hint placeholder">stuck? tap <span class="kbd">Hint</span> for the definition (${cost})</div>`;
  }

  // Input vs locked reveal
  let inputAreaHtml;
  if (!c.locked) {
    const hintLabel = c.hintUsed ? '✓ Hint used' : (isDaily ? '? Hint' : `? Hint (−${CONFIG.hintPenalty})`);
    inputAreaHtml = `
      <form id="answer-form" class="answer-form" autocomplete="off">
        <span class="input-prompt">$</span>
        <input
          id="answer-input"
          class="answer-input"
          type="text"
          inputmode="text"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="words"
          spellcheck="false"
          placeholder="type the data jargon..."
          value="${esc(c.inputValue || '')}"
          aria-label="Your answer"
        />
        <span class="caret">█</span>
      </form>
      <div class="actions-row">
        <button type="button" class="btn ghost" id="btn-hint" ${c.hintUsed ? 'disabled' : ''}>${hintLabel}</button>
        <button type="button" class="btn cyan" id="btn-submit">→ Submit (Enter)</button>
      </div>
    `;
  } else {
    inputAreaHtml = '';
  }

  // Feedback / reveal area
  let feedbackHtml = '<div class="feedback" id="feedback">&nbsp;</div>';
  let actionsLockedHtml = '';
  if (c.locked) {
    const term = esc(c.puzzle.term);
    const meaning = esc(c.puzzle.meaning);
    const userAnswer = c.submittedValue ? esc(c.submittedValue) : '(no answer)';

    if (s.lastResult === 'correct') {
      const pts = isDaily ? '' : ` · +${s.lastPointsEarned} pts`;
      feedbackHtml = `
        <div class="reveal correct">
          <div class="reveal-head">✓ CORRECT${pts}</div>
          <div class="reveal-term">${term}</div>
          <div class="reveal-meaning">${meaning}</div>
        </div>`;
    } else if (s.lastResult === 'timeout') {
      feedbackHtml = `
        <div class="reveal wrong">
          <div class="reveal-head">⏱ TIME UP — the answer was</div>
          <div class="reveal-term">${term}</div>
          <div class="reveal-meaning">${meaning}</div>
        </div>`;
    } else {
      feedbackHtml = `
        <div class="reveal wrong">
          <div class="reveal-head">✗ You typed <span class="user-ans">${userAnswer}</span> — the answer was</div>
          <div class="reveal-term">${term}</div>
          <div class="reveal-meaning">${meaning}</div>
        </div>`;
    }
    let nextLabel;
    if (isDaily) {
      nextLabel = '⏹ See results';
    } else {
      nextLabel = (s.lives <= 0 || roundN >= total) ? '⏹ Skip to results' : '→ Next round';
    }
    actionsLockedHtml = `
      <div class="actions-row">
        <button class="btn ghost" id="btn-quit">⏏ Quit</button>
        <button class="btn cyan" id="btn-next">${nextLabel}</button>
      </div>
    `;
  }

  const totalSeconds = isDaily ? CONFIG.dailySeconds : CONFIG.roundSeconds;
  const pctLeft = Math.max(0, c.timeLeftMs / (totalSeconds * 1000)) * 100;
  const warn = c.timeLeftMs <= 6000 ? ' warn' : '';

  const cmd = isDaily ? `daily/${s.dailyMeta?.number ?? ''}` : `round/${roundN}`;
  const promptText = isDaily ? 'today\'s puzzle' : 'the two clues';

  const html = termFrame(`
    ${hudHtml}

    <div class="timer-row">
      <div class="timer-bar"><div class="timer-bar-fill${warn}" id="timer-fill" style="width:${pctLeft}%"></div></div>
    </div>

    <div class="prompt-line"><span class="gp">&gt;</span> <span class="gc">decode</span> ${promptText} → type the data term</div>

    <div class="rebus" aria-label="Rebus puzzle">
      <div class="rebus-icon a" data-label="${esc(c.puzzle.labelA)}"><pre>${esc(c.puzzle.iconA)}</pre></div>
      <div class="rebus-plus">+</div>
      <div class="rebus-icon b" data-label="${esc(c.puzzle.labelB)}"><pre>${esc(c.puzzle.iconB)}</pre></div>
    </div>

    ${hintHtml}
    ${inputAreaHtml}
    ${feedbackHtml}
    ${actionsLockedHtml}

    ${!c.locked ? `<div class="quit-row"><button class="btn ghost tiny" id="btn-quit">⏏ Quit ${isDaily ? 'daily' : 'run'}</button></div>` : ''}
  `, { cmd });

  setHTML(html);
  bindMute(handlers);

  if (!c.locked) {
    const form = document.getElementById('answer-form');
    const input = document.getElementById('answer-input');
    const hintBtn = document.getElementById('btn-hint');
    const submitBtn = document.getElementById('btn-submit');

    input.addEventListener('input', () => {
      c.inputValue = input.value;
      if (handlers.onKeyTick) handlers.onKeyTick();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handlers.onSubmit(input.value);
    });
    submitBtn.addEventListener('click', () => handlers.onSubmit(input.value));
    if (hintBtn && !c.hintUsed) hintBtn.addEventListener('click', handlers.onHint);
    setTimeout(() => input.focus(), 0);
  } else {
    const next = document.getElementById('btn-next');
    if (next) next.addEventListener('click', handlers.onNext);
  }

  const quit = document.getElementById('btn-quit');
  if (quit) quit.addEventListener('click', handlers.onQuit);
}

export function updateTimerBar(timeLeftMs, totalSeconds) {
  const fill = document.getElementById('timer-fill');
  if (!fill) return;
  const totalMs = (totalSeconds || CONFIG.roundSeconds) * 1000;
  const pct = Math.max(0, timeLeftMs / totalMs) * 100;
  fill.style.width = pct + '%';
  if (timeLeftMs <= 6000) fill.classList.add('warn');
  else fill.classList.remove('warn');
}

export function renderGameOver(s, handlers) {
  if (s.mode === 'daily') return renderDailyResult(s, handlers);

  const rank = rankFor(s.score);
  const html = termFrame(`
    <div class="over">
      <h2>// GAME OVER</h2>
      <div class="subtitle">Run complete. The terminal logs you out.</div>

      <div class="final-stats">
        <div class="stat"><div class="num">${s.score}</div><div class="lbl">FINAL SCORE</div></div>
        <div class="stat cyan"><div class="num">${s.correctCount}/${s.deck.length}</div><div class="lbl">CORRECT</div></div>
        <div class="stat yellow"><div class="num">${s.bestStreak}×</div><div class="lbl">BEST STREAK</div></div>
      </div>

      <div class="rank">RANK ▸ <span class="badge">${esc(rank.name)}</span></div>

      <div class="actions-row" style="justify-content:center;">
        <button class="btn ghost" id="btn-home">⌂ Home</button>
        <button class="btn" id="btn-again">↻ Play again</button>
      </div>
    </div>
  `, { cmd: 'results' });

  setHTML(html);
  bindMute(handlers);
  document.getElementById('btn-again').addEventListener('click', handlers.onStart);
  document.getElementById('btn-home').addEventListener('click', handlers.onHome);
}

function renderDailyResult(s, handlers) {
  const meta = s.dailyMeta || {};
  const solved = meta.result === 'correct';
  const heading = solved ? '✓ SOLVED' : '✗ MISSED';
  const headingClass = solved ? 'correct' : 'wrong';
  const term = esc(meta.puzzle || '');
  const share = esc(meta.shareText || '');

  const html = termFrame(`
    <div class="over daily-over">
      <h2 class="${headingClass}">// ${heading}</h2>
      <div class="subtitle">Daily Puzzle <strong>#${meta.number ?? '?'}</strong> · ${esc(meta.dateKey || '')}</div>

      <div class="reveal-term big">${term}</div>
      <div class="reveal-meaning" style="margin: 0 auto 18px; max-width: 520px;">${esc(s.deck[0]?.meaning || '')}</div>

      ${meta.hintUsed ? '<div class="hint show" style="margin: 0 auto 14px; max-width: 520px;"><span class="hint-label">// HINT USED</span></div>' : ''}

      <div class="share-block">
        <div class="share-head">// SHARE YOUR RESULT</div>
        <pre id="share-text" class="share-text">${share}</pre>
        <button class="btn cyan" id="btn-share">⧉ Copy result</button>
        <div class="share-hint">tomorrow's puzzle unlocks at midnight (local time)</div>
      </div>

      <div class="actions-row" style="justify-content:center;">
        <button class="btn ghost" id="btn-home">⌂ Home</button>
        <button class="btn" id="btn-classic">▶ Play classic mode</button>
      </div>
    </div>
  `, { cmd: 'daily/results' });

  setHTML(html);
  bindMute(handlers);
  document.getElementById('btn-home').addEventListener('click', handlers.onHome);
  document.getElementById('btn-classic').addEventListener('click', handlers.onStart);
  const shareBtn = document.getElementById('btn-share');
  shareBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(meta.shareText || '');
      shareBtn.textContent = '✓ Copied!';
      setTimeout(() => { shareBtn.textContent = '⧉ Copy result'; }, 1800);
    } catch {
      shareBtn.textContent = '⚠ Copy failed — select text manually';
    }
  });
}

function bindMute(handlers) {
  const btn = document.getElementById('btn-mute');
  if (btn && handlers.onToggleMute) {
    btn.addEventListener('click', handlers.onToggleMute);
  }
}

function setHTML(html) {
  const root = document.getElementById('app');
  root.innerHTML = html;
}
