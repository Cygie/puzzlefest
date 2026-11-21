import { afterEach, describe, expect, it, vi } from 'vitest';

import { readStored, removeStored, writeStored } from './storage';

const isNumberList = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((n) => typeof n === 'number');

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('storage', () => {
  it('writes and reads a value', () => {
    expect(writeStored('test', 1, [1, 2, 3])).toBe(true);
    expect(readStored('test', 1, isNumberList)).toEqual([1, 2, 3]);
  });

  it('uses a namespaced key', () => {
    writeStored('test', 1, [1]);
    expect(localStorage.getItem('puzzlefest:test')).toBe('{"v":1,"data":[1]}');
  });

  it('ignores missing keys, other versions, invalid data and corrupt JSON', () => {
    expect(readStored('missing', 1, isNumberList)).toBeUndefined();
    writeStored('test', 1, [1]);
    expect(readStored('test', 2, isNumberList)).toBeUndefined();
    writeStored('test', 1, ['a']);
    expect(readStored('test', 1, isNumberList)).toBeUndefined();
    localStorage.setItem('puzzlefest:test', '{not json');
    expect(readStored('test', 1, isNumberList)).toBeUndefined();
    localStorage.setItem('puzzlefest:test', 'null');
    expect(readStored('test', 1, isNumberList)).toBeUndefined();
  });

  it('removes a value', () => {
    writeStored('test', 1, [1]);
    removeStored('test');
    expect(readStored('test', 1, isNumberList)).toBeUndefined();
  });

  it('reports failure when storage throws (e.g. full or blocked)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(writeStored('test', 1, [1])).toBe(false);
  });
});
