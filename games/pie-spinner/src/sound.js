// Web Audio SFX — synthesised, no external assets.
// AudioContext is created lazily inside the first user gesture (a click), so
// browsers allow it to start.

let ctx = null;
let muted = readMuted();
let spinTickerId = null;

function readMuted() {
  try { return localStorage.getItem("datacruise.piespinner.muted") === "1"; }
  catch { return false; }
}

function writeMuted() {
  try { localStorage.setItem("datacruise.piespinner.muted", muted ? "1" : "0"); }
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
  // Quick click for the SPIN button press.
  press() {
    tone({ freq: 380, dur: 0.05, type: "square", vol: 0.10 });
  },
  // Single tick — fires per wedge passing the pointer while the wheel is spinning.
  tick() {
    tone({ freq: 720, dur: 0.025, type: "square", vol: 0.07 });
  },
  // Slice came alive — bright major arpeggio.
  match() {
    tone({ freq: 659, dur: 0.10, type: "triangle", vol: 0.16 });
    tone({ freq: 880, dur: 0.10, type: "triangle", vol: 0.16, when: 0.07 });
    tone({ freq: 1318, dur: 0.16, type: "triangle", vol: 0.14, when: 0.14 });
  },
  // Wedge value didn't match any unlit slice.
  miss() {
    tone({ freq: 220, dur: 0.18, type: "sawtooth", vol: 0.12, slide: -80 });
    noise({ dur: 0.10, vol: 0.07, cutoff: 600 });
  },
  // Wedge value matched a slice that's already lit — soft "uh-oh" tone.
  alreadyLit() {
    tone({ freq: 440, dur: 0.10, type: "sine", vol: 0.13 });
    tone({ freq: 370, dur: 0.20, type: "sine", vol: 0.12, when: 0.09 });
  },
  // Final win — ascending fanfare.
  win() {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      tone({ freq, dur: 0.18, type: "triangle", vol: 0.18, when: i * 0.10 });
    });
  },
  // Final lose — descending sad tones.
  lose() {
    [392, 330, 262].forEach((freq, i) => {
      tone({ freq, dur: 0.22, type: "sawtooth", vol: 0.14, when: i * 0.15 });
    });
  },
};

/** Start the per-wedge tick ticker. Polls the current wedge index and ticks on change. */
export function startSpinTicker(getWedgeIdx) {
  stopSpinTicker();
  let last = getWedgeIdx();
  spinTickerId = setInterval(() => {
    const cur = getWedgeIdx();
    if (cur !== last) {
      sfx.tick();
      last = cur;
    }
  }, 16);
}

export function stopSpinTicker() {
  if (spinTickerId != null) clearInterval(spinTickerId);
  spinTickerId = null;
}

export function isMuted() { return muted; }

export function toggleMuted() {
  muted = !muted;
  writeMuted();
  return muted;
}
