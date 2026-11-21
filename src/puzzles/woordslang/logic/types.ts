import type { Cell } from '@/shared/grid/cells';

export type { Cell };

/** A theme word and the path of neighbouring cells that spells it. */
export interface SlangWord {
  /** As shown to the player (normal Dutch spelling). */
  display: string;
  /** Grid letters A–Z (IJ = two letters), same normalization as the woordzoeker. */
  letters: string;
  /** One cell per letter; each cell touches the previous one (8 directions). */
  path: Cell[];
  /** The key word (sleutelwoord): names the theme, spans two opposite edges. */
  key?: boolean;
}

/** A published woordslang puzzle: the words cover every cell exactly once. */
export interface WoordslangPuzzle {
  version: 1;
  /** Stable id, used in the URL and for saved progress. */
  id: string;
  /** Theme name (shown after solving / in the admin page). */
  theme: string;
  /** Vague hint shown to the player. */
  hint: string;
  width: number;
  height: number;
  /** One string of `width` letters per row. */
  grid: string[];
  words: SlangWord[];
}

export const MIN_GRID_SIZE = 3;
export const MAX_GRID_SIZE = 12;
