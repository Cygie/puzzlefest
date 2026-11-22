import { describe, expect, it } from 'vitest';

import { uniquenessCheck } from '../logic/solve';
import { LEVELS } from '../logic/types';
import { isGetallenpadPuzzle, validatePuzzle } from '../logic/validatePuzzle';
import { findPuzzle, PUZZLE_FILES, publishedPuzzles } from '.';

describe('published getallenpad puzzles', () => {
  it.each([...PUZZLE_FILES])('%s.json is a valid puzzle with one solution', (name, data) => {
    expect(isGetallenpadPuzzle(data)).toBe(true);
    if (!isGetallenpadPuzzle(data)) return;
    expect(data.id).toBe(name);
    const result = validatePuzzle(data, { countSolutions: uniquenessCheck });
    expect(result.ok ? [] : result.error.map((e) => e.message)).toEqual([]);
  });

  it('has every level, unique ids, easiest level first', () => {
    const puzzles = publishedPuzzles();
    expect(puzzles).toHaveLength(PUZZLE_FILES.size);
    expect(new Set(puzzles.map((p) => p.id)).size).toBe(puzzles.length);
    const levels = puzzles.map((p) => LEVELS.indexOf(p.level));
    expect(new Set(levels).size).toBe(LEVELS.length);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(findPuzzle(puzzles[0]!.id)).toBe(puzzles[0]);
    expect(findPuzzle('bestaat-niet')).toBeUndefined();
  });
});
