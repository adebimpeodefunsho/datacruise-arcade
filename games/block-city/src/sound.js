// Web Audio SFX — synthesized, no external assets.
// First call to any sfx.* lazily creates the AudioContext, so it must happen
// from inside a user gesture (handled because the first sound fires after a
// click — start game or catch block during a started game).

let ctx = null;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem("datacruise.blockcity.muted") === "1"; }
  catch { return false; }
}

function writeMuted() {
  try { localStorage.setItem("datacruise.blockcity.muted", muted ? "1" : "0"); }
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
  // Bright upward pop when Bug-Bug catches a block.
  catch() {
    tone({ freq: 520, dur: 0.07, type: "triangle", vol: 0.14, slide: 240 });
  },
  // Heavier "block lands" — used per-block when dropping a stack.
  dropOne(index = 0) {
    const base = 200 - index * 6;
    tone({ freq: base, dur: 0.09, type: "square", vol: 0.16, slide: -40, when: index * 0.04 });
    noise({ dur: 0.06, vol: 0.08, when: index * 0.04, cutoff: 800 });
  },
  // Plot reaches its target — short major arpeggio sparkle.
  lock() {
    tone({ freq: 659, dur: 0.10, type: "triangle", vol: 0.15 });
    tone({ freq: 880, dur: 0.10, type: "triangle", vol: 0.15, when: 0.07 });
    tone({ freq: 1318, dur: 0.14, type: "triangle", vol: 0.13, when: 0.14 });
  },
  // Single floor removed.
  demolish() {
    tone({ freq: 180, dur: 0.16, type: "sawtooth", vol: 0.16, slide: -90 });
    noise({ dur: 0.10, vol: 0.10, cutoff: 600 });
  },
  // Block hits ground without being caught — muted thud.
  miss() {
    tone({ freq: 130, dur: 0.14, type: "sine", vol: 0.10, slide: -40 });
    noise({ dur: 0.08, vol: 0.06, cutoff: 400 });
  },
  // Carrying capacity just hit max — gentle nudge.
  carryMax() {
    tone({ freq: 980, dur: 0.05, type: "square", vol: 0.10 });
  },
  // Final win fanfare — quick ascending arpeggio.
  win() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      tone({ freq, dur: 0.16, type: "triangle", vol: 0.18, when: i * 0.10 });
    });
  },
  // Final lose — descending sad tones.
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
