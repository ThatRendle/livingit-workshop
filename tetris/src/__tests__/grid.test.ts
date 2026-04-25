import { describe, it, expect } from "vitest";
import {
  createGrid,
  fillInitialPit,
  isRowComplete,
  markRowCompleted,
  collapseRow,
  canPlace,
  lockPiece,
  CellState,
} from "../utils/grid";
import { PieceType } from "../data/pieces";
import { GRID_COLS, TOTAL_ROWS } from "../config";

function makeOccupiedRow(grid: ReturnType<typeof createGrid>, rowIndex: number) {
  for (let c = 0; c < GRID_COLS; c++) {
    grid[rowIndex][c].state = CellState.OCCUPIED;
    grid[rowIndex][c].pieceType = PieceType.I;
  }
}

describe("createGrid", () => {
  it("creates a grid with TOTAL_ROWS rows and GRID_COLS columns", () => {
    const g = createGrid();
    expect(g.length).toBe(TOTAL_ROWS);
    expect(g[0].length).toBe(GRID_COLS);
  });

  it("initialises all cells as EMPTY with null pieceType", () => {
    const g = createGrid();
    for (let r = 0; r < TOTAL_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        expect(g[r][c].state).toBe(CellState.EMPTY);
        expect(g[r][c].pieceType).toBeNull();
      }
    }
  });
});

describe("isRowComplete", () => {
  it("returns false for an empty row", () => {
    const g = createGrid();
    expect(isRowComplete(g, 10)).toBe(false);
  });

  it("returns false when a row is partially filled", () => {
    const g = createGrid();
    for (let c = 0; c < GRID_COLS - 1; c++) {
      g[5][c].state = CellState.OCCUPIED;
    }
    expect(isRowComplete(g, 5)).toBe(false);
  });

  it("returns true when all cells in a row are non-EMPTY", () => {
    const g = createGrid();
    makeOccupiedRow(g, 5);
    expect(isRowComplete(g, 5)).toBe(true);
  });

  it("returns true for a row of COMPLETED cells", () => {
    const g = createGrid();
    for (let c = 0; c < GRID_COLS; c++) {
      g[3][c].state = CellState.COMPLETED;
    }
    expect(isRowComplete(g, 3)).toBe(true);
  });
});

describe("markRowCompleted", () => {
  it("sets all cells in the row to COMPLETED", () => {
    const g = createGrid();
    makeOccupiedRow(g, 7);
    markRowCompleted(g, 7);
    for (let c = 0; c < GRID_COLS; c++) {
      expect(g[7][c].state).toBe(CellState.COMPLETED);
    }
  });

  it("does not affect other rows", () => {
    const g = createGrid();
    makeOccupiedRow(g, 7);
    markRowCompleted(g, 7);
    expect(g[6][0].state).toBe(CellState.EMPTY);
    expect(g[8][0].state).toBe(CellState.EMPTY);
  });
});

describe("collapseRow", () => {
  it("shifts rows above the destroyed row down by one", () => {
    const g = createGrid();
    // Put a marker in row 5
    g[5][0].state = CellState.OCCUPIED;
    g[5][0].pieceType = PieceType.J;
    // Destroy row 8
    makeOccupiedRow(g, 8);
    collapseRow(g, 8);
    // Row 5 content is now in row 6
    expect(g[6][0].state).toBe(CellState.OCCUPIED);
    expect(g[6][0].pieceType).toBe(PieceType.J);
  });

  it("inserts an EMPTY row at index 0", () => {
    const g = createGrid();
    g[0][0].state = CellState.OCCUPIED;
    collapseRow(g, 5);
    expect(g[0][0].state).toBe(CellState.EMPTY);
    expect(g[0][0].pieceType).toBeNull();
  });

  it("moves the target row's content down (it disappears into row below)", () => {
    const g = createGrid();
    makeOccupiedRow(g, 4);
    collapseRow(g, 4);
    // Row 4 should now contain what was in row 3 (which was EMPTY)
    expect(g[4][0].state).toBe(CellState.EMPTY);
  });
});

