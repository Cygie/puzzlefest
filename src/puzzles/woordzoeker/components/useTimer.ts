import { useEffect, useState } from 'react';

const TICK_MS = 250;

/**
 * Elapsed-time counter that only runs while `running` is true and the page is visible
 * (switching apps on the phone pauses it).
 */
export function useTimer(initialMs: number, running: boolean) {
  const [elapsed, setElapsed] = useState(initialMs);

  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    let visible = !document.hidden;

    const tick = () => {
      const now = Date.now();
      // Compute the delta now: the state updater may run later, after `last` has changed.
      const delta = now - last;
      last = now;
      if (visible && delta > 0) setElapsed((ms) => ms + delta);
    };
    const onVisibility = () => {
      tick();
      visible = !document.hidden;
    };

    const id = setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      tick();
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [running]);

  return [elapsed, setElapsed] as const;
}
