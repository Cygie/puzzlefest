/** A cell in a letter grid (row 0 is the top row). */
export interface Cell {
  row: number;
  col: number;
}

/** Screen rectangle of a grid (as returned by getBoundingClientRect). */
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function sameCell(a: Cell | null | undefined, b: Cell | null | undefined): boolean {
  return !!a && !!b && a.row === b.row && a.col === b.col;
}

/** Row-major index of a cell. */
export function cellIndex(cell: Cell, width: number): number {
  return cell.row * width + cell.col;
}

/** True when two different cells touch horizontally, vertically or diagonally. */
export function isNeighbour(a: Cell, b: Cell): boolean {
  const dRow = Math.abs(a.row - b.row);
  const dCol = Math.abs(a.col - b.col);
  return dRow <= 1 && dCol <= 1 && dRow + dCol > 0;
}

export function inGrid(cell: Cell, width: number, height: number): boolean {
  return cell.row >= 0 && cell.col >= 0 && cell.row < height && cell.col < width;
}

/**
 * Converts a screen point to a grid cell. With `clamp`, points outside the grid snap to
 * the nearest edge cell (useful while swiping); otherwise they return null.
 */
export function cellFromPoint(
  x: number,
  y: number,
  rect: Rect,
  width: number,
  height: number,
  clamp = false,
): Cell | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const col = Math.floor(((x - rect.left) / rect.width) * width);
  const row = Math.floor(((y - rect.top) / rect.height) * height);
  if (clamp) {
    return {
      row: Math.min(height - 1, Math.max(0, row)),
      col: Math.min(width - 1, Math.max(0, col)),
    };
  }
  if (row < 0 || col < 0 || row >= height || col >= width) return null;
  return { row, col };
}

/**
 * Like `cellFromPoint`, but only when the point is within `radius` (fraction of a cell)
 * of the cell centre. Used while dragging a path, so cutting a corner diagonally does
 * not pick up the orthogonal neighbour on the way.
 */
export function cellNearPoint(
  x: number,
  y: number,
  rect: Rect,
  width: number,
  height: number,
  radius: number,
): Cell | null {
  const cell = cellFromPoint(x, y, rect, width, height);
  if (!cell) return null;
  const fx = ((x - rect.left) / rect.width) * width - (cell.col + 0.5);
  const fy = ((y - rect.top) / rect.height) * height - (cell.row + 0.5);
  return Math.hypot(fx, fy) <= radius ? cell : null;
}
