import { describe, expect, it } from 'vitest';

import type { Cell } from './cells';
import { findPathProblem, isValidPath } from './paths';

const p = (...pairs: [number, number][]): Cell[] => pairs.map(([row, col]) => ({ row, col }));

describe('findPathProblem', () => {
  it('accepts a path with straight and diagonal steps', () => {
    expect(findPathProblem(p([0, 0], [0, 1], [1, 2], [2, 1]), 3, 3)).toBeNull();
    expect(isValidPath(p([0, 0], [1, 1]), 2, 2)).toBe(true);
  });

  it('accepts an empty path and a single cell', () => {
    expect(findPathProblem([], 3, 3)).toBeNull();
    expect(findPathProblem(p([2, 2]), 3, 3)).toBeNull();
  });

  it('reports a cell outside the grid', () => {
    expect(findPathProblem(p([0, 0], [0, 1], [0, 2]), 2, 2)).toEqual({
      kind: 'out-of-bounds',
      index: 2,
    });
    expect(findPathProblem(p([-1, 0]), 2, 2)).toEqual({ kind: 'out-of-bounds', index: 0 });
  });

  it('reports a step to a cell that does not touch', () => {
    expect(findPathProblem(p([0, 0], [0, 2]), 3, 3)).toEqual({ kind: 'not-adjacent', index: 1 });
    expect(isValidPath(p([0, 0], [2, 2]), 3, 3)).toBe(false);
  });

  it('reports a cell that is visited twice', () => {
    expect(findPathProblem(p([0, 0], [0, 1], [1, 1], [0, 0]), 2, 2)).toEqual({
      kind: 'repeated-cell',
      index: 3,
    });
  });

  it('treats staying on the same cell as not adjacent', () => {
    expect(findPathProblem(p([1, 1], [1, 1]), 3, 3)).toEqual({ kind: 'not-adjacent', index: 1 });
  });
});
