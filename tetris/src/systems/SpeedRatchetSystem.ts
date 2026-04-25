import {
  SPEED_RATCHET_BASE,
  SPEED_RATCHET_INCREMENT,
  SPEED_RATCHET_MAX,
} from "../config";
import { eventBus, Events } from "../events/EventBus";
import type { GameSession } from "../types";

export class SpeedRatchetSystem {
  private session: GameSession;

  constructor(session: GameSession) {
    this.session = session;
    eventBus.on(Events.BALL_DROPPED, () => this.onBallDropped());
  }

  private onBallDropped(): void {
    this.session.ballDropCount += 1;
    const newMultiplier = Math.min(
      SPEED_RATCHET_BASE * (1 + SPEED_RATCHET_INCREMENT * this.session.ballDropCount),
      SPEED_RATCHET_MAX
    );
    // Never decrease
    if (newMultiplier > this.session.fallSpeedMultiplier) {
      this.session.fallSpeedMultiplier = newMultiplier;
      eventBus.emit(Events.SPEED_CHANGED, { multiplier: this.session.fallSpeedMultiplier });
    }
  }
}
