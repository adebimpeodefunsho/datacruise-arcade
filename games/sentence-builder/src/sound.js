// Bridge the Data Sentence — synthesized SFX (Web Audio, no assets).
// Matches the chiptune feel used elsewhere in the DataCruise Word Games series.

let ctx = null;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem('datacruise.bridge.muted') === '1'; }
  catch { return false; }
}

function writeMuted() {
  try { localStorage.setItem('datacruise.bridge.muted', muted ? '1' : '0'); }
  catch { /* ignore */ }
}

function getCtx() {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ freq, dur = 0.10, type = 'square', vol = 0.14, slide = 0, attack = 0.004, when = 0 }) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + when;
  const t1 = t0 + dur;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) {
    const endFreq = Math.max(20, freq + slide);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t1);
  }
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t1);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t1 + 0.02);
}

export const sfx = {
  pick() {
    tone({ freq: 660, dur: 0.05, type: 'square', vol: 0.09 });
  },
  place() {
    tone({ freq: 880, dur: 0.06, type: 'triangle', vol: 0.13 });
    tone({ freq: 1175, dur: 0.06, type: 'triangle', vol: 0.10, when: 0.04 });
  },
  returnToBank() {
    tone({ freq: 520, dur: 0.06, type: 'square', vol: 0.08, slide: -120 });
  },
  shuffle() {
    [600, 800, 700, 900].forEach((f, i) => {
      tone({ freq: f, dur: 0.04, type: 'square', vol: 0.08, when: i * 0.035 });
    });
  },
  submit() {
    tone({ freq: 880, dur: 0.05, type: 'square', vol: 0.10 });
    tone({ freq: 1320, dur: 0.07, type: 'triangle', vol: 0.12, when: 0.04 });
  },
  correctRow(i = 0) {
    const base = 523 + i * 60;
    tone({ freq: base, dur: 0.14, type: 'triangle', vol: 0.16 });
    tone({ freq: base * 1.5, dur: 0.14, type: 'triangle', vol: 0.12, when: 0.05 });
  },
  wrongRow() {
    tone({ freq: 280, dur: 0.18, type: 'sawtooth', vol: 0.12, slide: -120 });
  },
  win() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
      tone({ freq: f, dur: 0.18, type: 'triangle', vol: 0.18, when: i * 0.09 });
    });
  },
  partial() {
    [523, 659, 784].forEach((f, i) => {
      tone({ freq: f, dur: 0.16, type: 'triangle', vol: 0.16, when: i * 0.10 });
    });
  },
  timeout() {
    [440, 370, 294, 220].forEach((f, i) => {
      tone({ freq: f, dur: 0.18, type: 'sawtooth', vol: 0.13, when: i * 0.10 });
    });
  },
  gameover() {
    [1047, 1319, 1568, 2093].forEach((f, i) => {
      tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.18, when: i * 0.13 });
    });
  },
};

export function isMuted() { return muted; }

export function toggleMuted() {
  muted = !muted;
  writeMuted();
  if (muted && ctx) {
    try { ctx.suspend(); } catch {}
  } else if (!muted && ctx) {
    try { ctx.resume(); } catch {}
  }
  return muted;
}
