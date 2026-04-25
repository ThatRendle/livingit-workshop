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
} from "../config";
import { createGrid } from "../utils/grid";
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
