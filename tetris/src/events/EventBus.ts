import type { PieceType } from "../data/pieces";

export const Events = {
  ROW_COMPLETED: "ROW_COMPLETED",
  ROW_DESTROYED: "ROW_DESTROYED",
  CELL_DESTROYED: "CELL_DESTROYED",
  BALL_DROPPED: "BALL_DROPPED",
  PIECE_LOCKED: "PIECE_LOCKED",
  STACK_OVERFLOW: "STACK_OVERFLOW",
  SCORE_CHANGED: "SCORE_CHANGED",
  SPEED_CHANGED: "SPEED_CHANGED",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

export interface RowCompletedPayload {
  rowIndex: number;
}

export interface RowDestroyedPayload {
  rowIndex: number;
}

export interface PieceLockedPayload {
  nextPieceType: PieceType;
}

export interface ScoreChangedPayload {
  score: number;
}

export interface SpeedChangedPayload {
  multiplier: number;
}

export interface CellDestroyedPayload {
  rowIndex: number;
  colIndex: number;
}

type Handler = (...args: unknown[]) => void;

// Pure-JS typed event bus — no Phaser dependency (works in Node/test environments)
class TypedEventBus {
  private listeners = new Map<string, Handler[]>();

  on(event: typeof Events.ROW_COMPLETED, fn: (p: RowCompletedPayload) => void): void;
  on(event: typeof Events.ROW_DESTROYED, fn: (p: RowDestroyedPayload) => void): void;
  on(event: typeof Events.CELL_DESTROYED, fn: (p: CellDestroyedPayload) => void): void;
  on(event: typeof Events.BALL_DROPPED, fn: (p?: undefined) => void): void;
  on(event: typeof Events.PIECE_LOCKED, fn: (p: PieceLockedPayload) => void): void;
  on(event: typeof Events.STACK_OVERFLOW, fn: (p?: undefined) => void): void;
  on(event: typeof Events.SCORE_CHANGED, fn: (p: ScoreChangedPayload) => void): void;
  on(event: typeof Events.SPEED_CHANGED, fn: (p: SpeedChangedPayload) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, fn: (p: any) => void): void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = [];
      this.listeners.set(event, handlers);
    }
    handlers.push(fn as Handler);
  }

  off(event: string, fn?: (...args: unknown[]) => void): void {
    if (!fn) {
      this.listeners.delete(event);
      return;
    }
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    const idx = handlers.indexOf(fn as Handler);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  emit(event: typeof Events.ROW_COMPLETED, payload: RowCompletedPayload): void;
  emit(event: typeof Events.ROW_DESTROYED, payload: RowDestroyedPayload): void;
  emit(event: typeof Events.CELL_DESTROYED, payload: CellDestroyedPayload): void;
  emit(event: typeof Events.BALL_DROPPED): void;
  emit(event: typeof Events.PIECE_LOCKED, payload: PieceLockedPayload): void;
  emit(event: typeof Events.STACK_OVERFLOW): void;
  emit(event: typeof Events.SCORE_CHANGED, payload: ScoreChangedPayload): void;
  emit(event: typeof Events.SPEED_CHANGED, payload: SpeedChangedPayload): void;
  emit(event: string, payload?: unknown): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    // Snapshot to avoid mutation issues during iteration
    const snapshot = handlers.slice();
    for (const fn of snapshot) {
      fn(payload);
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

export const eventBus = new TypedEventBus();
