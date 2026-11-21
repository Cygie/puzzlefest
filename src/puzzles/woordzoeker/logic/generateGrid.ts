import { createRng, type Rng, shuffle } from '@/shared/random';

import { ALL_DIRECTIONS, DIRECTION_VECTORS, DIRECTIONS_BY_DIFFICULTY } from './directions';
import { randomFillLetter } from './letterFrequency';
import { type NormalizedWord, toGridLetters } from './normalize';
import type {
  Direction,
  GenerateInput,
  GenerateResult,
  PlacedWord,
  Puzzle,
  PuzzleSolution,
  UnplacedWord,
} from './types';

export const MIN_SIZE = 5;
export const MAX_SIZE = 20;
/** Fixed (not time-based) so the same seed gives the same puzzle on every device. */
export const MAX_ATTEMPTS = 30;
/** A hidden solution needs an almost full grid with an exact cell count: allow more tries. */
export const MAX_SOLUTION_ATTEMPTS = 300;
/** Times the random filler is redrawn to remove accidental duplicate words. */
const MAX_REFILLS = 10;
/** Words shorter than this are not checked for accidental duplicates (they occur too easily). */
const MIN_DUPLICATE_CHECK_LENGTH = 3;

type Cells = (string | null)[];

interface Candidate {
  row: number;
  col: number;
  direction: Direction;
  overlap: number;
}

interface Attempt {
  cells: Cells;
  placed: PlacedWord[];
  unplaced: UnplacedWord[];
  /** Solution mode only: the exact coverage became unreachable, placement stopped early. */
  aborted: boolean;
}

export type SolutionFit =
  | { ok: true; letters: string; requiredOverlap: number }
  | { ok: false; code: 'invalid' | 'too-long' | 'too-few-letters'; reason: string };

/**
 * Checks up front whether a hidden solution can work: the words must cover exactly
 * `width × height − solution length` cells. Fails when the words have too few letters
 * to cover that many cells (overlaps can only reduce coverage).
 */
export function checkSolutionFit(
  words: readonly NormalizedWord[],
  width: number,
  height: number,
  solution: string,
): SolutionFit {
  const letters = toGridLetters(solution);
  if (!/^[A-Z]+$/.test(letters)) {
    return { ok: false, code: 'invalid', reason: 'De oplossing mag alleen letters bevatten.' };
  }
  const total = width * height;
  if (letters.length >= total) {
    return {
      ok: false,
      code: 'too-long',
      reason: `De oplossing (${letters.length} letters) is te lang voor een raster van ${width}×${height}.`,
    };
  }
  const toCover = total - letters.length;
  const wordLetters = words.reduce((sum, word) => sum + word.letters.length, 0);
  if (wordLetters < toCover) {
    return {
      ok: false,
      code: 'too-few-letters',
      reason:
        `De woorden hebben samen ${wordLetters} letters, maar er moeten ${toCover} vakjes gevuld ` +
        `worden zodat er precies ${letters.length} overblijven voor de oplossing. ` +
        'Voeg woorden toe, maak het raster kleiner of gebruik een langere oplossing.',
    };
  }
  return { ok: true, letters, requiredOverlap: wordLetters - toCover };
}

