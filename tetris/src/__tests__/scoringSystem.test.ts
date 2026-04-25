import { describe, it, expect, beforeEach, vi } from "vitest";
import { eventBus, Events } from "../events/EventBus";
import { ScoringSystem } from "../systems/ScoringSystem";
import { POINTS_ROW_COMPLETED, POINTS_ROW_DESTROYED } from "../config";
import { createGrid } from "../utils/grid";
import { PieceType } from "../data/pieces";
import type { GameSession } from "../types";
import { GamePhase } from "../types";
import {
  SPEED_RATCHET_BASE, PADDLE_WIDTH, PADDLE_SPEED, BALL_SPEED,
  PIT_X, PIT_WIDTH, PIT_Y, TOTAL_ROWS, CELL_SIZE, PADDLE_HEIGHT,
} from "../config";

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

describe("ScoringSystem", () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  it("increases score by POINTS_ROW_COMPLETED on ROW_COMPLETED", () => {
    const session = makeSession();
    new ScoringSystem(session);
    eventBus.emit(Events.ROW_COMPLETED, { rowIndex: 5 });
    expect(session.score).toBe(POINTS_ROW_COMPLETED);
  });

  it("increases score by POINTS_ROW_DESTROYED on ROW_DESTROYED", () => {
    const session = makeSession();
    new ScoringSystem(session);
    eventBus.emit(Events.ROW_DESTROYED, { rowIndex: 10 });
    expect(session.score).toBe(POINTS_ROW_DESTROYED);
  });

  it("emits SCORE_CHANGED after ROW_COMPLETED", () => {
    const session = makeSession();
    new ScoringSystem(session);
    const scoreChanged = vi.fn();
    eventBus.on(Events.SCORE_CHANGED, scoreChanged);
    eventBus.emit(Events.ROW_COMPLETED, { rowIndex: 5 });
    expect(scoreChanged).toHaveBeenCalledWith({ score: POINTS_ROW_COMPLETED });
  });

  it("emits SCORE_CHANGED after ROW_DESTROYED", () => {
    const session = makeSession();
    new ScoringSystem(session);
    const scoreChanged = vi.fn();
    eventBus.on(Events.SCORE_CHANGED, scoreChanged);
    eventBus.emit(Events.ROW_DESTROYED, { rowIndex: 10 });
    expect(scoreChanged).toHaveBeenCalledWith({ score: POINTS_ROW_DESTROYED });
  });

  it("accumulates score across multiple events", () => {
    const session = makeSession();
    new ScoringSystem(session);
    eventBus.emit(Events.ROW_COMPLETED, { rowIndex: 5 });
    eventBus.emit(Events.ROW_COMPLETED, { rowIndex: 6 });
    eventBus.emit(Events.ROW_DESTROYED, { rowIndex: 10 });
    expect(session.score).toBe(POINTS_ROW_COMPLETED * 2 + POINTS_ROW_DESTROYED);
  });
});
