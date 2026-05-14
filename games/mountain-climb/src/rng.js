// Seeded RNG (Mulberry32) + 4-char base36 seed codes.
// Deterministic — same seed code = same weather sequence + same dice rolls.

/** Convert any string to a 32-bit seed. */
export function seedFromString(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

/** Mulberry32 PRNG. Returns a function that yields floats in [0, 1). */
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a 4-char base36 share code, e.g. "A7K9". */
export function generateSeedCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/1/I/O for legibility
  let s = "";
  for (let i = 0; i < 4; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

/** Integer in [min, max] inclusive, using a 0–1 random source. */
export function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
