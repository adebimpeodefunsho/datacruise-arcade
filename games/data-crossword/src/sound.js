// Crack the Data Crossword — synthesized SFX (Web Audio, no assets).
// Same chiptune feel as the other Word Games. Mute persists in localStorage.

let ctx = null;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem('datacruise.crossword.muted') === '1'; }
  catch { return false; }
}

function writeMuted() {
  try { localStorage.setItem('datacruise.crossword.muted', muted ? '1' : '0'); }
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

function keyFreq() {
  return 1400 + Math.floor(Math.random() * 400);
}

export const sfx = {
  key() {
    tone({ freq: keyFreq(), dur: 0.018, type: 'square', vol: 0.05 });
  },
  wordFound() {
    [659, 880, 1175, 1568].forEach((f, i) => {
      tone({ freq: f, dur: 0.13, type: 'triangle', vol: 0.16, when: i * 0.05 });
    });
  },
  wrong() {
    tone({ freq: 280, dur: 0.18, type: 'sawtooth', vol: 0.12, slide: -120 });
  },
  clueSelect() {
    tone({ freq: 720, dur: 0.05, type: 'square', vol: 0.09 });
  },
  timeout() {
    [440, 370, 294, 220].forEach((f, i) => {
      tone({ freq: f, dur: 0.18, type: 'sawtooth', vol: 0.13, when: i * 0.10 });
    });
  },
  gameover() {
    [523, 466, 392, 294].forEach((f, i) => {
      tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.15, when: i * 0.13 });
    });
  },
  win() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
      tone({ freq: f, dur: 0.18, type: 'triangle', vol: 0.18, when: i * 0.09 });
    });
  }
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
