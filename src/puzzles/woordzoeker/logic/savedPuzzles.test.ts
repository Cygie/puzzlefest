import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  defaultName,
  deletePuzzle,
  loadSaved,
  MAX_SAVED,
  recordCompletion,
  renamePuzzle,
  savePuzzle,
  updateProgress,
} from './savedPuzzles';
import { TEST_PUZZLE } from './testPuzzle';

const EMPTY = { found: [], elapsedMs: 0 };
const NOW = new Date('2026-11-21T12:00:00Z');

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

function saveOk() {
  const result = savePuzzle(TEST_PUZZLE, EMPTY, NOW);
  if (!result.ok) throw new Error(result.reason);
  return result.saved;
}

describe('savedPuzzles', () => {
  it('saves with a default Dutch name, newest first', () => {
    const first = saveOk();
    const second = saveOk();
    expect(first.name).toBe('Dieren · 21 nov');
    expect(loadSaved().map((s) => s.id)).toEqual([second.id, first.id]);
  });

  it('names puzzles without theme "Eigen woorden"', () => {
    expect(defaultName({ ...TEST_PUZZLE, themeId: undefined }, NOW)).toBe('Eigen woorden · 21 nov');
  });

  it('updates progress', () => {
    const { id } = saveOk();
    const progress = {
      found: [{ letters: 'KAT', start: { row: 0, col: 0 }, end: { row: 0, col: 2 } }],
      elapsedMs: 5000,
    };
    expect(updateProgress(id, progress)).toBe(true);
    expect(loadSaved()[0]?.progress).toEqual(progress);
    expect(updateProgress('onbekend', progress)).toBe(false);
  });

  it('keeps the best time and flags records', () => {
    const { id } = saveOk();
    expect(recordCompletion(id, 90_000)).toEqual({ bestTimeMs: 90_000, isRecord: true });
    expect(recordCompletion(id, 120_000)).toEqual({ bestTimeMs: 90_000, isRecord: false });
    expect(recordCompletion(id, 60_000)).toEqual({ bestTimeMs: 60_000, isRecord: true });
    expect(loadSaved()[0]?.bestTimeMs).toBe(60_000);
    expect(recordCompletion('onbekend', 1)).toBeNull();
  });

  it('renames and rejects empty names', () => {
    const { id } = saveOk();
    expect(renamePuzzle(id, '  Voor oma  ')).toBe(true);
    expect(loadSaved()[0]?.name).toBe('Voor oma');
    expect(renamePuzzle(id, '   ')).toBe(false);
  });

  it('deletes', () => {
    const { id } = saveOk();
    expect(deletePuzzle(id)).toBe(true);
    expect(loadSaved()).toEqual([]);
    expect(deletePuzzle(id)).toBe(false);
  });

  it(`refuses more than ${MAX_SAVED} puzzles`, () => {
    for (let i = 0; i < MAX_SAVED; i++) saveOk();
    const result = savePuzzle(TEST_PUZZLE, EMPTY, NOW);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.reason).toContain('Verwijder er eerst een');
  });

  it('explains when storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const result = savePuzzle(TEST_PUZZLE, EMPTY, NOW);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.reason).toContain('vol of geblokkeerd');
  });

  it('skips corrupted entries', () => {
    saveOk();
    const raw = JSON.parse(localStorage.getItem('puzzlefest:woordzoeker:saved')!);
    raw.data.push({ id: 'kapot', puzzle: { version: 1 } });
    localStorage.setItem('puzzlefest:woordzoeker:saved', JSON.stringify(raw));
    expect(loadSaved()).toHaveLength(1);
  });
});