describe("canPlace", () => {
  it("returns true for a piece at an empty location", () => {
    const g = createGrid();
    const piece = { type: PieceType.O, rotationIndex: 0, gridRow: 0, gridCol: 0 };
    expect(canPlace(g, piece)).toBe(true);
  });

  it("returns false when a piece would go out of bounds (right)", () => {
    const g = createGrid();
    // O piece at col 9 would put cells at cols 9 and 10 (out of bounds)
    const piece = { type: PieceType.O, rotationIndex: 0, gridRow: 0, gridCol: 9 };
    expect(canPlace(g, piece)).toBe(false);
  });

  it("returns false when a piece would go out of bounds (bottom)", () => {
    const g = createGrid();
    const piece = { type: PieceType.O, rotationIndex: 0, gridRow: TOTAL_ROWS - 1, gridCol: 0 };
    expect(canPlace(g, piece)).toBe(false);
  });

  it("returns false when a piece overlaps an occupied cell", () => {
    const g = createGrid();
    g[1][3].state = CellState.OCCUPIED;
    // O piece at row 0, col 3 → cells [0,3],[0,4],[1,3],[1,4]
    const piece = { type: PieceType.O, rotationIndex: 0, gridRow: 0, gridCol: 3 };
    expect(canPlace(g, piece)).toBe(false);
  });
});

describe("lockPiece", () => {
  it("marks each piece cell as OCCUPIED with the correct pieceType", () => {
    const g = createGrid();
    const piece = { type: PieceType.O, rotationIndex: 0, gridRow: 10, gridCol: 4 };
    lockPiece(g, piece);
    // O piece occupies [10,4], [10,5], [11,4], [11,5]
    expect(g[10][4].state).toBe(CellState.OCCUPIED);
    expect(g[10][4].pieceType).toBe(PieceType.O);
    expect(g[10][5].state).toBe(CellState.OCCUPIED);
    expect(g[11][4].state).toBe(CellState.OCCUPIED);
    expect(g[11][5].state).toBe(CellState.OCCUPIED);
  });

  it("does not affect other cells", () => {
    const g = createGrid();
    const piece = { type: PieceType.O, rotationIndex: 0, gridRow: 10, gridCol: 4 };
    lockPiece(g, piece);
    expect(g[10][3].state).toBe(CellState.EMPTY);
    expect(g[9][4].state).toBe(CellState.EMPTY);
  });
});

describe("fillInitialPit", () => {
  const PIT_TOP = TOTAL_ROWS - 3; // row 23

  it("fills row 23 with all COMPLETED cells", () => {
    const g = createGrid();
    fillInitialPit(g);
    for (let c = 0; c < GRID_COLS; c++) {
      expect(g[PIT_TOP][c].state).toBe(CellState.COMPLETED);
    }
  });

  it("gives every filled cell in row 23 a non-null pieceType", () => {
    const g = createGrid();
    fillInitialPit(g);
    for (let c = 0; c < GRID_COLS; c++) {
      expect(g[PIT_TOP][c].pieceType).not.toBeNull();
    }
  });

  it("rows 24 and 25 are each partially filled (between 1 and 9 cells)", () => {
    const g = createGrid();
    fillInitialPit(g);
    for (const row of [PIT_TOP + 1, PIT_TOP + 2]) {
      const filled = g[row].filter((c) => c.state !== CellState.EMPTY).length;
      expect(filled).toBeGreaterThanOrEqual(1);
      expect(filled).toBeLessThanOrEqual(9);
    }
  });

  it("all non-empty cells in rows 24–25 have a non-null pieceType", () => {
    const g = createGrid();
    fillInitialPit(g);
    for (const row of [PIT_TOP + 1, PIT_TOP + 2]) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (g[row][c].state !== CellState.EMPTY) {
          expect(g[row][c].pieceType).not.toBeNull();
        }
      }
    }
  });

  it("does not touch rows outside the 3-row pit area", () => {
    const g = createGrid();
    fillInitialPit(g);
    // Row above the pit should still be empty
    for (let c = 0; c < GRID_COLS; c++) {
      expect(g[PIT_TOP - 1][c].state).toBe(CellState.EMPTY);
    }
  });
});
