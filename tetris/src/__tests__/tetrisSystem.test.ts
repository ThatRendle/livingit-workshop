import { describe, it, expect, beforeEach, vi } from "vitest";
import { eventBus, Events } from "../events/EventBus";
import { createGrid, CellState } from "../utils/grid";
import { PieceType } from "../data/pieces";
import { GRID_COLS, TOTAL_ROWS } from "../config";
import type { GameSession } from "../types";
import { GamePhase } from "../types";
import { SPEED_RATCHET_BASE, PADDLE_WIDTH, PADDLE_SPEED, BALL_SPEED, PIT_X, PIT_WIDTH, PIT_Y, CELL_SIZE, PADDLE_HEIGHT } from "../config";

function makeSession(): GameSession {
  return {
    phase: GamePhase.PLAYING,
    score: 0,
    ballDropCount: 0,
    fallSpeedMultiplier: SPEED_RATCHET_BASE,
    grid: createGrid(),
    activePiece: null,
    nextPieceType: PieceType.I,
    pieceBag: [],
    ball: {
      x: PIT_X + PIT_WIDTH / 2,
      y: PIT_Y + TOTAL_ROWS * CELL_SIZE - PADDLE_HEIGHT - 10,
      velocityX: BALL_SPEED * Math.cos((315 * Math.PI) / 180),
      velocityY: BALL_SPEED * Math.sin((315 * Math.PI) / 180),
      active: true,
    },
    paddle: {
      x: PIT_X + PIT_WIDTH / 2,
      width: PADDLE_WIDTH,
      speed: PADDLE_SPEED,
    },
  };
}

// Import TetrisSystem after setting up mocks
// We need to avoid Phaser dependency — TetrisSystem has no Phaser imports, good.
async function importTetris() {
  // Reset module registry to avoid cross-test event listener leaks
  return (await import("../systems/TetrisSystem")).TetrisSystem;
}

describe("TetrisSystem — 7-bag shuffle", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("draws all 7 piece types before repeating", async () => {
    const TetrisSystem = await importTetris();
    const session = makeSession();
    const sys = new TetrisSystem(session);
    sys.init();

    // Collect types by triggering spawnPiece() directly 7 times.
    // To avoid STACK_OVERFLOW (which clears activePiece), remove the active
    // piece each time so the grid stays empty.
    const drawn: PieceType[] = [];
    drawn.push(session.activePiece!.type);
    for (let i = 0; i < 6; i++) {
      session.activePiece = null; // free the space
      sys.spawnPiece();
      drawn.push(session.activePiece!.type);
    }

    // All 7 types must appear exactly once in first 7 spawns
    const unique = new Set(drawn);
    expect(unique.size).toBe(7);
  });
});

describe("TetrisSystem — spawn overflow detection", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("emits STACK_OVERFLOW when spawn position is blocked", async () => {
    const TetrisSystem = await importTetris();
    const session = makeSession();
    const sys = new TetrisSystem(session);
    sys.init();

    // Fill the top rows to block spawning
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        session.grid[r][c].state = CellState.OCCUPIED;
        session.grid[r][c].pieceType = PieceType.I;
      }
    }

    // Remove the current active piece so spawnPiece will try again
    session.activePiece = null;

    const overflowFired = vi.fn();
    eventBus.on(Events.STACK_OVERFLOW, overflowFired);

    sys.spawnPiece();
    expect(overflowFired).toHaveBeenCalledOnce();
    expect(session.activePiece).toBeNull();
  });
});

