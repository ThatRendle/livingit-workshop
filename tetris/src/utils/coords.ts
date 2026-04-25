import { CELL_SIZE, PIT_X, PIT_Y } from "../config";

/** Convert grid [row, col] to canvas pixel [x, y] (top-left corner of cell). */
export function gridToPixel(row: number, col: number): readonly [number, number] {
  return [PIT_X + col * CELL_SIZE, PIT_Y + row * CELL_SIZE];
}

/** Convert canvas pixel [x, y] to grid [row, col] (floor division). */
export function pixelToGrid(x: number, y: number): readonly [number, number] {
  return [Math.floor((y - PIT_Y) / CELL_SIZE), Math.floor((x - PIT_X) / CELL_SIZE)];
}
