import { describe, it, expect, beforeEach, vi } from "vitest";
import { eventBus, Events } from "../events/EventBus";
import { BreakoutSystem } from "../systems/BreakoutSystem";
import {
  BALL_RADIUS,
  BALL_SPEED,
  PADDLE_HEIGHT,
  PADDLE_SPEED,
  PADDLE_WIDTH,
  PIT_X,
  PIT_WIDTH,
  PIT_Y,
  TOTAL_ROWS,
  CELL_SIZE,
  SPEED_RATCHET_BASE,
  TETRIS_ROWS,
} from "../config";
import { createGrid, CellState, markRowCompleted } from "../utils/grid";
import { PieceType } from "../data/pieces";
import type { GameSession } from "../types";
import { GamePhase } from "../types";

function makeSession(): GameSession {
  const paddleCentreX = PIT_X + PIT_WIDTH / 2;
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
      x: paddleCentreX,
      y: PIT_Y + TOTAL_ROWS * CELL_SIZE - PADDLE_HEIGHT - BALL_RADIUS - 5,
      velocityX: BALL_SPEED * Math.cos((315 * Math.PI) / 180),
      velocityY: BALL_SPEED * Math.sin((315 * Math.PI) / 180),
      active: true,
    },
    paddle: { x: paddleCentreX, width: PADDLE_WIDTH, speed: PADDLE_SPEED },
  };
}

describe("BreakoutSystem — respawn position", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("places ball above paddle centre on respawn", () => {
    const session = makeSession();
    const sys = new BreakoutSystem(session);
    session.paddle.x = PIT_X + 100;
    sys.respawnBall();
    expect(session.ball.x).toBe(session.paddle.x);
    expect(session.ball.y).toBeLessThan(PIT_Y + TOTAL_ROWS * CELL_SIZE - PADDLE_HEIGHT);
    expect(session.ball.active).toBe(true);
  });

  it("sets ball velocity to 315° (upward-right at 45°) on respawn", () => {
    const session = makeSession();
    const sys = new BreakoutSystem(session);
    sys.respawnBall();
    const { velocityX, velocityY } = session.ball;
    expect(velocityX).toBeGreaterThan(0); // rightward
    expect(velocityY).toBeLessThan(0); // upward
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    expect(speed).toBeCloseTo(BALL_SPEED);
  });
});

describe("BreakoutSystem — ball drop detection", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("emits BALL_DROPPED when ball y exceeds pit bottom", () => {
    const session = makeSession();
    const sys = new BreakoutSystem(session);
    const dropped = vi.fn();
    eventBus.on(Events.BALL_DROPPED, dropped);

    // Place ball just below the bottom
    session.ball.y = PIT_Y + TOTAL_ROWS * CELL_SIZE + 10;
    session.ball.active = true;
    sys.update(16);

    expect(dropped).toHaveBeenCalledOnce();
  });
});

describe("BreakoutSystem — wall reflection", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("reflects ball off left wall", () => {
    const session = makeSession();
    const sys = new BreakoutSystem(session);
    session.ball.x = PIT_X + BALL_RADIUS - 2;
    session.ball.velocityX = -100;
    session.ball.velocityY = -100;
    sys.update(1); // small delta so position doesn't move far
    expect(session.ball.velocityX).toBeGreaterThan(0);
  });

  it("reflects ball off right wall", () => {
    const session = makeSession();
    const sys = new BreakoutSystem(session);
    session.ball.x = PIT_X + PIT_WIDTH - BALL_RADIUS + 2;
    session.ball.velocityX = 100;
    session.ball.velocityY = -100;
    sys.update(1);
    expect(session.ball.velocityX).toBeLessThan(0);
  });
});

describe("BreakoutSystem — paddle movement clamping", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("clamps paddle at left wall", () => {
    const session = makeSession();
    session.paddle.x = PIT_X + PADDLE_WIDTH / 2;
    const sys = new BreakoutSystem(session);
    sys.movePaddleLeft(10000); // large delta
    expect(session.paddle.x).toBe(PIT_X + PADDLE_WIDTH / 2);
  });

  it("clamps paddle at right wall", () => {
    const session = makeSession();
    session.paddle.x = PIT_X + PIT_WIDTH - PADDLE_WIDTH / 2;
    const sys = new BreakoutSystem(session);
    sys.movePaddleRight(10000); // large delta
    expect(session.paddle.x).toBe(PIT_X + PIT_WIDTH - PADDLE_WIDTH / 2);
  });
});

