// Decision Lab — audio. Web Audio API tones, no external files.
// Mirrors the Mountain Climb audio pattern. All sounds short and
// muted-by-default-respecting.

let ctx = null;
let muted = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  } catch (_) {
    ctx = null;
  }
  return ctx;
}

/**
 * Call this from a click handler (e.g. the PLAY button) to make sure
 * the AudioContext is unlocked from the browser's autoplay policy.
 * Browsers won't let audio play until they see a user gesture.
 */
export function unlock() {
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') {
    c.resume?.();
  }
  // Play an inaudible blip to fully "warm up" iOS / Safari
  try {
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.01);
  } catch (_) { /* ignore */ }
}

export function setMuted(m) {
  muted = !!m;
  if (muted && ctx && ctx.state === 'running') {
    ctx.suspend?.();
  } else if (!muted && ctx && ctx.state === 'suspended') {
    ctx.resume?.();
  }
}

export function isMuted() {
  return muted;
}

function envelope(gain, t0, peak, attack, decay, sustain, sustainLevel, release) {
  gain.gain.cancelScheduledValues(t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.linearRampToValueAtTime(peak * sustainLevel, t0 + attack + decay);
  gain.gain.setValueAtTime(peak * sustainLevel, t0 + attack + decay + sustain);
  gain.gain.linearRampToValueAtTime(0, t0 + attack + decay + sustain + release);
}

function tone({ freq, type = 'sine', peak = 0.2, attack = 0.01, decay = 0.05, sustain = 0.05, sustainLevel = 0.6, release = 0.1, freqEndRamp = null }) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume?.();
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEndRamp != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEndRamp), t0 + attack + decay + sustain + release);
  }
  envelope(gain, t0, peak, attack, decay, sustain, sustainLevel, release);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + attack + decay + sustain + release + 0.02);
}

// ---------- public sounds ----------

/** Soft typing tick when a key is registered. */
export function playKey() {
  tone({ freq: 1200, type: 'square', peak: 0.12, attack: 0.005, decay: 0.02, sustain: 0, sustainLevel: 0.4, release: 0.04 });
}

/** Countdown tick — last few seconds. Punchy enough to grab attention. */
export function playTick() {
  tone({ freq: 880, type: 'square', peak: 0.32, attack: 0.005, decay: 0.04, sustain: 0.03, sustainLevel: 0.5, release: 0.08 });
}

/** Soft confirm when the player picks an MC option. */
export function playPick() {
  tone({ freq: 660, type: 'triangle', peak: 0.30, attack: 0.005, decay: 0.05, sustain: 0.03, sustainLevel: 0.6, release: 0.12 });
}

/** Reveal — answer correct. Ascending two-note chime. */
export function playCorrect() {
  tone({ freq: 660, type: 'triangle', peak: 0.45, attack: 0.005, decay: 0.06, sustain: 0.08, sustainLevel: 0.7, release: 0.20 });
  setTimeout(() => tone({ freq: 990, type: 'triangle', peak: 0.50, attack: 0.005, decay: 0.06, sustain: 0.12, sustainLevel: 0.7, release: 0.26 }), 110);
}

/** Reveal — answer wrong. Descending buzz. */
export function playWrong() {
  tone({ freq: 280, type: 'sawtooth', peak: 0.40, attack: 0.005, decay: 0.06, sustain: 0.14, sustainLevel: 0.7, release: 0.20, freqEndRamp: 110 });
}

/** Round passed — short fanfare. */
export function playRoundWin() {
  tone({ freq: 523, type: 'triangle', peak: 0.42, attack: 0.005, decay: 0.05, sustain: 0.10, sustainLevel: 0.7, release: 0.16 });
  setTimeout(() => tone({ freq: 659, type: 'triangle', peak: 0.42, attack: 0.005, decay: 0.05, sustain: 0.10, sustainLevel: 0.7, release: 0.16 }), 130);
  setTimeout(() => tone({ freq: 784, type: 'triangle', peak: 0.48, attack: 0.005, decay: 0.05, sustain: 0.20, sustainLevel: 0.8, release: 0.26 }), 260);
}

/** Round failed — sad descending. */
export function playRoundFail() {
  tone({ freq: 392, type: 'sine', peak: 0.42, attack: 0.005, decay: 0.06, sustain: 0.14, sustainLevel: 0.7, release: 0.22 });
  setTimeout(() => tone({ freq: 311, type: 'sine', peak: 0.38, attack: 0.005, decay: 0.06, sustain: 0.18, sustainLevel: 0.7, release: 0.26 }), 180);
  setTimeout(() => tone({ freq: 233, type: 'sine', peak: 0.34, attack: 0.005, decay: 0.06, sustain: 0.22, sustainLevel: 0.7, release: 0.32 }), 360);
}

/** Whole game won — triumphant. */
export function playGameWin() {
  const seq = [523, 659, 784, 1047];
  seq.forEach((f, i) => {
    setTimeout(() => tone({ freq: f, type: 'triangle', peak: 0.50, attack: 0.005, decay: 0.06, sustain: 0.20, sustainLevel: 0.8, release: 0.30 }), i * 120);
  });
}

/** Whole game ended (lost on a round) — sad. */
export function playGameLose() {
  const seq = [330, 277, 220];
  seq.forEach((f, i) => {
    setTimeout(() => tone({ freq: f, type: 'sine', peak: 0.42, attack: 0.005, decay: 0.06, sustain: 0.20, sustainLevel: 0.7, release: 0.30 }), i * 170);
  });
}
