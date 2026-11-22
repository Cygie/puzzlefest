import { beforeEach, describe, expect, it } from 'vitest';

import { emptyPlayerState } from './model';
import { loadProgress, puzzleStatus, saveProgress } from './progress';
import { TEST_PUZZLE } from './testPuzzle';

const P = TEST_PUZZLE;
const solvedEntries = () =>
  P.solution.flat().map((v, i) => (P.givens.flat()[i] === null ? v : null));

describe('getallenpad progress', () => {
  beforeEach(() => localStorage.clear());

  it('starts fresh and restores saved entries without history', () => {
    expect(loadProgress(P)).toEqual(emptyPlayerState(P));
    const entries = emptyPlayerState(P).entries;
    entries[4] = 8;
    expect(saveProgress(P.id, entries)).toBe(true);
    expect(loadProgress(P)).toEqual({ entries, history: [] });
  });

  it('drops data that does not fit the puzzle', () => {
    saveProgress(P.id, [1, 2, 3]);
    expect(loadProgress(P)).toEqual(emptyPlayerState(P));
    const entries = emptyPlayerState(P).entries;
    entries[0] = 5; // on a given
    entries[4] = 99; // out of range
    entries[5] = 7;
    saveProgress(P.id, entries);
    expect(loadProgress(P).entries.filter((v) => v !== null)).toEqual([7]);
    localStorage.setItem('puzzlefest:getallenpad:progress', '{"v":1,"data":{"x":["a"]}}');
    expect(loadProgress(P)).toEqual(emptyPlayerState(P));
  });

  it('reports new, busy and solved', () => {
    expect(puzzleStatus(P)).toEqual({ kind: 'new' });
    const entries = emptyPlayerState(P).entries;
    entries[4] = 8;
    saveProgress(P.id, entries);
    expect(puzzleStatus(P)).toEqual({ kind: 'busy', filled: 1, open: 7 });
    saveProgress(P.id, solvedEntries());
    expect(puzzleStatus(P)).toEqual({ kind: 'solved' });
  });
});
