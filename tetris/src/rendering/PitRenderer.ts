import Phaser from "phaser";
import {
  CELL_SIZE,
  COLOUR_PIT_BORDER,
  COLOUR_ZONE_DIVIDER,
  PIT_HEIGHT,
  PIT_WIDTH,
  PIT_X,
  PIT_Y,
  TETRIS_ROWS,
  ZONE_DIVIDER_Y,
} from "../config";

export class PitRenderer {
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics();
    this.draw();
  }

  private draw(): void {
    const g = this.gfx;
    g.clear();

    // Pit border (3px thick outline)
    g.lineStyle(3, COLOUR_PIT_BORDER, 1);
    g.strokeRect(PIT_X - 3, PIT_Y - 3, PIT_WIDTH + 6, PIT_HEIGHT + 6);

    // Zone divider line
    g.lineStyle(2, COLOUR_ZONE_DIVIDER, 1);
    g.lineBetween(PIT_X, ZONE_DIVIDER_Y, PIT_X + PIT_WIDTH, ZONE_DIVIDER_Y);

    // Grid guide lines (subtle)
    g.lineStyle(1, COLOUR_PIT_BORDER, 0.2);
    for (let c = 1; c < 10; c++) {
      const x = PIT_X + c * CELL_SIZE;
      g.lineBetween(x, PIT_Y, x, PIT_Y + PIT_HEIGHT);
    }
    for (let r = 1; r < TETRIS_ROWS; r++) {
      const y = PIT_Y + r * CELL_SIZE;
      g.lineBetween(PIT_X, y, PIT_X + PIT_WIDTH, y);
    }
  }
}