/** Generates a woordzoeker. Deterministic: the same input and seed give the same puzzle. */
export function generateGrid(input: GenerateInput): GenerateResult {
  const { width, height, difficulty, seed, themeId } = input;

  if (!isValidSize(width) || !isValidSize(height)) {
    return fail(`De breedte en hoogte moeten tussen ${MIN_SIZE} en ${MAX_SIZE} liggen.`);
  }
  if (input.words.length === 0) {
    return fail('Voeg minstens één woord toe.');
  }

  const maxLength = Math.max(width, height);
  const tooLong: UnplacedWord[] = [];
  const placeable: NormalizedWord[] = [];
  for (const word of input.words) {
    if (word.letters.length > maxLength) {
      tooLong.push({
        word,
        code: 'too-long',
        reason: `"${word.display}" is te lang voor een raster van ${width}×${height} (${word.letters.length} letters, maximaal ${maxLength}).`,
      });
    } else {
      placeable.push(word);
    }
  }

  const solutionText = input.solution?.trim() ?? '';
  let solution: PuzzleSolution | undefined;
  if (solutionText !== '' && tooLong.length === 0) {
    const fit = checkSolutionFit(placeable, width, height, solutionText);
    if (!fit.ok) return fail(fit.reason);
    solution = { display: solutionText, letters: fit.letters };
  } else if (solutionText !== '' && !/^[A-Z]+$/.test(toGridLetters(solutionText))) {
    return fail('De oplossing mag alleen letters bevatten.');
  }

  const rng = createRng(seed);
  const ctx: Context = { width, height, directions: DIRECTIONS_BY_DIFFICULTY[difficulty], rng };
  const base = { version: 1 as const, width, height, difficulty, seed, themeId };

  if (solution) {
    const toCover = width * height - solution.letters.length;
    for (let attempt = 0; attempt < MAX_SOLUTION_ATTEMPTS; attempt++) {
      const result = placeWords(ctx, placeable, toCover);
      if (result.aborted || result.unplaced.length > 0) continue;
      if (countFilled(result.cells) !== toCover) continue;
      const grid = fillWithSolution(ctx, result, solution.letters);
      if (!grid) continue;
      return {
        ok: true,
        puzzle: { ...base, grid, words: inInputOrder(result.placed, input.words), solution },
      };
    }
  }

  // Plain puzzle (no solution word) — also the fallback offered when the solution didn't fit.
  let best: Attempt | undefined;
  let plain: Puzzle | undefined;
  for (let attempt = 0; attempt < MAX_ATTEMPTS && !plain; attempt++) {
    const result = placeWords(ctx, placeable, undefined);
    if (!best || result.unplaced.length < best.unplaced.length) best = result;
    if (result.unplaced.length > 0) continue;
    const grid = fillRandom(ctx, result);
    if (grid) plain = { ...base, grid, words: inInputOrder(result.placed, input.words) };
  }

  if (plain && tooLong.length === 0) {
    if (!solution) return { ok: true, puzzle: plain };
    return {
      ok: false,
      reason:
        `Het lukte niet om precies ${solution.letters.length} vakjes vrij te houden voor de ` +
        `oplossing "${solution.display}". Probeer een ander formaat, pas de woorden aan of ` +
        'ga verder zonder oplossingswoord.',
      unplaced: [],
      partial: plain,
    };
  }

  const partial: Puzzle | undefined =
    plain ??
    (best && best.placed.length > 0
      ? {
          ...base,
          grid: fillRandom(ctx, best) ?? fillRandomUnchecked(ctx, best.cells),
          words: inInputOrder(best.placed, input.words),
        }
      : undefined);
  const unplaced = [...tooLong, ...(plain ? [] : (best?.unplaced ?? []))];
  const n = unplaced.length;
  return {
    ok: false,
    reason: n === 1 ? '1 woord past niet in de puzzel.' : `${n} woorden passen niet in de puzzel.`,
    unplaced,
    partial,
  };
}

interface Context {
  width: number;
  height: number;
  directions: readonly Direction[];
  rng: Rng;
}

function isValidSize(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE;
}

function fail(reason: string): GenerateResult {
  return { ok: false, reason, unplaced: [] };
}

function countFilled(cells: Cells): number {
  return cells.reduce((n, cell) => (cell === null ? n : n + 1), 0);
}

/**
 * Places words longest-first. Without a target, candidates with overlaps are favoured
 * (compact grids). With a coverage target (solution word), each choice must keep the
 * target reachable, and choices close to a proportional share of the remaining coverage
 * are favoured; the last word must hit the target exactly.
 */
function placeWords(
  ctx: Context,
  words: readonly NormalizedWord[],
  toCover: number | undefined,
): Attempt {
  const { width, height, rng } = ctx;
  const cells: Cells = new Array<string | null>(width * height).fill(null);
  const placed: PlacedWord[] = [];
  const unplaced: UnplacedWord[] = [];

  // Shuffle first so equal-length words are ordered randomly (sort is stable).
  const ordered = shuffle(words, rng).sort((a, b) => b.letters.length - a.letters.length);
  let lettersLeft = ordered.reduce((sum, w) => sum + w.letters.length, 0);
  let covered = 0;
  let aborted = false;

  ordered.forEach((word, index) => {
    if (aborted) return;
    const length = word.letters.length;
    lettersLeft -= length;
    const wordsLeft = ordered.length - index - 1;
    const candidates = findCandidates(ctx, cells, word.letters);

    let weights: number[];
    if (toCover === undefined) {
      weights = candidates.map((c) => 1 + 3 * c.overlap);
    } else {
      const remaining = toCover - covered;
      const share = (remaining * length) / (lettersLeft + length);
      weights = candidates.map((c) => {
        const after = remaining - (length - c.overlap);
        // Every later word adds at least 1 new cell and at most all of its letters.
        if (after < wordsLeft || after > lettersLeft) return 0;
        return (1 + 2 * c.overlap) / (1 + Math.abs(length - c.overlap - share));
      });
      // The exact target is out of reach: stop early, this attempt cannot succeed.
      if (candidates.length > 0 && weights.every((w) => w === 0)) {
        aborted = true;
        return;
      }
    }

    const choice = weightedPick(candidates, weights, rng);
    if (!choice) {
      if (toCover !== undefined) {
        aborted = true;
        return;
      }
      unplaced.push({
        word,
        code: 'no-room',
        reason: `Er was geen plek meer voor "${word.display}". Maak het raster groter of gebruik minder woorden.`,
      });
      return;
    }

    const { dRow, dCol } = DIRECTION_VECTORS[choice.direction];
    for (let i = 0; i < length; i++) {
      cells[(choice.row + dRow * i) * width + choice.col + dCol * i] = word.letters[i] ?? null;
    }
    covered += length - choice.overlap;
    placed.push({
      display: word.display,
      letters: word.letters,
      row: choice.row,
      col: choice.col,
      direction: choice.direction,
      length,
    });
  });

  return { cells, placed, unplaced, aborted };
}