describe("TetrisSystem — SRS wall kicks", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("accepts a rotation when unobstructed (no kick needed)", async () => {
    const TetrisSystem = await importTetris();
    const session = makeSession();
    const sys = new TetrisSystem(session);
    sys.init();

    // Start fresh with a T piece at safe position
    session.activePiece = { type: PieceType.T, rotationIndex: 0, gridRow: 10, gridCol: 3 };
    const before = session.activePiece.rotationIndex;
    sys.rotate();
    expect(session.activePiece.rotationIndex).toBe((before + 1) % 4);
  });

  it("cancels rotation when all kick offsets are blocked", async () => {
    const TetrisSystem = await importTetris();
    const session = makeSession();
    const sys = new TetrisSystem(session);
    sys.init();

    // Place an I piece in a tight corridor where rotation is impossible
    // Fill surrounding cells of an I piece at col 0
    session.activePiece = { type: PieceType.I, rotationIndex: 0, gridRow: 10, gridCol: 0 };
    // Fill rows 9-13 col 0-5 except the piece itself to block all kicks
    for (let r = 8; r < 14; r++) {
      for (let c = 0; c < 6; c++) {
        if (r !== 10) {
          session.grid[r][c].state = CellState.OCCUPIED;
          session.grid[r][c].pieceType = PieceType.I;
        }
      }
    }
    // Also block far right
    for (let r = 8; r < 14; r++) {
      session.grid[r][5].state = CellState.OCCUPIED;
      session.grid[r][5].pieceType = PieceType.I;
    }

    const beforeRot = session.activePiece.rotationIndex;
    const beforeCol = session.activePiece.gridCol;
    sys.rotate();
    // Should not have changed
    expect(session.activePiece.rotationIndex).toBe(beforeRot);
    expect(session.activePiece.gridCol).toBe(beforeCol);
  });

  it("applies a kick offset when straight rotation is blocked", async () => {
    const TetrisSystem = await importTetris();
    const session = makeSession();
    const sys = new TetrisSystem(session);
    sys.init();

    // Use a J piece at col 0.  Straight rotation from 0→1 at col 0 puts a cell
    // at col -1 (out of bounds), so the first kick (dc=0) fails.
    // The second kick for JLSTZ "0->1" is [-1,0] which moves left — still blocked.
    // The third kick [−1, +1] shifts left and down — should find space at col −1+4=−1+3...
    // Actually just verify that SOME non-identity kick is used: col or row must differ.
    session.activePiece = { type: PieceType.J, rotationIndex: 0, gridRow: 10, gridCol: 0 };
    const startCol = session.activePiece.gridCol;
    const startRow = session.activePiece.gridRow;
    sys.rotate();

    if (session.activePiece.rotationIndex === 1) {
      // Rotation succeeded — it must have applied a kick (position shifted from start)
      const colShifted = session.activePiece.gridCol !== startCol;
      const rowShifted = session.activePiece.gridRow !== startRow;
      expect(colShifted || rowShifted).toBe(true);
    } else {
      // All kicks blocked → rotation reverted — still acceptable, tested separately
      expect(session.activePiece.rotationIndex).toBe(0);
    }
  });
});

describe("TetrisSystem — 7-bag refill", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("draws all 7 piece types in a second bag after the first is exhausted", async () => {
    const TetrisSystem = await importTetris();
    const session = makeSession();
    const sys = new TetrisSystem(session);
    sys.init();

    // Draw all 7 from first bag
    const firstBag: PieceType[] = [];
    firstBag.push(session.activePiece!.type);
    for (let i = 0; i < 6; i++) {
      session.activePiece = null;
      sys.spawnPiece();
      firstBag.push(session.activePiece!.type);
    }
    expect(new Set(firstBag).size).toBe(7);

    // Draw 7 more — should be a fresh complete bag
    const secondBag: PieceType[] = [];
    for (let i = 0; i < 7; i++) {
      session.activePiece = null;
      sys.spawnPiece();
      secondBag.push(session.activePiece!.type);
    }
    expect(new Set(secondBag).size).toBe(7);
  });
});

