const PREFIX = 'puzzlefest:';

interface Envelope {
  v: number;
  data: unknown;
}

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Reads a stored value. Returns `undefined` when storage is unavailable, the key is
 * missing, the JSON is corrupt, the version differs or `isValid` rejects the data.
 */
export function readStored<T>(
  key: string,
  version: number,
  isValid: (value: unknown) => value is T,
): T | undefined {
  try {
    const raw = storage()?.getItem(PREFIX + key);
    if (raw == null) return undefined;
    const parsed = JSON.parse(raw) as Partial<Envelope> | null;
    if (!parsed || parsed.v !== version) return undefined;
    return isValid(parsed.data) ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

/** Stores a value with a version tag. Returns false when storage is unavailable or full. */
export function writeStored(key: string, version: number, data: unknown): boolean {
  try {
    const store = storage();
    if (!store) return false;
    store.setItem(PREFIX + key, JSON.stringify({ v: version, data } satisfies Envelope));
    return true;
  } catch {
    return false;
  }
}

export function removeStored(key: string): void {
  try {
    storage()?.removeItem(PREFIX + key);
  } catch {
    // Ignore: nothing to remove when storage is unavailable.
  }
}
