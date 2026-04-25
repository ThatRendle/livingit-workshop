import { describe, it, expect, beforeEach, vi } from "vitest";
import { eventBus, Events } from "../events/EventBus";
import { SpeedRatchetSystem } from "../systems/SpeedRatchetSystem";
import {
  SPEED_RATCHET_BASE,
  SPEED_RATCHET_INCREMENT,
  SPEED_RATCHET_MAX,
  PADDLE_WIDTH,
  PADDLE_SPEED,
  BALL_SPEED,
  PIT_X,
  PIT_WIDTH,
  PIT_Y,
  TOTAL_ROWS,
  CELL_SIZE,
  PADDLE_HEIGHT,
} from "../config";
import { createGrid } from "../utils/grid";
import { PieceType } from "../data/pieces";
import type { GameSession } from "../types";
import { GamePhase } from "../types";

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
    paddle: { x: PIT_X + PIT_WIDTH / 2, width: PADDLE_WIDTH, speed: PADDLE_SPEED },
  };
}

describe("SpeedRatchetSystem", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("increases fallSpeedMultiplier on first BALL_DROPPED", () => {
    const session = makeSession();
    new SpeedRatchetSystem(session);
    eventBus.emit(Events.BALL_DROPPED);
    // After 1 drop: SPEED_RATCHET_BASE * (1 + SPEED_RATCHET_INCREMENT * 1)
    const expected = SPEED_RATCHET_BASE * (1 + SPEED_RATCHET_INCREMENT * 1);
    expect(session.fallSpeedMultiplier).toBeCloseTo(expected);
    expect(session.ballDropCount).toBe(1);
  });

  it("emits SPEED_CHANGED after ball drop", () => {
    const session = makeSession();
    new SpeedRatchetSystem(session);
    const speedChanged = vi.fn();
    eventBus.on(Events.SPEED_CHANGED, speedChanged);
    eventBus.emit(Events.BALL_DROPPED);
    expect(speedChanged).toHaveBeenCalledOnce();
    expect(speedChanged.mock.calls[0][0].multiplier).toBeGreaterThan(SPEED_RATCHET_BASE);
  });

  it("multiplier is monotonically increasing across drops", () => {
    const session = makeSession();
    new SpeedRatchetSystem(session);
    let prev = session.fallSpeedMultiplier;
    for (let i = 0; i < 5; i++) {
      eventBus.emit(Events.BALL_DROPPED);
      expect(session.fallSpeedMultiplier).toBeGreaterThanOrEqual(prev);
      prev = session.fallSpeedMultiplier;
    }
  });

  it("caps multiplier at SPEED_RATCHET_MAX", () => {
    const session = makeSession();
    new SpeedRatchetSystem(session);
    // Fire many drops to exceed the cap
    for (let i = 0; i < 100; i++) {
      eventBus.emit(Events.BALL_DROPPED);
    }
    expect(session.fallSpeedMultiplier).toBeLessThanOrEqual(SPEED_RATCHET_MAX);
  });

  it("never decreases the multiplier", () => {
    const session = makeSession();
    new SpeedRatchetSystem(session);
    // Get it to near-max
    for (let i = 0; i < 50; i++) {
      eventBus.emit(Events.BALL_DROPPED);
    }
    const atMax = session.fallSpeedMultiplier;
    // More drops — should stay at max
    eventBus.emit(Events.BALL_DROPPED);
    expect(session.fallSpeedMultiplier).toBeGreaterThanOrEqual(atMax);
  });
});