describe("BreakoutSystem — cell destruction below complete row", () => {
  // Place ball at the pixel centre of a given grid cell
  function placeBallAtCell(session: GameSession, row: number, col: number) {
    session.ball.x = PIT_X + col * CELL_SIZE + CELL_SIZE / 2;
    session.ball.y = PIT_Y + row * CELL_SIZE + CELL_SIZE / 2;
    session.ball.velocityX = 0;
    session.ball.velocityY = BALL_SPEED; // moving downward — will hit then reflect
    session.ball.active = true;
  }

  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("destroys a single OCCUPIED cell below a COMPLETED row and emits CELL_DESTROYED", () => {
    const session = makeSession();
    // Complete row at top of breakout zone
    for (let c = 0; c < 10; c++) {
      session.grid[TETRIS_ROWS][c].state = CellState.COMPLETED;
      session.grid[TETRIS_ROWS][c].pieceType = PieceType.I;
    }
    // Occupied cell one row below
    session.grid[TETRIS_ROWS + 1][5].state = CellState.OCCUPIED;
    session.grid[TETRIS_ROWS + 1][5].pieceType = PieceType.T;

    const cellDestroyed = vi.fn();
    eventBus.on(Events.CELL_DESTROYED, cellDestroyed);

    const sys = new BreakoutSystem(session);
    placeBallAtCell(session, TETRIS_ROWS + 1, 5);
    sys.update(0);

    expect(cellDestroyed).toHaveBeenCalledOnce();
    expect(cellDestroyed).toHaveBeenCalledWith({ rowIndex: TETRIS_ROWS + 1, colIndex: 5 });
    expect(session.grid[TETRIS_ROWS + 1][5].state).toBe(CellState.EMPTY);
    expect(session.grid[TETRIS_ROWS + 1][5].pieceType).toBeNull();
  });

  it("does NOT destroy an OCCUPIED cell when no COMPLETED row exists above it", () => {
    const session = makeSession();
    // Occupied cell in breakout zone, no complete row anywhere
    session.grid[TETRIS_ROWS + 1][5].state = CellState.OCCUPIED;
    session.grid[TETRIS_ROWS + 1][5].pieceType = PieceType.T;

    const cellDestroyed = vi.fn();
    eventBus.on(Events.CELL_DESTROYED, cellDestroyed);

    const sys = new BreakoutSystem(session);
    placeBallAtCell(session, TETRIS_ROWS + 1, 5);
    sys.update(0);

    expect(cellDestroyed).not.toHaveBeenCalled();
    expect(session.grid[TETRIS_ROWS + 1][5].state).toBe(CellState.OCCUPIED);
  });

  it("does NOT destroy an OCCUPIED cell that is ABOVE the first complete row", () => {
    const session = makeSession();
    // Occupied cell at row TETRIS_ROWS, complete row below it at TETRIS_ROWS + 1
    session.grid[TETRIS_ROWS][5].state = CellState.OCCUPIED;
    session.grid[TETRIS_ROWS][5].pieceType = PieceType.T;
    for (let c = 0; c < 10; c++) {
      session.grid[TETRIS_ROWS + 1][c].state = CellState.COMPLETED;
      session.grid[TETRIS_ROWS + 1][c].pieceType = PieceType.I;
    }

    const cellDestroyed = vi.fn();
    eventBus.on(Events.CELL_DESTROYED, cellDestroyed);

    const sys = new BreakoutSystem(session);
    placeBallAtCell(session, TETRIS_ROWS, 5);
    sys.update(0);

    expect(cellDestroyed).not.toHaveBeenCalled();
    expect(session.grid[TETRIS_ROWS][5].state).toBe(CellState.OCCUPIED);
  });
});
