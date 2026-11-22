import type { GetallenpadPuzzle } from './types';

/** A valid 4×4 puzzle (snake path) for tests; uniqueness is not claimed. */
export const TEST_PUZZLE: GetallenpadPuzzle = {
  version: 1,
  id: 'test-slang',
  level: 'normaal',
  width: 4,
  height: 4,
  solution: [
    [1, 2, 3, 4],
    [8, 7, 6, 5],
    [9, 10, 11, 12],
    [16, 15, 14, 13],
  ],
  givens: [
    [1, null, null, 4],
    [null, 7, null, null],
    [null, null, 11, null],
    [16, null, null, 13],
  ],
  metric: { givenRatio: 6 / 16, solverNodes: 0 },
};

/** A deep copy of the test puzzle, to change in a test. */
export const testPuzzle = (): GetallenpadPuzzle => structuredClone(TEST_PUZZLE);
