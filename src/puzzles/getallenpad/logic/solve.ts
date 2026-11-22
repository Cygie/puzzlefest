import { EMPTY, labelRegions, neighbourTable } from '@/shared/grid/regions';
import { err, ok, type Result } from '@/shared/result';

import type { GetallenpadPuzzle } from './types';
import type { SolutionCount } from './validatePuzzle';

export interface SolveInput {
  width: number;
  height: number;
  /** Rows; `null` = empty cell. 1 and N may be missing (the search then tries every start). */
  givens: readonly (readonly (number | null)[])[];
}

export interface SolveOptions {
  /** Give up after this many nodes (default: unlimited). */
  maxNodes?: number;
  signal?: AbortSignal;
  /** Distance and region pruning (default true; false only for the oracle test). */
  pruning?: boolean;
}

export interface SolveResult {
  count: SolutionCount;
  /** Values placed during the search (given or chosen): the difficulty metric. */
  nodes: number;
  /** The first solution found, as rows. */
  solution?: number[][];
}

export type SolveErrorCode = 'node-limit' | 'aborted';

export interface SolveError {
  code: SolveErrorCode;
  nodes: number;
}

/** How often (in nodes) the abort signal is checked. */
const CHECK_EVERY = 1024;
const LIMIT = 2;

/** King-move distance: the minimum number of steps between two cells. */
const chebyshev = (a: number, b: number, width: number) =>
  Math.max(
    Math.abs(Math.floor(a / width) - Math.floor(b / width)),
    Math.abs((a % width) - (b % width)),
  );

/**
 * Counts the solutions of a getallenpad grid, stopping at the second one (0, 1 or 'many').
 * Fills the gaps between placed values, always on the most constrained side.
 * See the design doc `getallenpad-solver-design.md`.
 */
