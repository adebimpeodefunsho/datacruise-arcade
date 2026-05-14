// Derive the Data Jargon — synthesized SFX (Web Audio, no assets).
// Terminal/chiptune feel — square + triangle waves, short envelopes.
// Mute state persists in localStorage.

let ctx = null;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem('datacruise.jargon.muted') === '1'; }
  catch { return false; }
}

function writeMuted() {
  try { localStorage.setItem('datacruise.jargon.muted', muted ? '1' : '0'); }
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

// Pick a slightly randomized "tick" frequency so typing doesn't sound monotone.
function keyFreq() {
  // Around 1.4–1.8 kHz, like a soft mechanical keyboard
  return 1400 + Math.floor(Math.random() * 400);
}

export const sfx = {
  // Per-character key click
  key() {
    tone({ freq: keyFreq(), dur: 0.018, type: 'square', vol: 0.05 });
  },
  // Hint reveal — short ascending arpeggio
  hint() {
    tone({ freq: 660, dur: 0.10, type: 'triangle', vol: 0.14 });
    tone({ freq: 880, dur: 0.12, type: 'triangle', vol: 0.13, when: 0.06 });
  },
  // Submit press
  submit() {
    tone({ freq: 520, dur: 0.05, type: 'square', vol: 0.10 });
  },
  // Correct — bright triumphant arpeggio
  correct() {
    [659, 880, 1175, 1568].forEach((f, i) => {
      tone({ freq: f, dur: 0.14, type: 'triangle', vol: 0.16, when: i * 0.06 });
    });
  },
  // Wrong — descending sawtooth + soft noise
  wrong() {
    tone({ freq: 280, dur: 0.20, type: 'sawtooth', vol: 0.14, slide: -120 });
    noiseBurst({ dur: 0.10, vol: 0.05, cutoff: 700, when: 0.04 });
  },
  // Timeout — slower descending wail
  timeout() {
    [440, 370, 294, 220].forEach((f, i) => {
      tone({ freq: f, dur: 0.18, type: 'sawtooth', vol: 0.13, when: i * 0.10 });
    });
  },
  // Game over — short minor cadence
  gameover() {
    [523, 466, 392, 294].forEach((f, i) => {
      tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.15, when: i * 0.13 });
    });
  },
  // Win run — bright fanfare
  win() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
      tone({ freq: f, dur: 0.18, type: 'triangle', vol: 0.18, when: i * 0.09 });
    });
  },
  // Streak milestone
  streak() {
    tone({ freq: 988, dur: 0.08, type: 'square', vol: 0.13 });
    tone({ freq: 1318, dur: 0.10, type: 'square', vol: 0.13, when: 0.05 });
  }
};

export function isMuted() { return muted; }

export function toggleMuted() {
  muted = !muted;
  writeMuted();
  if (muted && ctx) {
    // Silence anything currently scheduled by suspending immediately.
    try { ctx.suspend(); } catch {}
  } else if (!muted && ctx) {
    try { ctx.resume(); } catch {}
  }
  return muted;
}
