import { isWoordslangPuzzle } from '../logic/validatePuzzle';
import type { WoordslangPuzzle } from '../logic/types';

/** Every JSON file in this folder, bundled with the site (never generated while playing). */
const files = import.meta.glob<unknown>('./*.json', { eager: true, import: 'default' });

/** Raw file contents by file name (without folder and extension), for the CI test. */
export const PUZZLE_FILES: ReadonlyMap<string, unknown> = new Map(
  Object.entries(files).map(([path, data]) => [path.replace(/^\.\/|\.json$/g, ''), data]),
);

const PUZZLES: readonly WoordslangPuzzle[] = [...PUZZLE_FILES.values()]
  .filter(isWoordslangPuzzle)
  .sort((a, b) => a.theme.localeCompare(b.theme, 'nl'));

/** Published puzzles, sorted by theme. */
export function publishedPuzzles(): readonly WoordslangPuzzle[] {
  return PUZZLES;
}

export function findPuzzle(id: string): WoordslangPuzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}
