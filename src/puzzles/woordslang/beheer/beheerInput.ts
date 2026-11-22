import { toGridLetters } from '../../woordzoeker/logic/normalize';

/** Splits a typed or pasted word list (commas, semicolons, new lines); blanks are dropped. */
export function parseWordList(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map((w) => w.trim())
    .filter(Boolean);
}

/** Number of grid letters of a word (normalized: IJ = 2, accents and hyphens dropped). */
export const letterCount = (word: string) => toGridLetters(word).length;

export type CountStatus =
  | { kind: 'short'; letters: number; cells: number; text: string }
  | { kind: 'exact'; letters: number; cells: number; text: string }
  | { kind: 'over'; letters: number; cells: number; text: string };

/** Live feedback: letters of key word + words against the cells of the grid. */
export function countStatus(words: readonly string[], cells: number): CountStatus {
  const letters = words.reduce((sum, w) => sum + letterCount(w), 0);
  if (letters < cells) {
    return {
      kind: 'short',
      letters,
      cells,
      text: `${letters} van ${cells} letters — nog ${cells - letters} nodig`,
    };
  }
  if (letters > cells) {
    return {
      kind: 'over',
      letters,
      cells,
      text: `${letters} van ${cells} letters — ${letters - cells} te veel`,
    };
  }
  return { kind: 'exact', letters, cells, text: `✓ Precies ${cells} letters` };
}

/** Puzzle id from a theme name, e.g. "Op de boerderij!" → "op-de-boerderij". */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Pretty JSON for a puzzle file: 2-space indent, but each word's path on one line so a
 * puzzle stays readable and diffs stay small.
 */
export function formatPuzzleJson(puzzle: unknown): string {
  return `${JSON.stringify(puzzle, null, 2)
    .replace(/\{\s*"row": (\d+),\s*"col": (\d+)\s*\}/g, '{ "row": $1, "col": $2 }')
    .replace(
      /"path": \[([^\]]*)\]/g,
      (_, cells: string) => `"path": [${cells.trim().replace(/\s*\n\s*/g, ' ')}]`,
    )}\n`;
}
