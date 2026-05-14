// Sound effects via Web Audio API — no asset files, fully synthesised.
// Browsers require a user gesture before audio plays; we lazy-init the
// AudioContext on the first call (which is always inside a click handler).

let ctx = null;
let masterGain = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.5;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(m) {
  muted = !!m;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

// ADSR helper. Sets up a clean attack/decay/sustain/release envelope on a GainNode.
function envelope(gain, t0, peak, attack, decay, sustain, sustainLevel, release) {
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.linearRampToValueAtTime(sustainLevel, t0 + attack + decay);
  gain.gain.setValueAtTime(sustainLevel, t0 + attack + decay + sustain);
  gain.gain.linearRampToValueAtTime(0, t0 + attack + decay + sustain + release);
}

function noiseBuffer(c, durationSec) {
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * durationSec), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// ---------------- Rest: snoring ----------------
// Two slow breaths — low sawtooth swept up then back down, with a low-pass filter
// to round it off. ~1.3 s total.
export function playRest() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;

  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(70, t);
  osc.frequency.linearRampToValueAtTime(115, t + 0.35);
  osc.frequency.linearRampToValueAtTime(70, t + 0.65);
  osc.frequency.linearRampToValueAtTime(115, t + 0.95);
  osc.frequency.linearRampToValueAtTime(70, t + 1.25);

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(240, t);
  filter.frequency.linearRampToValueAtTime(360, t + 0.5);
  filter.frequency.linearRampToValueAtTime(240, t + 1.25);
  filter.Q.value = 4;

  const gain = c.createGain();
  envelope(gain, t, 0.22, 0.08, 0.12, 0.85, 0.15, 0.2);

  osc.connect(filter).connect(gain).connect(masterGain);
  osc.start(t);
  osc.stop(t + 1.45);
}

// ---------------- Climb: footsteps ----------------
// Two short noise crunches band-passed around 250 Hz.
export function playClimb() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 2; i++) {
    const start = t + i * 0.16;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.1);

    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 230;
    filter.Q.value = 1.2;

    const gain = c.createGain();
    envelope(gain, start, 0.5, 0.005, 0.05, 0.0, 0.0, 0.05);

    src.connect(filter).connect(gain).connect(masterGain);
    src.start(start);
    src.stop(start + 0.12);
  }
}

// ---------------- Sprint: whoosh + quick steps ----------------
// Filter-swept noise plus three rapid steps. ~0.55 s.
export function playSprint() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;

  // Whoosh — band-pass noise swept up then back down.
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.55);

  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(280, t);
  filter.frequency.linearRampToValueAtTime(1800, t + 0.28);
  filter.frequency.linearRampToValueAtTime(400, t + 0.55);
  filter.Q.value = 4;

  const gain = c.createGain();
  envelope(gain, t, 0.4, 0.05, 0.12, 0.18, 0.3, 0.15);

  src.connect(filter).connect(gain).connect(masterGain);
  src.start(t);
  src.stop(t + 0.6);

  // Rapid step trio
  for (let i = 0; i < 3; i++) {
    const s2 = t + 0.05 + i * 0.1;
    const stepSrc = c.createBufferSource();
    stepSrc.buffer = noiseBuffer(c, 0.06);
    const stepFilter = c.createBiquadFilter();
    stepFilter.type = "bandpass";
    stepFilter.frequency.value = 280;
    stepFilter.Q.value = 1;
    const stepGain = c.createGain();
    envelope(stepGain, s2, 0.35, 0.003, 0.03, 0.0, 0.0, 0.03);
    stepSrc.connect(stepFilter).connect(stepGain).connect(masterGain);
    stepSrc.start(s2);
    stepSrc.stop(s2 + 0.08);
  }
}

// ---------------- Stamina drain: descending sine ----------------
export function playStaminaDrain() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime + 0.05; // slight delay so it stacks after the action sound

  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(620, t);
  osc.frequency.exponentialRampToValueAtTime(160, t + 0.45);

  const gain = c.createGain();
  envelope(gain, t, 0.22, 0.02, 0.05, 0.2, 0.2, 0.18);

  osc.connect(gain).connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.55);
}

// ---------------- Stamina gain: bright two-note sparkle ----------------
export function playStaminaGain() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime + 0.05;

  const notes = [520, 780, 1040]; // C E A-ish — bright, ascending
  notes.forEach((freq, i) => {
    const start = t + i * 0.07;
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);

    const gain = c.createGain();
    envelope(gain, start, 0.28, 0.005, 0.05, 0.05, 0.18, 0.12);

    osc.connect(gain).connect(masterGain);
    osc.start(start);
    osc.stop(start + 0.32);
  });
}

// ---------------- Win: ascending arpeggio + tag ----------------
export function playWin() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;

  // C major + extension: C E G C high E high G
  const notes = [262, 330, 392, 523, 659, 784];
  notes.forEach((freq, i) => {
    const start = t + i * 0.12;
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);

    const gain = c.createGain();
    envelope(gain, start, 0.32, 0.02, 0.05, 0.1, 0.28, 0.25);

    osc.connect(gain).connect(masterGain);
    osc.start(start);
    osc.stop(start + 0.5);
  });

  // Triumph chord at the end
  const tagStart = t + notes.length * 0.12 + 0.05;
  [523, 659, 784].forEach((freq) => {
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, tagStart);
    const gain = c.createGain();
    envelope(gain, tagStart, 0.26, 0.02, 0.05, 0.4, 0.25, 0.3);
    osc.connect(gain).connect(masterGain);
    osc.start(tagStart);
    osc.stop(tagStart + 0.85);
  });
}

// ---------------- Lose: minor descending ----------------
export function playLose() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;

  const notes = [392, 349, 311, 262]; // G F Eb C — sad walk down
  notes.forEach((freq, i) => {
    const start = t + i * 0.2;
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);

    const gain = c.createGain();
    envelope(gain, start, 0.3, 0.03, 0.08, 0.2, 0.25, 0.22);

    osc.connect(gain).connect(masterGain);
    osc.start(start);
    osc.stop(start + 0.7);
  });
}
