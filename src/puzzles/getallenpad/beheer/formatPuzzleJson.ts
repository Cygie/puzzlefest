/** Pretty JSON with every grid row on one line, ready for `src/puzzles/getallenpad/data/`. */
export function formatPuzzleJson(puzzle: unknown): string {
  return `${JSON.stringify(puzzle, null, 2).replace(
    /\[\s*((?:-?\d+|null)(?:,\s*(?:-?\d+|null))*)\s*\]/g,
    (_, values: string) => `[${values.split(/,\s*/).join(', ')}]`,
  )}\n`;
}
