import { type Cell, cellIndex, inGrid } from '@/shared/grid/cells';
import { findPathProblem } from '@/shared/grid/paths';
import { EMPTY, labelRegions, neighbourTable } from '@/shared/grid/regions';
import { createRng, randomInt, type Rng } from '@/shared/random';
import { err, ok, type Result } from '@/shared/result';

import { positionsByValue } from './model';
import { MAX_GRID_SIZE, MIN_GRID_SIZE } from './types';

/** Chance that a step takes a random neighbour instead of the Warnsdorff choice. */
export const NOISE = 0.25;
/** Steps per attempt before restarting from a new start cell. */
export const RESTART_STEPS = 5_000;
export const DEFAULT_MAX_STEPS = 200_000;
export const DEFAULT_TIMEOUT_MS = 2_000;
/** How often (in steps) the clock and the abort signal are checked. */
const CHECK_EVERY = 256;

export interface PathInput {
  width: number;
  height: number;
  seed: number;
}

export interface PathOptions {
  timeoutMs?: number;
  maxSteps?: number;
  restartSteps?: number;
  /** Start cell of the first attempt (restarts pick a random one). */
  start?: Cell;
  /** Share of random steps (default `NOISE`). */
  noise?: number;
  /** Region and dead-end pruning (default true; false only to compare in tests). */
  pruning?: boolean;
  now?: () => number;
  signal?: AbortSignal;
}

export type PathErrorCode = 'grid-size' | 'no-path' | 'timeout' | 'aborted';

export interface PathError {
  code: PathErrorCode;
  /** Dutch explanation for the admin page. */
  message: string;
}

export interface PathResult {
  /** Rows of values 1..N: one path of touching cells through every cell. */
  solution: number[][];
  /** Attempts that were abandoned before the path was found. */
  restarts: number;
}

const MESSAGES: Record<Exclude<PathErrorCode, 'grid-size'>, string> = {
  'no-path': 'Geen pad gevonden binnen het aantal zoekstappen.',
  timeout: 'Het zoeken naar een pad duurde te lang.',
  aborted: 'Het zoeken naar een pad is afgebroken.',
};

type Stop = 'restart' | Exclude<PathErrorCode, 'grid-size'> | null;

const isSize = (v: number) => Number.isInteger(v) && v >= MIN_GRID_SIZE && v <= MAX_GRID_SIZE;

/**
 * A random path through every cell of the grid, each step to one of the 8 neighbours
 * (a Hamiltonian path in the king graph). Deterministic per seed.
 * See the design doc `getallenpad-path-generator-design.md`.
 */
export function generatePath(
  input: PathInput,
  options: PathOptions = {},
): Result<PathResult, PathError> {
  const { width, height, seed } = input;
  if (!isSize(width) || !isSize(height)) {
    return err({
      code: 'grid-size',
      message: `Het raster moet tussen ${MIN_GRID_SIZE} en ${MAX_GRID_SIZE} vakjes breed en hoog zijn.`,
    });
  }
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxSteps = DEFAULT_MAX_STEPS,
    restartSteps = RESTART_STEPS,
    noise = NOISE,
    pruning = true,
    now = () => performance.now(),
    signal,
  } = options;
  if (signal?.aborted) return err({ code: 'aborted', message: MESSAGES.aborted });

  const n = width * height;
  const rng: Rng = createRng(seed);
  const neighbours = neighbourTable(width, height);
  const order = new Int16Array(n).fill(EMPTY); // cell → value, EMPTY = not visited
  const free = new Int8Array(n); // unvisited neighbours per cell
  const labels = new Int16Array(n);
  const started = now();
  let steps = 0;
  let restartAt = restartSteps;
  let stop: Stop = null;

  const reset = () => {
    order.fill(EMPTY);
    neighbours.forEach((list, cell) => (free[cell] = list.length));
  };

  const visit = (cell: number, value: number) => {
    order[cell] = value;
    for (const next of neighbours[cell]!) free[next]!--;
  };

  const unvisit = (cell: number) => {
    order[cell] = EMPTY;
    for (const next of neighbours[cell]!) free[next]!++;
  };

  /**
   * Necessary conditions for completing the path from `head`: the unvisited cells form
   * one region (the head touches it, see the caller), and at most one of them is a
   * dead end, i.e. has ≤ 1 unvisited neighbour without touching the head — only the
   * final cell can be one. A cell next to the head with no other way out can only be
   * the final cell, so it must be the very last one left.
   */
  const canFinish = (head: number, left: number): boolean => {
    if (left === 0) return true;
    if (free[head] === 0) return false;
    if (labelRegions(order, neighbours, labels).length !== 1) return false;
    const nextToHead = neighbours[head]!;
    let deadEnds = 0;
    for (let cell = 0; cell < n; cell++) {
      if (order[cell] !== EMPTY) continue;
      const touchesHead = nextToHead.includes(cell);
      if (touchesHead) {
        if (free[cell] === 0 && left > 1) return false;
      } else if (free[cell]! <= 1 && ++deadEnds > 1) {
        return false;
      }
    }
    return true;
  };

  /** Unvisited neighbours: fewest onward options first (ties random), sometimes a random one. */
  const candidates = (head: number): number[] => {
    const list = neighbours[head]!.filter((cell) => order[cell] === EMPTY);
    const keys = new Map(list.map((cell) => [cell, free[cell]! + rng() * 0.99]));
    list.sort((a, b) => keys.get(a)! - keys.get(b)!);
    if (list.length > 1 && rng() < noise) {
      const [picked] = list.splice(randomInt(rng, list.length), 1);
      list.unshift(picked!);
    }
    return list;
  };

  const extend = (head: number, value: number): boolean => {
    if (value === n) return true;
    for (const cell of candidates(head)) {
      steps++;
      if (steps >= maxSteps) stop = 'no-path';
      else if (steps >= restartAt) stop = 'restart';
      else if (steps % CHECK_EVERY === 0) {
        if (signal?.aborted) stop = 'aborted';
        else if (now() - started > timeoutMs) stop = 'timeout';
      }
      if (stop) return false;
      visit(cell, value + 1);
      if ((!pruning || canFinish(cell, n - value - 1)) && extend(cell, value + 1)) return true;
      unvisit(cell);
      if (stop) return false;
    }
    return false;
  };

  const first = options.start;
  let start = first && inGrid(first, width, height) ? cellIndex(first, width) : randomInt(rng, n);
  let restarts = 0;
  for (;;) {
    reset();
    visit(start, 1);
    if (extend(start, 1)) break;
    if (stop && stop !== 'restart') return err({ code: stop, message: MESSAGES[stop] });
    // Restart (or, in theory, an exhausted search): new start cell, fresh budget slice.
    stop = null;
    restarts++;
    // Count the attempt itself, so even a search that takes no steps ends at maxSteps.
    if (++steps >= maxSteps) return err({ code: 'no-path', message: MESSAGES['no-path'] });
    restartAt = steps + restartSteps;
    start = randomInt(rng, n);
  }

  const solution: number[][] = [];
  for (let row = 0; row < height; row++) {
    solution.push(Array.from(order.subarray(row * width, (row + 1) * width)));
  }
  const path = positionsByValue(solution).slice(1);
  if (path.length !== n || path.some((c) => !c) || findPathProblem(path as Cell[], width, height)) {
    throw new Error('generatePath produced an invalid path');
  }
  return ok({ solution, restarts });
}
