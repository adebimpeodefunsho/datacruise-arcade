// Web Audio SFX — synthesised, no external assets.
// AudioContext is created lazily inside the first user gesture (a click), so
// browsers allow it to start.

let ctx = null;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem("datacruise.dashdrop.muted") === "1"; }
  catch { return false; }
}

function writeMuted() {
  try { localStorage.setItem("datacruise.dashdrop.muted", muted ? "1" : "0"); }
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
  // A chart just spawned at the top of the column.
  spawn() {
    tone({ freq: 520, dur: 0.06, type: "sine", vol: 0.08 });
  },
  // Deploy button pressed — a soft click.
  press() {
    tone({ freq: 380, dur: 0.05, type: "square", vol: 0.10 });
  },
  // Correct catch — chart locks into its slot.
  lock() {
    tone({ freq: 659, dur: 0.10, type: "triangle", vol: 0.16 });
    tone({ freq: 880, dur: 0.10, type: "triangle", vol: 0.16, when: 0.07 });
    tone({ freq: 1318, dur: 0.16, type: "triangle", vol: 0.14, when: 0.14 });
  },
  // Wrong deploy or missed-correct — crashing chart distorts the dashboard.
  crash() {
    tone({ freq: 220, dur: 0.22, type: "sawtooth", vol: 0.14, slide: -90 });
    noise({ dur: 0.18, vol: 0.10, cutoff: 700 });
  },
  // Junk chart faded out gently — used for the rare real-chart-completes-
  // dashboard force-dissolve case. Keep it subtle.
  dissolve() {
    tone({ freq: 440, dur: 0.08, type: "sine", vol: 0.06 });
    noise({ dur: 0.10, vol: 0.04, cutoff: 1800 });
  },
  // Bug-Bug crunches a decoy. Apple-bite / chip-bite texture:
  //   1. SNAP  — sharp, bright noise burst at the moment of impact
  //   2. CRUNCH — dense rapid high-frequency noise grains over ~200ms,
  //               cutoffs jittering 1600-4000 Hz so it reads as "crisp"
  //               rather than "thud"
  // Volumes are deliberately loud — this is the player's reward for
  // correctly letting a decoy fall through.
  chomp() {
    // Initial bright snap (skin breaking / chip shattering)
    noise({ dur: 0.055, vol: 0.55, cutoff: 5500 });
    noise({ dur: 0.045, vol: 0.42, cutoff: 3800, when: 0.012 });
    // Crunch texture — alternating high-and-mid cutoffs for chip-bite crispness
    const grains = [
      { when: 0.030, vol: 0.42, cutoff: 4200 },
      { when: 0.050, vol: 0.38, cutoff: 3000 },
      { when: 0.070, vol: 0.40, cutoff: 3800 },
      { when: 0.092, vol: 0.34, cutoff: 2600 },
      { when: 0.115, vol: 0.32, cutoff: 3200 },
      { when: 0.142, vol: 0.26, cutoff: 2200 },
      { when: 0.172, vol: 0.20, cutoff: 1800 },
      { when: 0.205, vol: 0.14, cutoff: 1500 },
    ];
    grains.forEach((g) => noise({ dur: 0.025, vol: g.vol, cutoff: g.cutoff, when: g.when }));
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

export function isMuted() { return muted; }

export function toggleMuted() {
  muted = !muted;
  writeMuted();
  return muted;
}
