import { describe, expect, it } from 'vitest';

import type { Cell } from '@/shared/grid/cells';

import { emptyPlayerState } from './model';
import { applyDrag, boardValues, findErrors, isSolved, pathRuns, setEntry, undo } from './play';
import { TEST_PUZZLE, testPuzzle } from './testPuzzle';
import type { GetallenpadPuzzle, PlayerState } from './types';

// TEST_PUZZLE (4×4 snake), givens shown, dots are empty:
//    1  2  .  4
//    .  .  6  .
//    9 10 11  .
//   16  .  . 13
const P = TEST_PUZZLE;
const at = (row: number, col: number): Cell => ({ row, col });
const fresh = () => emptyPlayerState(P);
const grid = (puzzle: GetallenpadPuzzle, state: PlayerState) => {
  const values = boardValues(puzzle, state);
  return Array.from({ length: puzzle.height }, (_, r) =>
    values.slice(r * puzzle.width, (r + 1) * puzzle.width),
  );
};
const drag = (state: PlayerState, ...cells: Cell[]) => {
  const result = applyDrag(P, state, cells);
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
};
const fill = (puzzle: GetallenpadPuzzle, rows: number[][]): PlayerState => ({
  entries: rows.flat().map((v, i) => (puzzle.givens.flat()[i] === null ? v : null)),
  history: [],
});

describe('applyDrag', () => {
  it('numbers upwards from the start and passes a matching given', () => {
    const state = drag(fresh(), at(0, 1), at(0, 2), at(0, 3), at(1, 3));
    expect(grid(P, state)[0]).toEqual([1, 2, 3, 4]);
    expect(grid(P, state)[1]).toEqual([null, null, 6, 5]);
    expect(state.history).toEqual([fresh().entries]);
  });

  it('numbers downwards from N', () => {
    const state = drag(fresh(), at(3, 0), at(3, 1), at(3, 2), at(3, 3));
    expect(grid(P, state)[3]).toEqual([16, 15, 14, 13]);
  });

  it('numbers downwards when the next higher number is placed and the lower is not', () => {
    // 9: 10 is on the board, 8 is not.
    const state = drag(fresh(), at(2, 0), at(1, 0), at(1, 1), at(1, 2));
    expect(grid(P, state)[1]).toEqual([8, 7, 6, null]);
  });

  it('rejects a drag that runs into a different given, changing nothing', () => {
    const result = applyDrag(P, fresh(), [at(0, 1), at(0, 2), at(1, 2)]);
    expect(result).toEqual({ ok: false, error: { code: 'given-collision', cell: at(1, 2) } });
  });

  it('rejects numbering outside 1..N', () => {
    const puzzle = testPuzzle();
    puzzle.givens[0]![0] = null; // no 1 on the board, so 2 counts down once 3 is placed
    const state = setEntry(puzzle, emptyPlayerState(puzzle), at(0, 2), 3);
    expect(applyDrag(puzzle, state, [at(0, 1), at(0, 0), at(1, 0)])).toEqual({
      ok: false,
      error: { code: 'out-of-range', cell: at(1, 0) },
    });
    expect(applyDrag(P, fresh(), [at(3, 3), at(2, 3), at(1, 3), at(0, 2)])).toMatchObject({
      ok: true,
    });
  });

  it('needs a number in the first cell; a single cell changes nothing', () => {
    expect(applyDrag(P, fresh(), [at(1, 0), at(1, 1)])).toEqual({
      ok: false,
      error: { code: 'no-start', cell: at(1, 0) },
    });
    const state = fresh();
    expect(applyDrag(P, state, [at(0, 1)])).toEqual({ ok: true, value: state });
  });

  it('starts from a number the player entered and moves an earlier entry of the same number', () => {
    let state = setEntry(P, fresh(), at(1, 0), 3); // 3 in a wrong place
    state = drag(state, at(0, 1), at(0, 2)); // 2 → 3 next to it
    expect(grid(P, state)[0]![2]).toBe(3);
    expect(grid(P, state)[1]![0]).toBeNull();
    state = drag(state, at(0, 2), at(1, 1)); // continue from the entered 3: 4 is placed, 2 too → up
    expect(grid(P, state)[1]![1]).toBe(4);
  });
});

describe('setEntry and undo', () => {
  it('types and clears numbers, ignoring givens and numbers outside 1..N', () => {
    let state = setEntry(P, fresh(), at(1, 0), 8);
    expect(grid(P, state)[1]![0]).toBe(8);
    expect(setEntry(P, state, at(0, 0), 5)).toBe(state);
    expect(setEntry(P, state, at(1, 1), 17)).toBe(state);
    expect(setEntry(P, state, at(1, 1), 0)).toBe(state);
    expect(setEntry(P, state, at(1, 0), 8)).toBe(state);
    state = setEntry(P, state, at(1, 0), null);
    expect(grid(P, state)[1]![0]).toBeNull();
    expect(state.history).toHaveLength(2);
  });

  it('moves a number typed elsewhere', () => {
    let state = setEntry(P, fresh(), at(1, 0), 8);
    state = setEntry(P, state, at(1, 1), 8);
    expect(grid(P, state)[1]).toEqual([null, 8, 6, null]);
  });

  it('undoes one change at a time', () => {
    const a = setEntry(P, fresh(), at(1, 0), 8);
    const b = drag(a, at(0, 1), at(0, 2));
    expect(undo(b).entries).toEqual(a.entries);
    expect(undo(undo(b)).entries).toEqual(fresh().entries);
    expect(undo(fresh())).toEqual(fresh());
  });
});

describe('findErrors', () => {
  it('marks a number whose neighbour in the sequence is placed but not adjacent', () => {
    // 12 at (3,1): 11 at (2,2) touches it, 13 at (3,3) does not.
    const state = setEntry(P, fresh(), at(3, 1), 12);
    expect([...findErrors(P, state)]).toEqual([13]);
  });

  it('marks a number that duplicates a given, but never the given itself', () => {
    const state = setEntry(P, fresh(), at(1, 0), 6);
    expect([...findErrors(P, state)]).toEqual([4]);
  });

  it('has no errors for correct partial progress', () => {
    const state = drag(fresh(), at(0, 1), at(0, 2), at(0, 3), at(1, 3));
    expect(findErrors(P, state).size).toBe(0);
  });
});

describe('isSolved and pathRuns', () => {
  it('is solved only when every cell is filled correctly', () => {
    expect(isSolved(P, fill(P, P.solution))).toBe(true);
    expect(isSolved(P, fresh())).toBe(false);
    const swapped = P.solution.map((row) => [...row]);
    swapped[1]![0] = 7;
    swapped[1]![1] = 8;
    expect(isSolved(P, fill(P, swapped))).toBe(false);
  });

  it('draws lines through runs of consecutive touching numbers', () => {
    expect(pathRuns(P, fresh())).toEqual([
      [at(0, 0), at(0, 1)],
      [at(2, 0), at(2, 1), at(2, 2)],
    ]);
    const solved = pathRuns(P, fill(P, P.solution));
    expect(solved).toHaveLength(1);
    expect(solved[0]).toHaveLength(16);
  });
});
