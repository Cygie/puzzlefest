/** Encodes text (UTF-8) as URL-safe base64 without padding. */
export function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decodes URL-safe base64 (UTF-8) text; returns null for invalid input. */
export function decodeBase64Url(code: string): string | null {
  if (!/^[A-Za-z0-9_-]*$/.test(code)) return null;
  try {
    const base64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}
