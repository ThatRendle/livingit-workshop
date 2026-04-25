import Phaser from "phaser";
import { CANVAS_H, CANVAS_W } from "../config";
import { GAME_OVER, RESTART_PROMPT, SCORE_LABEL } from "../strings";

const CENTRE_X = CANVAS_W / 2;
const FONT_GAMEOVER = { fontSize: "64px", color: "#ff4444", fontFamily: "monospace", fontStyle: "bold" };
const FONT_SCORE = { fontSize: "28px", color: "#ffffff", fontFamily: "monospace" };
const FONT_RESTART = { fontSize: "22px", color: "#ffff00", fontFamily: "monospace" };

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  create(data: { score: number }): void {
    // Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.add.text(CENTRE_X, 280, GAME_OVER, FONT_GAMEOVER).setOrigin(0.5);
    this.add.text(CENTRE_X, 380, `${SCORE_LABEL}: ${data.score}`, FONT_SCORE).setOrigin(0.5);

    const prompt = this.add.text(CENTRE_X, 460, RESTART_PROMPT, FONT_RESTART).setOrigin(0.5);
    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 500,
      ease: "Linear",
      yoyo: true,
      repeat: -1,
    });

    const restart = () => {
      this.scene.stop("GameOverScene");
      const gameScene = this.scene.get("GameScene") as Phaser.Scene & { restartGame?: () => void };
      if (gameScene && typeof gameScene.restartGame === "function") {
        gameScene.restartGame();
      } else {
        this.scene.start("GameScene");
      }
    };

    const spaceKey = this.input.keyboard!.addKey("SPACE");
    spaceKey.once("down", restart);

    const rKey = this.input.keyboard!.addKey("R");
    rKey.once("down", restart);
  }
}
