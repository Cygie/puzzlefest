import { describe, expect, it } from 'vitest';

import { decodeBase64Url, encodeBase64Url } from './base64url';

describe('base64url', () => {
  it('round-trips text including accents and emoji', () => {
    for (const text of ['', 'kat', 'café crème – ijs', '[1,"x"]', '😀 oké?']) {
      const code = encodeBase64Url(text);
      expect(code).toMatch(/^[A-Za-z0-9_-]*$/);
      expect(decodeBase64Url(code)).toBe(text);
    }
  });

  it('rejects invalid input', () => {
    expect(decodeBase64Url('abc$')).toBeNull();
    expect(decodeBase64Url('a')).toBeNull();
    expect(decodeBase64Url('_w')).toBeNull(); // not valid UTF-8
  });
});
