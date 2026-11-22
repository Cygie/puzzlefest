import type { Cell, GetallenpadPuzzle, PlayerState } from './types';

/** Number of cells, which is also the highest value N. */
export function cellCount(puzzle: Pick<GetallenpadPuzzle, 'width' | 'height'>): number {
  return puzzle.width * puzzle.height;
}

/**
 * The cell of each value: `positions[k]` is the cell holding k (index 0 unused).
 * Values outside 1..N are ignored; for duplicates the last one wins.
 */
export function positionsByValue(solution: readonly (readonly number[])[]): (Cell | undefined)[] {
  const n = solution.reduce((sum, row) => sum + row.length, 0);
  const positions: (Cell | undefined)[] = new Array<Cell | undefined>(n + 1).fill(undefined);
  solution.forEach((row, r) =>
    row.forEach((value, c) => {
      if (Number.isInteger(value) && value >= 1 && value <= n)
        positions[value] = { row: r, col: c };
    }),
  );
  return positions;
}

/** The given cells with their value, in row-major order. */
export function givenCells(puzzle: GetallenpadPuzzle): { cell: Cell; value: number }[] {
  const result: { cell: Cell; value: number }[] = [];
  puzzle.givens.forEach((row, r) =>
    row.forEach((value, c) => {
      if (value !== null) result.push({ cell: { row: r, col: c }, value });
    }),
  );
  return result;
}

/** Share of cells that are given (0..1). */
export function givenRatio(puzzle: GetallenpadPuzzle): number {
  return givenCells(puzzle).length / cellCount(puzzle);
}

/** A fresh player state: nothing entered, nothing to undo. */
export function emptyPlayerState(puzzle: GetallenpadPuzzle): PlayerState {
  return { entries: new Array<number | null>(cellCount(puzzle)).fill(null), history: [] };
}
