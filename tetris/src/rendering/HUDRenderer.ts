import Phaser from "phaser";
import { eventBus, Events } from "../events/EventBus";
import {
  SCORE_LABEL,
  SPEED_LABEL,
  NEXT_LABEL,
} from "../strings";
import type { PieceType } from "../data/pieces";

const HUD_LEFT_X = 10;
const HUD_RIGHT_X = 415;
const FONT_SIZE = "18px";
const FONT = { fontSize: FONT_SIZE, color: "#ffffff", fontFamily: "monospace" };

export class HUDRenderer {
  private scoreText: Phaser.GameObjects.Text;
  private speedText: Phaser.GameObjects.Text;
  private nextLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, initialScore: number, initialMultiplier: number, nextPiece: PieceType) {
    this.scoreText = scene.add.text(HUD_LEFT_X, 10, `${SCORE_LABEL}: ${initialScore}`, FONT);
    this.speedText = scene.add.text(HUD_LEFT_X, 36, `${SPEED_LABEL}: ${initialMultiplier.toFixed(1)}x`, FONT);
    this.nextLabel = scene.add.text(HUD_RIGHT_X, 90, `${NEXT_LABEL}`, FONT);

    void nextPiece; // next piece rendered by PieceRenderer

    eventBus.on(Events.SCORE_CHANGED, (p) => {
      this.scoreText.setText(`${SCORE_LABEL}: ${p.score}`);
    });
    eventBus.on(Events.SPEED_CHANGED, (p) => {
      this.speedText.setText(`${SPEED_LABEL}: ${p.multiplier.toFixed(1)}x`);
    });
  }

  destroy(): void {
    this.scoreText.destroy();
    this.speedText.destroy();
    this.nextLabel.destroy();
  }
}
