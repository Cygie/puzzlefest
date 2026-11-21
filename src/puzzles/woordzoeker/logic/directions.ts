import type { Cell } from '@/shared/grid/cells';

import type { Difficulty, Direction } from './types';

export interface Vector {
  dRow: number;
  dCol: number;
}

export type { Cell };

export const DIRECTION_VECTORS: Readonly<Record<Direction, Vector>> = {
  E: { dRow: 0, dCol: 1 },
  S: { dRow: 1, dCol: 0 },
  SE: { dRow: 1, dCol: 1 },
  NE: { dRow: -1, dCol: 1 },
  W: { dRow: 0, dCol: -1 },
  N: { dRow: -1, dCol: 0 },
  NW: { dRow: -1, dCol: -1 },
  SW: { dRow: 1, dCol: -1 },
};

export const ALL_DIRECTIONS: readonly Direction[] = ['E', 'S', 'SE', 'NE', 'W', 'N', 'NW', 'SW'];

export const DIRECTIONS_BY_DIFFICULTY: Readonly<Record<Difficulty, readonly Direction[]>> = {
  makkelijk: ['E', 'S'],
  normaal: ['E', 'S', 'SE', 'NE'],
  moeilijk: ALL_DIRECTIONS,
};

/** Cells covered by a word of `length` letters starting at (row, col) in `direction`. */
export function wordCells(row: number, col: number, direction: Direction, length: number): Cell[] {
  const { dRow, dCol } = DIRECTION_VECTORS[direction];
  return Array.from({ length }, (_, i) => ({ row: row + dRow * i, col: col + dCol * i }));
}