export function countSolutions(
  input: SolveInput,
  options: SolveOptions = {},
): Result<SolveResult, SolveError> {
  const { width, height, givens } = input;
  const { maxNodes = Infinity, signal, pruning = true } = options;
  const n = width * height;
  const neighbours = neighbourTable(width, height);
  const values = new Int16Array(n).fill(EMPTY); // cell → value
  const cellOf = new Int16Array(n + 2).fill(-1); // value → cell
  const isGiven = new Uint8Array(n + 2);
  const labels = new Int16Array(n);

  const none = (): Result<SolveResult, SolveError> => ok({ count: 0, nodes: 0 });
  if (signal?.aborted) return err({ code: 'aborted', nodes: 0 });

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const value = givens[row]?.[col] ?? null;
      if (value === null) continue;
      if (!Number.isInteger(value) || value < 1 || value > n || isGiven[value]) return none();
      const cell = row * width + col;
      values[cell] = value;
      cellOf[value] = cell;
      isGiven[value] = 1;
    }
  }

  for (let v = 1; v < n; v++) {
    const a = cellOf[v]!;
    const b = cellOf[v + 1]!;
    if (a >= 0 && b >= 0 && !neighbours[a]!.includes(b)) return none();
  }

  let nodes = 0;
  let found = 0;
  let placed = 0;
  let solution: number[][] | undefined;
  let stop: SolveErrorCode | 'done' | null = null;
  for (let v = 1; v <= n; v++) if (cellOf[v]! >= 0) placed++;

  const count = (): boolean => {
    nodes++;
    if (nodes > maxNodes) stop = 'node-limit';
    else if (nodes % CHECK_EVERY === 0 && signal?.aborted) stop = 'aborted';
    return stop === null;
  };

  const isPlaced = (v: number) => v >= 1 && v <= n && cellOf[v]! >= 0;

  /** Unplaced values next to v (v − 1 and/or v + 1) that still need a cell next to v. */
  const openSides = (v: number) =>
    (v > 1 && !isPlaced(v - 1) ? 1 : 0) + (v < n && !isPlaced(v + 1) ? 1 : 0);

  /**
   * Necessary conditions for the remaining empty cells (see design doc):
   * - consecutive placed values are close enough (Chebyshev distance ≤ value difference);
   * - a placed value with unplaced neighbours (an open end) has enough empty neighbours;
   * - an empty cell has ≥ 2 neighbours it can connect through (empty cells or open
   *   ends); only a missing 1 or N may sit in a cell with just one;
   * - every empty region touches an open end.
   */
  const feasible = (): boolean => {
    let previous = 0;
    for (let v = 1; v <= n; v++) {
      if (cellOf[v]! < 0) continue;
      if (previous && chebyshev(cellOf[previous]!, cellOf[v]!, width) > v - previous) return false;
      previous = v;
    }
    let looseEnds = (isPlaced(1) ? 0 : 1) + (isPlaced(n) ? 0 : 1);
    for (let cell = 0; cell < n; cell++) {
      const v = values[cell]!;
      let empty = 0;
      let open = 0;
      for (const next of neighbours[cell]!) {
        const w = values[next]!;
        if (w === EMPTY) empty++;
        else if (openSides(w) > 0) open++;
      }
      if (v !== EMPTY) {
        if (empty < openSides(v)) return false;
      } else if (empty + open < 2) {
        if (empty + open === 0 && n > 1) return false;
        if (--looseEnds < 0) return false;
      }
    }
    const sizes = labelRegions(values, neighbours, labels);
    if (sizes.length === 0) return true;
    const touched = new Uint8Array(sizes.length);
    let untouched = sizes.length;
    for (let cell = 0; cell < n && untouched > 0; cell++) {
      const v = values[cell]!;
      if (v === EMPTY || openSides(v) === 0) continue;
      for (const next of neighbours[cell]!) {
        const region = labels[next]!;
        if (region >= 0 && !touched[region]) {
          touched[region] = 1;
          untouched--;
        }
      }
    }
    return untouched === 0;
  };

  const record = () => {
    found++;
    if (!solution) {
      solution = [];
      for (let row = 0; row < height; row++) {
        solution.push(Array.from(values.subarray(row * width, (row + 1) * width)));
      }
    }
    if (found >= LIMIT) stop = 'done';
  };

  const emptyNeighbours = (cell: number) => {
    let free = 0;
    for (const next of neighbours[cell]!) if (values[next] === EMPTY) free++;
    return free;
  };

  /**
   * Empty cells for `value`, next to the placed value at `from`; with pruning, only cells
   * within reach of the placed value `to` on the other side of the gap (if any).
   */
  const cellsFor = (value: number, from: number, to: number): number[] =>
    neighbours[cellOf[from]!]!.filter(
      (cell) =>
        values[cell] === EMPTY &&
        (!pruning || to === 0 || chebyshev(cell, cellOf[to]!, width) <= Math.abs(to - value)),
    );

  const place = (value: number, cell: number) => {
    values[cell] = value;
    cellOf[value] = cell;
    placed++;
  };

  const unplace = (value: number, cell: number) => {
    values[cell] = EMPTY;
    cellOf[value] = -1;
    placed--;
  };

  /**
   * Fills the gaps between placed values. Each step picks the gap side (grow upward from
   * the lower end, or downward from the upper end) with the fewest candidate cells and
   * branches over them; every solution is reached exactly once.
   */
  const search = (): void => {
    if (placed === n) {
      record();
      return;
    }
    let bestValue = 0;
    let best: number[] | null = null;
    const consider = (value: number, from: number, to: number) => {
      if (best && best.length === 0) return;
      const cells = cellsFor(value, from, to);
      if (!best || cells.length < best.length) {
        best = cells;
        bestValue = value;
      }
    };
    let low = 0; // last placed value seen
    for (let v = 1; v <= n; v++) {
      if (cellOf[v]! < 0) continue;
      if (low === 0 && v > 1) consider(v - 1, v, 0); // values below the lowest placed
      if (low !== 0 && v - low >= 2) {
        consider(low + 1, low, v);
        consider(v - 1, v, low);
      }
      low = v;
    }
    if (low !== 0 && low < n) consider(low + 1, low, 0); // values above the highest placed
    const cells: number[] = best ?? [];
    if (cells.length > 1) {
      const free = new Map(cells.map((c) => [c, emptyNeighbours(c)]));
      cells.sort((a, b) => free.get(a)! - free.get(b)!);
    }
    for (const cell of cells) {
      if (!count()) return;
      // The value may close a gap: then it must also touch the value on the other side.
      const below = cellOf[bestValue - 1] ?? -1;
      const above = cellOf[bestValue + 1] ?? -1;
      const fits =
        (below < 0 || neighbours[below]!.includes(cell)) &&
        (above < 0 || neighbours[above]!.includes(cell));
      if (!fits) continue;
      place(bestValue, cell);
      if (!pruning || feasible()) search();
      unplace(bestValue, cell);
      if (stop) return;
    }
  };

  if (placed > 0) {
    if (!pruning || feasible()) search();
  } else {
    // No givens at all: try every cell for 1.
    for (let cell = 0; cell < n && !stop; cell++) {
      if (!count()) break;
      place(1, cell);
      if (!pruning || feasible()) search();
      unplace(1, cell);
    }
  }

  if (stop === 'node-limit' || stop === 'aborted') return err({ code: stop, nodes });
  return ok({ count: found === 0 ? 0 : found === 1 ? 1 : 'many', nodes, solution });
}

/** Uniqueness check for `validatePuzzle({ countSolutions: uniquenessCheck })`. */
export function uniquenessCheck(puzzle: GetallenpadPuzzle): SolutionCount {
  const result = countSolutions(puzzle);
  if (!result.ok) throw new Error(`uniquenessCheck without limits failed: ${result.error.code}`);
  return result.value.count;
}
