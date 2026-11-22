import { createRng, type Rng, shuffle } from '@/shared/random';
import { err, ok, type Result } from '@/shared/result';

import { generatePath } from './generatePath';
import { countSolutions, uniquenessCheck } from './solve';
import { type GetallenpadPuzzle, type Level, MAX_GRID_SIZE, MIN_GRID_SIZE } from './types';
import { validatePuzzle } from './validatePuzzle';

/** Share of given cells per level; moeilijk is the minimal unique puzzle (no target). */
export const LEVEL_TARGETS: Record<Level, number | null> = {
  makkelijk: 0.5,
  normaal: 0.4,
  moeilijk: null,
};

export const DEFAULT_TIMEOUT_MS = 5_000;
/** Reduction passes (each on a new path and removal order); the lowest result is kept. */
export const DEFAULT_PASSES = 3;
/** Solver budget per removal check; hitting it keeps the number (never risks uniqueness). */
export const CHECK_MAX_NODES = 100_000;

export interface CreateInput {
  width: number;
  height: number;
  level: Level;
  seed: number;
  /** Defaults to `{width}x{height}-{level}-{seed}`. */
  id?: string;
}

export interface CreateOptions {
  timeoutMs?: number;
  passes?: number;
  now?: () => number;
  signal?: AbortSignal;
}

export type CreateErrorCode = 'grid-size' | 'no-path' | 'timeout' | 'aborted';

export interface CreateError {
  code: CreateErrorCode;
  /** Dutch explanation for the admin page. */
  message: string;
}

const MESSAGES: Record<CreateErrorCode, string> = {
  'grid-size': `Het raster moet tussen ${MIN_GRID_SIZE} en ${MAX_GRID_SIZE} vakjes breed en hoog zijn.`,
  'no-path': 'Er kon geen pad door het raster worden gevonden.',
  timeout: 'Het maken van de puzzel duurde te lang.',
  aborted: 'Het maken van de puzzel is afgebroken.',
};

const fail = (code: CreateErrorCode): Result<never, CreateError> =>
  err({ code, message: MESSAGES[code] });

type Givens = (number | null)[][];

interface Reduced {
  solution: number[][];
  givens: Givens;
  /** Cells emptied by the reduction, in removal order. */
  removed: number[];
  count: number;
}

class Stopped {
  constructor(readonly code: 'timeout' | 'aborted') {}
}

/**
 * Makes a getallenpad puzzle with exactly one solution at the requested level.
 * Deterministic per seed whenever all passes finish within the time budget.
 */
export function createPuzzle(
  input: CreateInput,
  options: CreateOptions = {},
): Result<GetallenpadPuzzle, CreateError> {
  const { width, height, level, seed } = input;
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    passes = DEFAULT_PASSES,
    now = () => performance.now(),
    signal,
  } = options;
  const isSize = (v: number) => Number.isInteger(v) && v >= MIN_GRID_SIZE && v <= MAX_GRID_SIZE;
  if (!isSize(width) || !isSize(height)) return fail('grid-size');
  if (signal?.aborted) return fail('aborted');

  const n = width * height;
  const rng: Rng = createRng(seed);
  const deadline = now() + timeoutMs;
  const check = () => {
    if (signal?.aborted) throw new Stopped('aborted');
    if (now() > deadline) throw new Stopped('timeout');
  };

  /** One greedy pass: remove numbers while the puzzle stays unique. */
  const reduce = (): Reduced | 'no-path' => {
    const path = generatePath(
      { width, height, seed: Math.floor(rng() * 2 ** 32) },
      { timeoutMs: Math.max(0, deadline - now()), now, signal },
    );
    if (!path.ok) {
      if (path.error.code === 'aborted' || path.error.code === 'timeout') {
        throw new Stopped(path.error.code);
      }
      return 'no-path';
    }
    const { solution } = path.value;
    const givens: Givens = solution.map((row) => [...row]);
    const removed: number[] = [];
    for (const cell of shuffle([...Array(n).keys()], rng)) {
      const row = givens[Math.floor(cell / width)]!;
      const value = row[cell % width]!;
      if (value === 1 || value === n) continue;
      check();
      row[cell % width] = null;
      const result = countSolutions(
        { width, height, givens },
        { maxNodes: CHECK_MAX_NODES, signal },
      );
      if (!result.ok && result.error.code === 'aborted') throw new Stopped('aborted');
      if (result.ok && result.value.count === 1) removed.push(cell);
      else row[cell % width] = value;
    }
    return { solution, givens, removed, count: n - removed.length };
  };

  let best: Reduced | null = null;
  try {
    for (let pass = 0; pass < passes; pass++) {
      const reduced = reduce();
      if (reduced !== 'no-path' && (!best || reduced.count < best.count)) best = reduced;
    }
  } catch (error) {
    if (!(error instanceof Stopped)) throw error;
    // A finished pass is a valid, unique puzzle: better than nothing.
    if (!best || error.code === 'aborted') return fail(error.code);
  }
  if (!best) return fail('no-path');

  // Add numbers back (random removed cells) up to the level's target; this keeps it unique.
  const target = LEVEL_TARGETS[level];
  const givens = best.givens.map((row) => [...row]);
  if (target !== null) {
    const wanted = Math.ceil(n * target);
    const back = shuffle(best.removed, rng).slice(0, Math.max(0, wanted - best.count));
    for (const cell of back) {
      givens[Math.floor(cell / width)]![cell % width] =
        best.solution[Math.floor(cell / width)]![cell % width]!;
    }
  }

  const final = countSolutions({ width, height, givens });
  if (!final.ok || final.value.count !== 1) {
    throw new Error('createPuzzle produced a puzzle without a unique solution');
  }
  const shown = givens.flat().filter((v) => v !== null).length;
  const puzzle: GetallenpadPuzzle = {
    version: 1,
    id: input.id ?? `${width}x${height}-${level}-${seed}`,
    level,
    width,
    height,
    solution: best.solution,
    givens,
    metric: { givenRatio: shown / n, solverNodes: final.value.nodes },
    seed,
  };
  if (!validatePuzzle(puzzle, { countSolutions: uniquenessCheck }).ok) {
    throw new Error('createPuzzle produced an invalid puzzle');
  }
  return ok(puzzle);
}
