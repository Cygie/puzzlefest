import { useRef, useState } from 'react';

import { type Cell, sameCell } from './cells';
import { extendPath, tapPath } from './pathSelection';
import type { GridController } from './LetterGrid';

/** Pointer must be within this fraction of a cell from its centre to enter it while dragging. */
const PATH_MOVE_RADIUS = 0.42;

/**
 * Free path selection: drag through neighbouring cells (back one cell to undo), or tap
 * cells one by one and tap the last cell again to submit.
 */
export function usePathSelection(onSelect: (path: Cell[]) => void): GridController {
  const [path, setPathState] = useState<Cell[]>([]);
  const current = useRef<Cell[]>([]);
  // Gesture in progress: the tap path before it, and whether the pointer moved to another cell.
  const gesture = useRef<{ before: Cell[]; down: Cell; moved: boolean } | null>(null);

  const setPath = (next: Cell[]) => {
    current.current = next;
    setPathState(next);
  };

  return {
    preview: path.length > 0 ? path : null,
    moveRadius: PATH_MOVE_RADIUS,
    start: (cell) => {
      const before = current.current;
      gesture.current = { before, down: cell, moved: false };
      // Dragging may continue a tapped path from its last cell; otherwise it starts anew.
      if (!sameCell(before[before.length - 1], cell)) setPath([cell]);
    },
    move: (cell) => {
      const g = gesture.current;
      if (!g) return;
      const next = extendPath(current.current, cell);
      if (
        next.length === current.current.length &&
        next.every((c, i) => sameCell(c, current.current[i]))
      )
        return;
      g.moved = true;
      setPath(next);
    },
    end: () => {
      const g = gesture.current;
      gesture.current = null;
      if (!g) return;
      if (g.moved) {
        const selected = current.current;
        setPath([]);
        onSelect(selected);
        return;
      }
      const { path: next, submit } = tapPath(g.before, g.down);
      setPath(next);
      if (submit) onSelect(submit);
    },
    cancel: () => {
      gesture.current = null;
      setPath([]);
    },
  };
}
