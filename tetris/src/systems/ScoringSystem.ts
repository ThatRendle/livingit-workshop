import { POINTS_ROW_COMPLETED, POINTS_ROW_DESTROYED, POINTS_CELL_DESTROYED } from "../config";
import { eventBus, Events } from "../events/EventBus";
import type { GameSession } from "../types";

export class ScoringSystem {
  private session: GameSession;

  constructor(session: GameSession) {
    this.session = session;
    eventBus.on(Events.ROW_COMPLETED, () => this.onRowCompleted());
    eventBus.on(Events.ROW_DESTROYED, () => this.onRowDestroyed());
    eventBus.on(Events.CELL_DESTROYED, () => this.onCellDestroyed());
  }

  private onRowCompleted(): void {
    this.session.score += POINTS_ROW_COMPLETED;
    eventBus.emit(Events.SCORE_CHANGED, { score: this.session.score });
  }

  private onRowDestroyed(): void {
    this.session.score += POINTS_ROW_DESTROYED;
    eventBus.emit(Events.SCORE_CHANGED, { score: this.session.score });
  }

  private onCellDestroyed(): void {
    this.session.score += POINTS_CELL_DESTROYED;
    eventBus.emit(Events.SCORE_CHANGED, { score: this.session.score });
  }
}
