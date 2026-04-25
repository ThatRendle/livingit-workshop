import Phaser from "phaser";
import { CANVAS_H, CANVAS_W, COLOUR_BACKGROUND } from "../config";
import {
  CONTROLS_BREAKOUT,
  CONTROLS_TETRIS,
  PRESS_SPACE_TO_START,
  TITLE,
} from "../strings";

const CENTRE_X = CANVAS_W / 2;
const FONT_TITLE = { fontSize: "56px", color: "#ffffff", fontFamily: "monospace", fontStyle: "bold" };
const FONT_CONTROLS = { fontSize: "22px", color: "#aaaaff", fontFamily: "monospace" };
const FONT_START = { fontSize: "24px", color: "#ffff00", fontFamily: "monospace" };

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create(): void {
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(COLOUR_BACKGROUND, 1);
    bg.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Title
    this.add.text(CENTRE_X, 200, TITLE, FONT_TITLE).setOrigin(0.5);

    // Controls
    this.add.text(CENTRE_X, 350, CONTROLS_TETRIS, FONT_CONTROLS).setOrigin(0.5);
    this.add.text(CENTRE_X, 390, CONTROLS_BREAKOUT, FONT_CONTROLS).setOrigin(0.5);

    // Start prompt
    const prompt = this.add.text(CENTRE_X, 520, PRESS_SPACE_TO_START, FONT_START).setOrigin(0.5);

    // Blink animation for the start prompt
    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 500,
      ease: "Linear",
      yoyo: true,
      repeat: -1,
    });

    // Space to start
    const spaceKey = this.input.keyboard!.addKey("SPACE");
    spaceKey.once("down", () => {
      this.scene.start("GameScene");
    });
  }
}
