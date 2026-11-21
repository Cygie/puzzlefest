export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'manual';

interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Shares a link via the system share sheet (Android), falls back to copying it to the
 * clipboard, and finally returns 'manual' so the UI can show the link for manual copying.
 */
export async function shareLink(data: ShareData): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Other failures (e.g. not allowed): try the clipboard instead.
    }
  }
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(data.url);
      return 'copied';
    } catch {
      // Clipboard blocked: fall through to manual copy.
    }
  }
  return 'manual';
}
