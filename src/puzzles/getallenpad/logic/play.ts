import { type Cell, isNeighbour } from '@/shared/grid/cells';
import { err, ok, type Result } from '@/shared/result';

import { cellCount } from './model';
import type { GetallenpadPuzzle, PlayerState } from './types';

/** Givens plus the player's entries, one value per cell (row-major); `null` is empty. */
export function boardValues(puzzle: GetallenpadPuzzle, state: PlayerState): (number | null)[] {
  return puzzle.givens.flat().map((given, i) => given ?? state.entries[i] ?? null);
}

const indexOf = (puzzle: GetallenpadPuzzle, cell: Cell) => cell.row * puzzle.width + cell.col;
const cellAt = (puzzle: GetallenpadPuzzle, index: number): Cell => ({
  row: Math.floor(index / puzzle.width),
  col: index % puzzle.width,
});
const givenAt = (puzzle: GetallenpadPuzzle, index: number) =>
  puzzle.givens[Math.floor(index / puzzle.width)]?.[index % puzzle.width] ?? null;

/** Applies new entries: earlier player entries of the same values elsewhere are removed. */
function withEntries(
  puzzle: GetallenpadPuzzle,
  state: PlayerState,
  changes: ReadonlyMap<number, number | null>,
): PlayerState {
  const placed = new Set([...changes.values()].filter((v) => v !== null));
  const entries = state.entries.map((value, i) => {
    if (changes.has(i)) return changes.get(i)!;
    return value !== null && placed.has(value) && givenAt(puzzle, i) === null ? null : value;
  });
  if (entries.every((v, i) => v === state.entries[i])) return state;
  return { entries, history: [...state.history, state.entries] };
}

export type DragErrorCode = 'no-start' | 'given-collision' | 'out-of-range';

export interface DragError {
  code: DragErrorCode;
  /** The cell where the drag went wrong. */
  cell: Cell;
}

/**
 * Numbers a dragged path, starting from the number in its first cell. It counts up, unless
 * the next higher number is already on the board and the next lower one is not (or the
 * start is N): then it counts down. A given on the path must match its number; otherwise,
 * or when the numbering leaves 1..N, the whole drag is rejected and nothing changes.
 */
export function applyDrag(
  puzzle: GetallenpadPuzzle,
  state: PlayerState,
  path: readonly Cell[],
): Result<PlayerState, DragError> {
  const [first] = path;
  if (!first || path.length < 2) return ok(state);
  const n = cellCount(puzzle);
  const values = boardValues(puzzle, state);
  const start = values[indexOf(puzzle, first)];
  if (start == null) return err({ code: 'no-start', cell: first });

  const placed = new Set(values);
  const down = start === n || (start !== 1 && placed.has(start + 1) && !placed.has(start - 1));
  const step = down ? -1 : 1;

  const changes = new Map<number, number | null>();
  for (let i = 1; i < path.length; i++) {
    const cell = path[i]!;
    const value = start + step * i;
    if (value < 1 || value > n) return err({ code: 'out-of-range', cell });
    const index = indexOf(puzzle, cell);
    const given = givenAt(puzzle, index);
    if (given === null) changes.set(index, value);
    else if (given !== value) return err({ code: 'given-collision', cell });
  }
  return ok(withEntries(puzzle, state, changes));
}

/**
 * Types a number into a cell (or clears it with `null`). Givens and numbers outside 1..N
 * are ignored; an earlier player entry of the same number elsewhere is removed.
 */
export function setEntry(
  puzzle: GetallenpadPuzzle,
  state: PlayerState,
  cell: Cell,
  value: number | null,
): PlayerState {
  const index = indexOf(puzzle, cell);
  if (givenAt(puzzle, index) !== null || index < 0 || index >= state.entries.length) return state;
  if (value !== null && !(Number.isInteger(value) && value >= 1 && value <= cellCount(puzzle))) {
    return state;
  }
  return withEntries(puzzle, state, new Map([[index, value]]));
}

/** Goes back one change. */
export function undo(state: PlayerState): PlayerState {
  const previous = state.history[state.history.length - 1];
  return previous ? { entries: previous, history: state.history.slice(0, -1) } : state;
}

/** Cells holding each value (index 0 unused). */
function occurrences(values: readonly (number | null)[], n: number): number[][] {
  const result: number[][] = Array.from({ length: n + 2 }, () => []);
  values.forEach((value, i) => {
    if (value !== null && value >= 1 && value <= n) result[value]!.push(i);
  });
  return result;
}

/**
 * Player cells (row-major indexes) that are wrong right now: a number that is on the board
 * more than once, or a number k whose k−1 or k+1 is placed (once) but not next to it.
 * Givens are never marked.
 */
export function findErrors(puzzle: GetallenpadPuzzle, state: PlayerState): Set<number> {
  const n = cellCount(puzzle);
  const values = boardValues(puzzle, state);
  const at = occurrences(values, n);
  const errors = new Set<number>();
  values.forEach((value, i) => {
    if (value === null || givenAt(puzzle, i) !== null) return;
    if (at[value]!.length > 1) {
      errors.add(i);
      return;
    }
    for (const other of [value - 1, value + 1]) {
      const cells = at[other];
      if (cells?.length === 1 && !isNeighbour(cellAt(puzzle, i), cellAt(puzzle, cells[0]!))) {
        errors.add(i);
      }
    }
  });
  return errors;
}

/** Every cell filled and nothing wrong: with a unique puzzle that is the solution. */
export function isSolved(puzzle: GetallenpadPuzzle, state: PlayerState): boolean {
  return (
    boardValues(puzzle, state).every((v) => v !== null) && findErrors(puzzle, state).size === 0
  );
}

/** Runs of consecutive numbers on touching cells, to draw as lines (at least 2 cells each). */
export function pathRuns(puzzle: GetallenpadPuzzle, state: PlayerState): Cell[][] {
  const n = cellCount(puzzle);
  const at = occurrences(boardValues(puzzle, state), n);
  const runs: Cell[][] = [];
  let run: Cell[] = [];
  for (let k = 1; k <= n; k++) {
    const here = at[k]!.length === 1 ? cellAt(puzzle, at[k]![0]!) : null;
    const last = run[run.length - 1];
    if (here && last && isNeighbour(last, here)) {
      run.push(here);
      continue;
    }
    if (run.length > 1) runs.push(run);
    run = here ? [here] : [];
  }
  if (run.length > 1) runs.push(run);
  return runs;
}
