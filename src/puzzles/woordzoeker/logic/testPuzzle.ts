import type { Puzzle } from './types';

/** Small valid puzzle shared by tests. */
export const TEST_PUZZLE: Puzzle = {
  version: 1,
  width: 5,
  height: 5,
  difficulty: 'moeilijk',
  seed: 1,
  grid: ['KATGO', 'HONDE', 'VISDD', 'XYZQA', 'WVUAN'],
  words: [
    { display: 'kat', letters: 'KAT', row: 0, col: 0, direction: 'E', length: 3 },
    { display: 'hond', letters: 'HOND', row: 1, col: 0, direction: 'E', length: 4 },
    { display: 'vis', letters: 'VIS', row: 2, col: 0, direction: 'E', length: 3 },
  ],
  themeId: 'dieren',
};