/** All positions where the word fits: in bounds, overlapping only identical letters. */
function findCandidates(ctx: Context, cells: Cells, letters: string): Candidate[] {
  const { width, height, directions } = ctx;
  const length = letters.length;
  const candidates: Candidate[] = [];

  for (const direction of directions) {
    const { dRow, dCol } = DIRECTION_VECTORS[direction];
    for (let row = 0; row < height; row++) {
      const endRow = row + dRow * (length - 1);
      if (endRow < 0 || endRow >= height) continue;
      for (let col = 0; col < width; col++) {
        const endCol = col + dCol * (length - 1);
        if (endCol < 0 || endCol >= width) continue;

        let overlap = 0;
        let fits = true;
        for (let i = 0; i < length; i++) {
          const cell = cells[(row + dRow * i) * width + col + dCol * i];
          if (cell === null) continue;
          if (cell !== letters[i]) {
            fits = false;
            break;
          }
          overlap++;
        }
        // Never lay a word entirely on top of existing letters (e.g. KAT inside KATER, placed
        // longest-first): it would add no cells of its own and could overlap a word exactly.
        if (fits && overlap < length) candidates.push({ row, col, direction, overlap });
      }
    }
  }
  return candidates;
}

function weightedPick<T>(items: readonly T[], weights: readonly number[], rng: Rng): T | undefined {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return undefined;
  let target = rng() * total;
  for (let i = 0; i < items.length; i++) {
    target -= weights[i] ?? 0;
    if (target < 0) return items[i];
  }
  return items[items.length - 1];
}

/** Writes the solution letters into the free cells (row by row); null if that creates duplicates. */
function fillWithSolution(ctx: Context, attempt: Attempt, solution: string): string[] | null {
  const cells = [...attempt.cells];
  const filler = new Set<number>();
  let next = 0;
  cells.forEach((cell, index) => {
    if (cell === null) {
      cells[index] = solution[next++] ?? '';
      filler.add(index);
    }
  });
  if (findAccidentalCells(ctx, cells as string[], filler, attempt.placed).size > 0) return null;
  return toRows(cells as string[], ctx.width);
}

/** Fills free cells with weighted random letters, redrawing cells that form accidental words. */
function fillRandom(ctx: Context, attempt: Attempt): string[] | null {
  const cells = [...attempt.cells];
  const filler = new Set<number>();
  cells.forEach((cell, index) => {
    if (cell === null) {
      cells[index] = randomFillLetter(ctx.rng);
      filler.add(index);
    }
  });

  for (let refill = 0; refill <= MAX_REFILLS; refill++) {
    const bad = findAccidentalCells(ctx, cells as string[], filler, attempt.placed);
    if (bad.size === 0) return toRows(cells as string[], ctx.width);
    for (const index of bad) cells[index] = randomFillLetter(ctx.rng);
  }
  return null;
}

function fillRandomUnchecked(ctx: Context, source: Cells): string[] {
  return toRows(
    source.map((cell) => cell ?? randomFillLetter(ctx.rng)),
    ctx.width,
  );
}

/**
 * Finds filler cells that are part of an accidental extra occurrence of a placed word
 * (in any of the 8 directions). Occurrences made only of word cells are fine — e.g. KAT
 * inside KATER, or a palindrome read backwards.
 */
function findAccidentalCells(
  ctx: Context,
  cells: readonly string[],
  filler: ReadonlySet<number>,
  placed: readonly PlacedWord[],
): Set<number> {
  const { width, height } = ctx;
  const bad = new Set<number>();
  const targets = new Set(
    placed.map((p) => p.letters).filter((l) => l.length >= MIN_DUPLICATE_CHECK_LENGTH),
  );
  if (targets.size === 0 || filler.size === 0) return bad;

  for (const letters of targets) {
    const length = letters.length;
    for (const direction of ALL_DIRECTIONS) {
      const { dRow, dCol } = DIRECTION_VECTORS[direction];
      for (let row = 0; row < height; row++) {
        const endRow = row + dRow * (length - 1);
        if (endRow < 0 || endRow >= height) continue;
        for (let col = 0; col < width; col++) {
          const endCol = col + dCol * (length - 1);
          if (endCol < 0 || endCol >= width) continue;

          let matches = true;
          const fillerHits: number[] = [];
          for (let i = 0; i < length; i++) {
            const index = (row + dRow * i) * width + col + dCol * i;
            if (cells[index] !== letters[i]) {
              matches = false;
              break;
            }
            if (filler.has(index)) fillerHits.push(index);
          }
          if (matches) fillerHits.forEach((index) => bad.add(index));
        }
      }
    }
  }
  return bad;
}

function toRows(cells: readonly string[], width: number): string[] {
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += width) rows.push(cells.slice(i, i + width).join(''));
  return rows;
}

function inInputOrder(
  placed: readonly PlacedWord[],
  words: readonly NormalizedWord[],
): PlacedWord[] {
  const order = new Map(words.map((w, i) => [w.letters, i]));
  return [...placed].sort((a, b) => (order.get(a.letters) ?? 0) - (order.get(b.letters) ?? 0));
}
