import { useRef, useState } from 'react';

import type { Cell } from '@/shared/grid/cells';
import type { GridController } from '@/shared/grid/Grid';
import { extendPath } from '@/shared/grid/pathSelection';

/** Pointer must be within this fraction of a cell from its centre to enter it while dragging. */
const MOVE_RADIUS = 0.42;

interface NumberDragHandlers {
  /** A drag over at least two cells ended. */
  onDrag: (path: Cell[]) => void;
  /** A cell was pressed and released without dragging. */
  onTap: (cell: Cell) => void;
}

/** Grid controller for getallenpad: drag through touching cells, or tap one cell. */
export function useNumberDrag({ onDrag, onTap }: NumberDragHandlers): GridController {
  const [path, setPathState] = useState<Cell[]>([]);
  const current = useRef<Cell[]>([]);

  const setPath = (next: Cell[]) => {
    current.current = next;
    setPathState(next);
  };

  return {
    preview: path.length > 1 ? path : null,
    moveRadius: MOVE_RADIUS,
    start: (cell) => setPath([cell]),
    move: (cell) => {
      if (current.current.length === 0) return;
      setPath(extendPath(current.current, cell));
    },
    end: () => {
      const done = current.current;
      setPath([]);
      if (done.length > 1) onDrag(done);
      else if (done[0]) onTap(done[0]);
    },
    cancel: () => setPath([]),
  };
}
