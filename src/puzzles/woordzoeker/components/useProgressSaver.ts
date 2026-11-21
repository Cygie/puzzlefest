import { useCallback, useEffect, useRef } from 'react';

import { updateProgress } from '../logic/savedPuzzles';
import type { PlayProgress } from '../logic/types';

const INTERVAL_MS = 3_000;

/**
 * Returns a stable `onProgress` callback that persists progress of a saved puzzle:
 * immediately when the set of found words changes, otherwise at most every 3 seconds,
 * and always when the app is hidden or the screen closes.
 */
export function useProgressSaver(savedId: string | null) {
  const latest = useRef<PlayProgress | null>(null);
  const lastWrite = useRef({ at: 0, foundCount: -1 });
  const idRef = useRef(savedId);

  const flush = useCallback(() => {
    const id = idRef.current;
    const progress = latest.current;
    if (!id || !progress) return;
    updateProgress(id, progress);
    lastWrite.current = { at: Date.now(), foundCount: progress.found.length };
  }, []);

  useEffect(() => {
    idRef.current = savedId;
    latest.current = null;
    lastWrite.current = { at: 0, foundCount: -1 };
    // Before switching to another (or no) puzzle, write the last progress of this one.
    return () => flush();
  }, [savedId, flush]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [flush]);

  const onProgress = useCallback(
    (progress: PlayProgress) => {
      latest.current = progress;
      const { at, foundCount } = lastWrite.current;
      if (progress.found.length !== foundCount || Date.now() - at >= INTERVAL_MS) flush();
    },
    [flush],
  );

  return { onProgress, flush };
}
