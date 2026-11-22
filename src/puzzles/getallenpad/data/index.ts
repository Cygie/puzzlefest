import { type GetallenpadPuzzle, LEVELS } from '../logic/types';
import { isGetallenpadPuzzle } from '../logic/validatePuzzle';

/** Every JSON file in this folder, bundled with the site (never generated while playing). */
const files = import.meta.glob<unknown>('./*.json', { eager: true, import: 'default' });

/** Raw file contents by file name (without folder and extension), for the CI test. */
export const PUZZLE_FILES: ReadonlyMap<string, unknown> = new Map(
  Object.entries(files).map(([path, data]) => [path.replace(/^\.\/|\.json$/g, ''), data]),
);

const PUZZLES: readonly GetallenpadPuzzle[] = [...PUZZLE_FILES.values()]
  .filter(isGetallenpadPuzzle)
  .sort(
    (a, b) =>
      LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) ||
      a.id.localeCompare(b.id, 'nl', { numeric: true }),
  );

/** Published puzzles, easiest level first, then by id. */
export function publishedPuzzles(): readonly GetallenpadPuzzle[] {
  return PUZZLES;
}

export function findPuzzle(id: string): GetallenpadPuzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}
