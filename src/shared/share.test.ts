import { afterEach, describe, expect, it, vi } from 'vitest';

import { shareLink } from './share';

const data = { title: 'Woordzoeker', text: 'Kun jij alle woorden vinden?', url: 'https://x/#/a' };

function setNavigator(props: Record<string, unknown>) {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(navigator, key, { value, configurable: true, writable: true });
  }
}

afterEach(() => {
  setNavigator({ share: undefined, clipboard: undefined });
});

describe('shareLink', () => {
  it('uses the system share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator({ share });
    await expect(shareLink(data)).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith(data);
  });

  it('reports a cancelled share', async () => {
    setNavigator({ share: vi.fn().mockRejectedValue(new DOMException('x', 'AbortError')) });
    await expect(shareLink(data)).resolves.toBe('cancelled');
  });

  it('falls back to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator({
      share: vi.fn().mockRejectedValue(new Error('NotAllowed')),
      clipboard: { writeText },
    });
    await expect(shareLink(data)).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith(data.url);
  });

  it('asks for manual copying when nothing else works', async () => {
    setNavigator({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) } });
    await expect(shareLink(data)).resolves.toBe('manual');
  });
});
