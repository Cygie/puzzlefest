import type { Cell } from './directions';
import type { NormalizedWord } from './normalize';

export type Difficulty = 'makkelijk' | 'normaal' | 'moeilijk';

/** Compass direction in which a word is read, e.g. `E` = left to right, `W` = backwards. */
export type Direction = 'E' | 'S' | 'SE' | 'NE' | 'W' | 'N' | 'NW' | 'SW';

export interface PlacedWord {
  display: string;
  letters: string;
  /** Row (0-based) of the first letter. */
  row: number;
  /** Column (0-based) of the first letter. */
  col: number;
  direction: Direction;
  length: number;
}

export interface PuzzleSolution {
  display: string;
  letters: string;
}

export interface Puzzle {
  version: 1;
  width: number;
  height: number;
  difficulty: Difficulty;
  seed: number;
  /** `height` rows, each a string of `width` uppercase letters. */
  grid: string[];
  /** Placed words, in input order. */
  words: PlacedWord[];
  /** Hidden solution: the leftover (non-word) cells read row by row. */
  solution?: PuzzleSolution;
  themeId?: string;
}

export interface GenerateInput {
  words: readonly NormalizedWord[];
  width: number;
  height: number;
  difficulty: Difficulty;
  /** Optional hidden solution word or sentence (spaces etc. are ignored). */
  solution?: string;
  seed: number;
  themeId?: string;
}

export type UnplacedCode = 'too-long' | 'no-room';

export interface UnplacedWord {
  word: NormalizedWord;
  code: UnplacedCode;
  /** Dutch, user-facing explanation. */
  reason: string;
}

export type GenerateResult =
  | { ok: true; puzzle: Puzzle }
  | {
      ok: false;
      /** Dutch, user-facing summary. */
      reason: string;
      unplaced: UnplacedWord[];
      /** Best attempt without the failing words / without the solution word, if any. */
      partial?: Puzzle;
    };

/** A found word, stored as the selected start and end cell (serializable). */
export interface FoundWord {
  letters: string;
  start: Cell;
  end: Cell;
}

/** Progress of a player on a puzzle (serializable, used for saving). */
export interface PlayProgress {
  found: FoundWord[];
  elapsedMs: number;
}
