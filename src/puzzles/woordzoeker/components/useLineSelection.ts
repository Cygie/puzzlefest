import { useState } from 'react';

import { type Cell, sameCell } from '@/shared/grid/cells';
import type { GridController } from '@/shared/grid/LetterGrid';

import { type Line, snapLine } from '../logic/selection';

interface Drag {
  start: Cell;
  end: Cell;
}

/**
 * Straight-line selection (woordzoeker): swipe from start to end, or tap the start and
 * then the end cell (tapping the start again cancels). Snaps to the 8 directions.
 */
export function useLineSelection(
  width: number,
  height: number,
  onSelect: (line: Line) => void,
): GridController {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [tapStart, setTapStart] = useState<Cell | null>(null);

  const preview = drag
    ? snapLine(drag.start, drag.end, width, height).cells
    : tapStart
      ? [tapStart]
      : null;

  return {
    preview,
    start: (cell) => setDrag({ start: cell, end: cell }),
    move: (cell) => {
      if (drag && !sameCell(cell, drag.end)) setDrag({ start: drag.start, end: cell });
    },
    end: () => {
      if (!drag) return;
      const { start, end } = drag;
      setDrag(null);
      if (!sameCell(start, end)) {
        // Swipe
        setTapStart(null);
        onSelect(snapLine(start, end, width, height));
      } else if (!tapStart) {
        // First tap: remember the start cell
        setTapStart(start);
      } else if (sameCell(tapStart, start)) {
        // Tapping the start cell again cancels
        setTapStart(null);
      } else {
        // Second tap: select from the first tapped cell
        setTapStart(null);
        onSelect(snapLine(tapStart, start, width, height));
      }
    },
    cancel: () => setDrag(null),
  };
}
