import { describe, expect, it } from 'vitest';

import { err, ok, type Result } from './result';

describe('Result', () => {
  it('wraps success and failure', () => {
    const parse = (s: string): Result<number, string> =>
      /^\d+$/.test(s) ? ok(Number(s)) : err(`geen getal: ${s}`);
    expect(parse('42')).toEqual({ ok: true, value: 42 });
    expect(parse('x')).toEqual({ ok: false, error: 'geen getal: x' });
  });
});
