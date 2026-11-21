import type { Rng } from '@/shared/random';

import { DIRECTION_VECTORS } from './directions';
import type { NormalizedWord } from './normalize';
import type { Direction, PlacedWord } from './types';

/**
 * Search effort, counted in search steps (not time) so the same seed gives the same
 * puzzle on every device.
 */
export const SOLUTION_STEP_BUDGET = 60_000;
/** Steps per restart: a fresh random order escapes dead ends faster than deep backtracking. */
const STEPS_PER_RESTART = 2_000;
/** Options tried per cell before backtracking further up. */
const MAX_BRANCHES = 3;
/**
 * Weight of optional (extra) words relative to required ones: required words are placed
 * early while there is room, extra words mostly fill the gaps that remain.
 */
const EXTRA_WEIGHT = 0.05;
/**
 * Diagonal words leave stair-step gaps that are hard to fill exactly. After each failed
 * restart diagonals become less likely, so the search drifts towards layouts that fit.
 */
const DIAGONAL_DECAY = 0.8;
const DIAGONALS: ReadonlySet<Direction> = new Set<Direction>(['SE', 'NE', 'NW', 'SW']);

/** Search grid values besides letter char codes. */
const EMPTY = 0;
const FREE = -1;

export interface SolutionLayout {
  /** Word letters per cell; null = a cell for the solution. */
  cells: (string | null)[];
  /** Placed words: all required words plus the extra words that were used. */
  placed: PlacedWord[];
}

export interface SolutionLayoutInput {
  width: number;
  height: number;
  directions: readonly Direction[];
  /** Words that must all be placed. */
  words: readonly NormalizedWord[];
  /** Words that may be added to fill the grid (e.g. the rest of the theme). */
  extras?: readonly NormalizedWord[];
  /** Number of cells that must stay free. */
  leftover: number;
  rng: Rng;
  /**
   * Can reject a finished layout (e.g. when the solution letters would form an extra copy
   * of a word); the search then continues.
   */
  isValid?: (layout: SolutionLayout) => boolean;
}

interface Option {
  word: number;
  row: number;
  col: number;
  direction: Direction;
  overlap: number;
}

/**
 * Lays out the words so that exactly `leftover` cells stay free (for the solution letters).
 *
 * Cell-driven backtracking: the first undecided cell (row by row) is either covered by a
 * word or kept free. Options are tried in weighted random order (required, longer and
 * overlapping words first), with a few branches per cell and frequent restarts. Returns
 * null when no layout is found within the step budget.
 */
