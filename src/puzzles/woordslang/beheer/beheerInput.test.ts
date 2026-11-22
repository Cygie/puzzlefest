import { describe, expect, it } from 'vitest';

import { countStatus, formatPuzzleJson, parseWordList, slugify } from './beheerInput';

describe('parseWordList', () => {
  it('splits on commas, semicolons and new lines', () => {
    expect(parseWordList('appel, peer;\n kiwi\n\n, ')).toEqual(['appel', 'peer', 'kiwi']);
  });
});

describe('countStatus', () => {
  it('reports letters still needed, an exact fit and too many', () => {
    expect(countStatus(['appel', 'ijs'], 10)).toMatchObject({
      kind: 'short',
      letters: 8,
      text: '8 van 10 letters — nog 2 nodig',
    });
    expect(countStatus(['appel', 'peer', 'ui'], 11)).toMatchObject({
      kind: 'exact',
      text: '✓ Precies 11 letters',
    });
    expect(countStatus(['appel', 'peer'], 6)).toMatchObject({
      kind: 'over',
      text: '9 van 6 letters — 3 te veel',
    });
  });
});

describe('slugify', () => {
  it('makes a URL-safe id', () => {
    expect(slugify('Op de boerderij!')).toBe('op-de-boerderij');
    expect(slugify('  Café & Crème ')).toBe('cafe-creme');
  });
});

describe('formatPuzzleJson', () => {
  it('keeps each path on one line and stays valid JSON', () => {
    const value = {
      id: 'x',
      words: [
        {
          display: 'ab',
          path: [
            { row: 0, col: 0 },
            { row: 0, col: 1 },
          ],
        },
      ],
    };
    const text = formatPuzzleJson(value);
    expect(text).toContain('"path": [{ "row": 0, "col": 0 }, { "row": 0, "col": 1 }]');
    expect(JSON.parse(text)).toEqual(value);
  });
});
