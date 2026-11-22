import { describe, expect, it } from 'vitest';

import { isWoordslangPuzzle, validatePuzzle } from '../logic/validatePuzzle';
import { findPuzzle, PUZZLE_FILES, publishedPuzzles } from '.';

describe('published woordslang puzzles', () => {
  it('has puzzles', () => {
    expect(PUZZLE_FILES.size).toBeGreaterThanOrEqual(3);
  });

  it.each([...PUZZLE_FILES])('%s.json is a valid puzzle', (name, data) => {
    expect(isWoordslangPuzzle(data)).toBe(true);
    if (!isWoordslangPuzzle(data)) return;
    expect(data.id).toBe(name);
    const result = validatePuzzle(data);
    expect(result.ok ? [] : result.error.map((e) => e.message)).toEqual([]);
  });

  it('lists every file with unique ids, sorted by theme', () => {
    const puzzles = publishedPuzzles();
    expect(puzzles).toHaveLength(PUZZLE_FILES.size);
    expect(new Set(puzzles.map((p) => p.id)).size).toBe(puzzles.length);
    const themes = puzzles.map((p) => p.theme);
    expect(themes).toEqual([...themes].sort((a, b) => a.localeCompare(b, 'nl')));
    expect(findPuzzle('fruit')?.theme).toBe('Fruit');
    expect(findPuzzle('bestaat-niet')).toBeUndefined();
  });
});