export function placeWithSolution({
  width,
  height,
  directions,
  words: required,
  extras = [],
  leftover,
  rng,
  isValid = () => true,
}: SolutionLayoutInput): SolutionLayout | null {
  const words = [...required, ...extras];
  const isExtra = (w: number) => w >= required.length;
  const total = width * height;
  // Search grid as char codes for speed: EMPTY, FREE (kept for the solution) or a letter.
  const grid = new Int32Array(total);
  const codes = words.map((w) => Array.from(w.letters, (c) => c.charCodeAt(0)));
  const used = new Array<boolean>(words.length).fill(false);
  const placed: PlacedWord[] = [];
  const totalLetters = words.reduce((sum, w) => sum + w.letters.length, 0);
  const vectors = directions.map((direction) => ({ direction, ...DIRECTION_VECTORS[direction] }));

  let steps = 0;
  let restartAt = 0;
  let diagonalWeight = 1;

  const toCells = (): (string | null)[] =>
    Array.from(grid, (code) => (code > 0 ? String.fromCharCode(code) : null));

  /** Placements of unused words that cover cell `index`. */
  const optionsFor = (index: number): Option[] => {
    const row = Math.floor(index / width);
    const col = index % width;
    const options: Option[] = [];
    for (let w = 0; w < words.length; w++) {
      if (used[w]) continue;
      const letters = codes[w]!;
      const length = letters.length;
      for (const { direction, dRow, dCol } of vectors) {
        const step = dRow * width + dCol;
        for (let at = 0; at < length; at++) {
          const startRow = row - dRow * at;
          const startCol = col - dCol * at;
          const endRow = startRow + dRow * (length - 1);
          const endCol = startCol + dCol * (length - 1);
          if (startRow < 0 || startRow >= height || endRow < 0 || endRow >= height) continue;
          if (startCol < 0 || startCol >= width || endCol < 0 || endCol >= width) continue;
          let overlap = 0;
          let cell = startRow * width + startCol;
          let i = 0;
          for (; i < length; i++, cell += step) {
            const code = grid[cell]!;
            if (code === EMPTY) continue;
            if (code !== letters[i]) break; // also rejects FREE cells
            overlap++;
          }
          if (i === length)
            options.push({ word: w, row: startRow, col: startCol, direction, overlap });
        }
      }
    }
    return options;
  };

  /** Options for this cell in weighted random order; null = keep the cell free. */
  const orderedChoices = (index: number, undecided: number, free: number) => {
    // Efraimidis–Spirakis: key = u^(1/weight), highest first.
    let totalWeight = 0;
    const keyed = optionsFor(index).map((option) => {
      const length = words[option.word]!.letters.length;
      const weight =
        length *
        length *
        (1 + 2 * option.overlap) *
        (DIAGONALS.has(option.direction) ? diagonalWeight : 1) *
        (isExtra(option.word) ? EXTRA_WEIGHT : 1);
      totalWeight += weight;
      return { choice: option as Option | null, key: rng() ** (1 / weight) };
    });
    if (free < leftover) {
      // Keep this cell free about as often as free cells are still needed.
      const share = (leftover - free) / undecided;
      const weight = share >= 1 || totalWeight === 0 ? 1 : (share * totalWeight) / (1 - share);
      keyed.push({ choice: null, key: rng() ** (1 / weight) });
    }
    keyed.sort((a, b) => b.key - a.key);
    return keyed.slice(0, MAX_BRANCHES).map((k) => k.choice);
  };

  const search = (
    from: number,
    undecided: number,
    free: number,
    lettersLeft: number,
    requiredLeft: number,
  ): boolean => {
    if (++steps > restartAt) return false;

    const toCover = undecided - (leftover - free);
    // Each remaining required word adds at least one new cell; all unused words together
    // can add at most all of their letters.
    if (toCover < requiredLeft || toCover > lettersLeft) return false;
    if (undecided === 0) {
      return requiredLeft === 0 && isValid({ cells: toCells(), placed: [...placed] });
    }
    let index = from;
    while (grid[index] !== EMPTY) index++;

    for (const choice of orderedChoices(index, undecided, free)) {
      if (choice === null) {
        grid[index] = FREE;
        if (search(index + 1, undecided - 1, free + 1, lettersLeft, requiredLeft)) return true;
        grid[index] = EMPTY;
        continue;
      }
      const word = words[choice.word]!;
      const letters = codes[choice.word]!;
      const length = letters.length;
      const { dRow, dCol } = DIRECTION_VECTORS[choice.direction];
      const written: number[] = [];
      for (let i = 0; i < length; i++) {
        const at = (choice.row + dRow * i) * width + choice.col + dCol * i;
        if (grid[at] === EMPTY) {
          grid[at] = letters[i]!;
          written.push(at);
        }
      }
      used[choice.word] = true;
      placed.push({
        display: word.display,
        letters: word.letters,
        row: choice.row,
        col: choice.col,
        direction: choice.direction,
        length,
      });
      const found = search(
        index + 1,
        undecided - written.length,
        free,
        lettersLeft - length,
        requiredLeft - (isExtra(choice.word) ? 0 : 1),
      );
      if (found) return true;
      placed.pop();
      used[choice.word] = false;
      for (const at of written) grid[at] = EMPTY;
    }
    return false;
  };

  while (steps < SOLUTION_STEP_BUDGET) {
    restartAt = Math.min(steps + STEPS_PER_RESTART, SOLUTION_STEP_BUDGET);
    if (search(0, total, 0, totalLetters, required.length)) {
      return { cells: toCells(), placed };
    }
    diagonalWeight *= DIAGONAL_DECAY;
    grid.fill(EMPTY);
    used.fill(false);
    placed.length = 0;
  }
  return null;
}
