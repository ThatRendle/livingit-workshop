import { GRID_COLS, TOTAL_ROWS } from "../config";
import type { PieceType } from "../data/pieces";
import { PIECE_DEFINITIONS } from "../data/pieces";

export enum CellState {
  EMPTY = 0,
  OCCUPIED = 1,
  COMPLETED = 2,
}

export interface Cell {
  state: CellState;
  pieceType: PieceType | null;
}

export type Grid = Cell[][];

export interface ActivePiece {
  type: PieceType;
  rotationIndex: number;
  gridRow: number;
  gridCol: number;
}

export function createGrid(): Grid {
  const grid: Grid = [];
  for (let r = 0; r < TOTAL_ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({ state: CellState.EMPTY, pieceType: null });
    }
    grid.push(row);
  }
  return grid;
}

/** Returns the absolute [row, col] positions occupied by a piece. */
export function getPieceCells(piece: ActivePiece): ReadonlyArray<readonly [number, number]> {
  const def = PIECE_DEFINITIONS[piece.type];
  const offsets = def.rotations[piece.rotationIndex];
  const cells: Array<readonly [number, number]> = [];
  for (const [dr, dc] of offsets) {
    cells.push([piece.gridRow + dr, piece.gridCol + dc]);
  }
  return cells;
}

/** Returns true if the piece can be placed at its current position. */
export function canPlace(grid: Grid, piece: ActivePiece): boolean {
  const cells = getPieceCells(piece);
  for (const [r, c] of cells) {
    if (r < 0 || r >= TOTAL_ROWS || c < 0 || c >= GRID_COLS) return false;
    if (grid[r][c].state !== CellState.EMPTY) return false;
  }
  return true;
}

/** Writes the piece cells into the grid as OCCUPIED. */
export function lockPiece(grid: Grid, piece: ActivePiece): void {
  const cells = getPieceCells(piece);
  for (const [r, c] of cells) {
    grid[r][c].state = CellState.OCCUPIED;
    grid[r][c].pieceType = piece.type;
  }
}

/** Returns true if every cell in a row is non-EMPTY. */
export function isRowComplete(grid: Grid, rowIndex: number): boolean {
  for (let c = 0; c < GRID_COLS; c++) {
    if (grid[rowIndex][c].state === CellState.EMPTY) return false;
  }
  return true;
}

/** Marks all cells in a row as COMPLETED (no pieceType change). */
export function markRowCompleted(grid: Grid, rowIndex: number): void {
  for (let c = 0; c < GRID_COLS; c++) {
    grid[rowIndex][c].state = CellState.COMPLETED;
  }
}

/** Removes a row and inserts a new EMPTY row at index 0. */
export function collapseRow(grid: Grid, rowIndex: number): void {
  // Clear the row in place (mark cells empty), then shift rows down
  // We do this by moving cell references rather than allocating new objects
  for (let r = rowIndex; r > 0; r--) {
    for (let c = 0; c < GRID_COLS; c++) {
      grid[r][c].state = grid[r - 1][c].state;
      grid[r][c].pieceType = grid[r - 1][c].pieceType;
    }
  }
  // Clear the new top row
  for (let c = 0; c < GRID_COLS; c++) {
    grid[0][c].state = CellState.EMPTY;
    grid[0][c].pieceType = null;
  }
}

/** Returns the row range [minRow, maxRow] that a piece occupies. */
export function getPieceRowRange(piece: ActivePiece): readonly [number, number] {
  const def = PIECE_DEFINITIONS[piece.type];
  const offsets = def.rotations[piece.rotationIndex];
  let minR = Infinity;
  let maxR = -Infinity;
  for (const [dr] of offsets) {
    const r = piece.gridRow + dr;
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
  }
  return [minR, maxR];
}