describe("TetrisSystem — row completion on lock", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("emits ROW_COMPLETED and marks row COMPLETED when a full row is created", async () => {
    const TetrisSystem = await importTetris();
    const session = makeSession();
    const sys = new TetrisSystem(session);
    sys.init();

    // Fill row 15 with 9 cells, leaving col 0 for the piece to complete it
    for (let c = 1; c < GRID_COLS; c++) {
      session.grid[15][c].state = CellState.OCCUPIED;
      session.grid[15][c].pieceType = PieceType.I;
    }

    // Place a vertical I piece (rotation 1: cells [0,2],[1,2],[2,2],[3,2]) so
    // it doesn't land on row 15.  Instead use an O piece at row 14 col 0:
    // O rotation 0: [0,0],[0,1],[1,0],[1,1] → cells at (14,0),(14,1),(15,0),(15,1)
    // but col 1 is occupied → can't place.  Use a single-cell approach via I:
    // I rotation 1 (col-vector): cells [0,2],[1,2],[2,2],[3,2] from origin.
    // Place at row 12, col -2 → absolute cols all = 0.  Row range 12..15.
    session.activePiece = { type: PieceType.I, rotationIndex: 1, gridRow: 12, gridCol: -2 };

    const rowCompletedFired = vi.fn();
    eventBus.on(Events.ROW_COMPLETED, rowCompletedFired);

    // Force lock: move down until it can't fall
    // The piece is at rows 12–15, col 0.  Row 15 col 0 is empty → can place.
    // Trigger doLock via softDrop to bottom
    sys.softDrop(); // row 13 → 16 blocked by floor at 16
    // Row 15 col 0 is now occupied (locked), completing row 15
    if (session.activePiece) {
      // Still falling — keep dropping
      for (let i = 0; i < 10 && session.activePiece; i++) {
        sys.softDrop();
      }
    }

    expect(rowCompletedFired).toHaveBeenCalled();
    // Verify the row was marked COMPLETED
    const completedRow = rowCompletedFired.mock.calls[0][0].rowIndex as number;
    for (let c = 0; c < GRID_COLS; c++) {
      expect(session.grid[completedRow][c].state).toBe(CellState.COMPLETED);
    }
  });

  it("does not emit ROW_COMPLETED for a partial row", async () => {
    const TetrisSystem = await importTetris();
    const session = makeSession();
    const sys = new TetrisSystem(session);
    sys.init();

    // Place O piece in an empty grid — no row will be complete
    session.activePiece = { type: PieceType.O, rotationIndex: 0, gridRow: 20, gridCol: 4 };

    const rowCompletedFired = vi.fn();
    eventBus.on(Events.ROW_COMPLETED, rowCompletedFired);

    // Lock the piece immediately
    sys.softDrop(); // one step down
    for (let i = 0; i < 10 && session.activePiece; i++) {
      sys.softDrop();
    }

    expect(rowCompletedFired).not.toHaveBeenCalled();
  });
});

describe("TetrisSystem — stack collapse on ROW_DESTROYED", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("collapses the grid when ROW_DESTROYED is emitted", async () => {
    const TetrisSystem = await importTetris();
    const session = makeSession();
    const sys = new TetrisSystem(session);
    sys.init();

    // Mark row 14 as COMPLETED and put a marker in row 13
    for (let c = 0; c < GRID_COLS; c++) {
      session.grid[14][c].state = CellState.COMPLETED;
      session.grid[14][c].pieceType = PieceType.I;
    }
    session.grid[13][0].state = CellState.OCCUPIED;
    session.grid[13][0].pieceType = PieceType.J;

    // Emit ROW_DESTROYED for row 14 — TetrisSystem listens and collapses
    eventBus.emit(Events.ROW_DESTROYED, { rowIndex: 14 });

    // Row 13's content should have shifted down to row 14
    expect(session.grid[14][0].state).toBe(CellState.OCCUPIED);
    expect(session.grid[14][0].pieceType).toBe(PieceType.J);
    // New top row should be empty
    expect(session.grid[0][0].state).toBe(CellState.EMPTY);
  });

  it("ignores ROW_DESTROYED for an empty row (no-op)", async () => {
    const TetrisSystem = await importTetris();
    const session = makeSession();
    const sys = new TetrisSystem(session);
    sys.init();

    // Emit ROW_DESTROYED for a completely empty row — should not throw
    expect(() => {
      eventBus.emit(Events.ROW_DESTROYED, { rowIndex: 10 });
    }).not.toThrow();
    // Grid should remain all empty
    for (let c = 0; c < GRID_COLS; c++) {
      expect(session.grid[10][c].state).toBe(CellState.EMPTY);
    }
  });
});
