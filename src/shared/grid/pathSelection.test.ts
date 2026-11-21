import { describe, expect, it } from 'vitest';

import type { Cell } from './cells';
import { extendPath, tapPath } from './pathSelection';

const c = (row: number, col: number): Cell => ({ row, col });

describe('extendPath', () => {
  it('starts a path and appends neighbours in any direction', () => {
    let path = extendPath([], c(0, 0));
    path = extendPath(path, c(0, 1)); // right
    path = extendPath(path, c(1, 2)); // diagonal
    path = extendPath(path, c(2, 2)); // down
    path = extendPath(path, c(2, 1)); // left
    expect(path).toEqual([c(0, 0), c(0, 1), c(1, 2), c(2, 2), c(2, 1)]);
  });

  it('ignores non-neighbours, the current cell and cells already in the path', () => {
    const path = [c(0, 0), c(0, 1), c(1, 1)];
    expect(extendPath(path, c(3, 3))).toEqual(path);
    expect(extendPath(path, c(1, 1))).toEqual(path);
    expect(extendPath(path, c(0, 0))).toEqual(path); // neighbour, but already used
  });

  it('steps back when moving onto the second-last cell', () => {
    expect(extendPath([c(0, 0), c(0, 1), c(1, 1)], c(0, 1))).toEqual([c(0, 0), c(0, 1)]);
  });
});

describe('tapPath', () => {
  it('builds a path tap by tap and submits on tapping the last cell again', () => {
    let state = tapPath([], c(1, 1));
    expect(state).toEqual({ path: [c(1, 1)], submit: null });
    state = tapPath(state.path, c(2, 2));
    state = tapPath(state.path, c(2, 3));
    expect(state.path).toEqual([c(1, 1), c(2, 2), c(2, 3)]);
    state = tapPath(state.path, c(2, 3));
    expect(state).toEqual({ path: [], submit: [c(1, 1), c(2, 2), c(2, 3)] });
  });

  it('undoes with the second-last cell and restarts on a far cell', () => {
    expect(tapPath([c(0, 0), c(0, 1)], c(0, 0)).path).toEqual([c(0, 0)]);
    expect(tapPath([c(0, 0), c(0, 1)], c(5, 5))).toEqual({ path: [c(5, 5)], submit: null });
  });

  it('restarts when tapping a used cell that is not adjacent to the end', () => {
    expect(tapPath([c(0, 0), c(0, 1), c(0, 2), c(1, 2)], c(0, 0)).path).toEqual([c(0, 0)]);
  });
});
