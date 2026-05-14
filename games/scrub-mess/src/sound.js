// Scrub the Data Mess — synthesized SFX (Web Audio, no assets).
// Square + triangle waves and short noise bursts for trash whooshes.
// Mute state persists in localStorage.

let ctx = null;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem('datacruise.scrub.muted') === '1'; }
  catch { return false; }
}

function writeMuted() {
  try { localStorage.setItem('datacruise.scrub.muted', muted ? '1' : '0'); }
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

function noiseBurst({ dur = 0.08, vol = 0.10, when = 0, cutoff = 1500 }) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + when;
  const samples = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, samples, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export const sfx = {
  // Picking up an item (subtle blip).
  pick() {
    tone({ freq: 880, dur: 0.04, type: 'square', vol: 0.08 });
  },
  // Trashing a messy item — whoosh + clunk.
  trash() {
    noiseBurst({ dur: 0.18, vol: 0.10, cutoff: 1200 });
    tone({ freq: 320, dur: 0.08, type: 'triangle', vol: 0.16, when: 0.10 });
    tone({ freq: 180, dur: 0.10, type: 'square',  vol: 0.13, when: 0.14, slide: -60 });
  },
  // Wrong — trashed a clean term.
  wrong() {
    tone({ freq: 280, dur: 0.18, type: 'sawtooth', vol: 0.16, slide: -120 });
    noiseBurst({ dur: 0.10, vol: 0.06, cutoff: 700, when: 0.03 });
  },
  // Timer tick under 10s.
  tick() {
    tone({ freq: 1200, dur: 0.03, type: 'square', vol: 0.06 });
  },
  // Streak milestone (e.g., 5 in a row).
  streak() {
    tone({ freq: 988, dur: 0.08, type: 'square', vol: 0.13 });
    tone({ freq: 1318, dur: 0.10, type: 'square', vol: 0.13, when: 0.05 });
  },
  // Time's up.
  timeout() {
    [440, 370, 294, 220].forEach((f, i) => {
      tone({ freq: f, dur: 0.18, type: 'sawtooth', vol: 0.14, when: i * 0.10 });
    });
  },
  // Round complete — bright fanfare.
  win() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
      tone({ freq: f, dur: 0.18, type: 'triangle', vol: 0.18, when: i * 0.09 });
    });
  },
  // Round complete with imperfect score — softer cadence.
  done() {
    [659, 784, 1047].forEach((f, i) => {
      tone({ freq: f, dur: 0.18, type: 'triangle', vol: 0.16, when: i * 0.10 });
    });
  },
  // Button click in menus.
  click() {
    tone({ freq: 520, dur: 0.05, type: 'square', vol: 0.10 });
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
