import type { Rng } from '@/shared/random';

/** Approximate letter frequencies (%) in Dutch text. */
const DUTCH_FREQUENCIES: Readonly<Record<string, number>> = {
  E: 18.9,
  N: 10.0,
  A: 7.5,
  T: 6.8,
  I: 6.5,
  R: 6.4,
  O: 6.1,
  D: 5.9,
  S: 3.7,
  L: 3.6,
  G: 3.4,
  V: 2.85,
  H: 2.4,
  K: 2.25,
  M: 2.2,
  U: 2.0,
  B: 1.6,
  P: 1.6,
  W: 1.5,
  J: 1.5,
  Z: 1.4,
  C: 1.2,
  F: 0.8,
  X: 0.04,
  Y: 0.035,
  Q: 0.01,
};

// Flattened with a square root: raw frequencies (~19% E) make grids look odd and easier.
const LETTERS = Object.keys(DUTCH_FREQUENCIES);
const CUMULATIVE: number[] = (() => {
  let sum = 0;
  return LETTERS.map((letter) => (sum += Math.sqrt(DUTCH_FREQUENCIES[letter] ?? 0)));
})();
const TOTAL = CUMULATIVE[CUMULATIVE.length - 1] ?? 1;

/** Returns a random uppercase letter, weighted towards common Dutch letters. */
export function randomFillLetter(rng: Rng): string {
  const target = rng() * TOTAL;
  const index = CUMULATIVE.findIndex((value) => target < value);
  return LETTERS[index === -1 ? LETTERS.length - 1 : index] ?? 'E';
}
