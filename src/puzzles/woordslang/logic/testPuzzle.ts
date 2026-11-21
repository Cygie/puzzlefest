import type { WoordslangPuzzle } from './types';

const p = (...cells: [number, number][]) => cells.map(([row, col]) => ({ row, col }));

/**
 * Valid hand-made 6×8 test puzzle (theme "Fruit"). The words follow the rows as a snake;
 * FRUITMAND is the key word (touches the left and right edge).
 */
export function testPuzzle(): WoordslangPuzzle {
  return {
    version: 1,
    id: 'test-fruit',
    theme: 'Fruit',
    hint: 'Gezond en zoet',
    width: 6,
    height: 8,
    grid: ['FRUITM', 'NABDNA', 'AANAPP', 'REEPLE', 'DRUIFC', 'NEORTI', 'KIWIVI', 'SREKGJ'],
    words: [
      {
        display: 'fruitmand',
        letters: 'FRUITMAND',
        path: p([0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 5], [1, 4], [1, 3]),
        key: true,
      },
      {
        display: 'banaan',
        letters: 'BANAAN',
        path: p([1, 2], [1, 1], [1, 0], [2, 0], [2, 1], [2, 2]),
      },
      { display: 'appel', letters: 'APPEL', path: p([2, 3], [2, 4], [2, 5], [3, 5], [3, 4]) },
      { display: 'peer', letters: 'PEER', path: p([3, 3], [3, 2], [3, 1], [3, 0]) },
      { display: 'druif', letters: 'DRUIF', path: p([4, 0], [4, 1], [4, 2], [4, 3], [4, 4]) },
      {
        display: 'citroen',
        letters: 'CITROEN',
        path: p([4, 5], [5, 5], [5, 4], [5, 3], [5, 2], [5, 1], [5, 0]),
      },
      { display: 'kiwi', letters: 'KIWI', path: p([6, 0], [6, 1], [6, 2], [6, 3]) },
      { display: 'vijg', letters: 'VIJG', path: p([6, 4], [6, 5], [7, 5], [7, 4]) },
      { display: 'kers', letters: 'KERS', path: p([7, 3], [7, 2], [7, 1], [7, 0]) },
    ],
  };
}
