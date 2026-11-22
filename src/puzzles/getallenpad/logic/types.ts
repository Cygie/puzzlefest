import type { Cell } from '@/shared/grid/cells';

export type { Cell };

export const LEVELS = ['makkelijk', 'normaal', 'moeilijk'] as const;
export type Level = (typeof LEVELS)[number];

/** How hard a puzzle is, stored with the puzzle so the levels can be compared. */
export interface DifficultyMetric {
  /** Share of cells that are given (0..1). */
  givenRatio: number;
  /** Search nodes the solver visited to prove the solution is unique. */
  solverNodes: number;
}

/** A value per cell, one array per row; `null` is an empty cell. */
export type ValueRows<T> = T[][];

/**
 * A published getallenpad puzzle: the values 1..N form one path of touching cells
 * (8 directions) that visits every cell once.
 */
export interface GetallenpadPuzzle {
  version: 1;
  /** Stable id, used in the URL and for saved progress. */
  id: string;
  level: Level;
  width: number;
  height: number;
  /** The full path: every value 1..N exactly once. */
  solution: ValueRows<number>;
  /** The numbers shown to the player; `null` cells are filled in by the player. */
  givens: ValueRows<number | null>;
  metric: DifficultyMetric;
  /** Generator seed, to reproduce the puzzle. */
  seed?: number;
}

/** What the player has done; kept apart from the puzzle definition. */
export interface PlayerState {
  /** Row-major; values the player entered in non-given cells (`null` = empty). */
  entries: (number | null)[];
  /** Earlier `entries`, most recent last, for undo. */
  history: (number | null)[][];
}

export const MIN_GRID_SIZE = 3;
export const MAX_GRID_SIZE = 10;
