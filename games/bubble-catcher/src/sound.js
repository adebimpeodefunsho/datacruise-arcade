// Web Audio SFX — synthesised, no external assets.
// Lazy AudioContext, started inside the first user gesture.

let ctx = null;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem("datacruise.bubblecatcher.muted") === "1"; }
  catch { return false; }
}

function writeMuted() {
  try { localStorage.setItem("datacruise.bubblecatcher.muted", muted ? "1" : "0"); }
  catch { /* ignore */ }
}

function getCtx() {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ freq, dur = 0.12, type = "sine", vol = 0.18, slide = 0, attack = 0.005, when = 0 }) {
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

function noise({ dur = 0.12, vol = 0.15, when = 0, cutoff = 1200 }) {
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
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export const sfx = {
  // Quick tug — fires every time the player pulls a string.
  pull() {
    tone({ freq: 520, dur: 0.06, type: "square", vol: 0.10, slide: -120 });
  },
  // Bubble snapped into its slot — bright triad.
  catch() {
    tone({ freq: 659, dur: 0.10, type: "triangle", vol: 0.17 });
    tone({ freq: 988, dur: 0.10, type: "triangle", vol: 0.16, when: 0.06 });
    tone({ freq: 1319, dur: 0.16, type: "triangle", vol: 0.14, when: 0.13 });
  },
  // Wrong string pulled — soft thud.
  wrong() {
    tone({ freq: 230, dur: 0.13, type: "sawtooth", vol: 0.12, slide: -50 });
  },
  // Bubble fell past the floor.
  miss() {
    tone({ freq: 180, dur: 0.22, type: "sawtooth", vol: 0.13, slide: -90 });
    noise({ dur: 0.12, vol: 0.08, cutoff: 500 });
  },
  // All slots filled.
  win() {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      tone({ freq, dur: 0.18, type: "triangle", vol: 0.18, when: i * 0.10 });
    });
  },
  // Out of misses or out of time.
  lose() {
    [392, 330, 262].forEach((freq, i) => {
      tone({ freq, dur: 0.22, type: "sawtooth", vol: 0.14, when: i * 0.15 });
    });
  },
};

export function isMuted() { return muted; }

export function toggleMuted() {
  muted = !muted;
  writeMuted();
  return muted;
}
