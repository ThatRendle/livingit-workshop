import Phaser from "phaser";
import { CELL_SIZE, COLOUR_COMPLETED_OUTLINE, GRID_COLS, PIT_X, PIT_Y, TOTAL_ROWS } from "../config";
import { PIECE_DEFINITIONS } from "../data/pieces";
import { CellState } from "../utils/grid";
import type { Grid } from "../utils/grid";

const CELL_INSET = 1; // 1px inset so borders between cells are visible
const COMPLETED_BRIGHTNESS_ADD = 0x404040;

export class GridRenderer {
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics();
  }

  draw(grid: Grid): void {
    const g = this.gfx;
    g.clear();

    for (let r = 0; r < TOTAL_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = grid[r][c];
        if (cell.state === CellState.EMPTY) continue;

        const px = PIT_X + c * CELL_SIZE + CELL_INSET;
        const py = PIT_Y + r * CELL_SIZE + CELL_INSET;
        const size = CELL_SIZE - CELL_INSET * 2;

        const baseColour = cell.pieceType
          ? PIECE_DEFINITIONS[cell.pieceType].colour
          : 0x888888;

        if (cell.state === CellState.OCCUPIED) {
          g.fillStyle(baseColour, 1);
          g.fillRect(px, py, size, size);
        } else if (cell.state === CellState.COMPLETED) {
          // Brighten the fill colour for accessibility
          const r1 = Math.min(255, ((baseColour >> 16) & 0xff) + (COMPLETED_BRIGHTNESS_ADD >> 16));
          const g1 = Math.min(255, ((baseColour >> 8) & 0xff) + ((COMPLETED_BRIGHTNESS_ADD >> 8) & 0xff));
          const b1 = Math.min(255, (baseColour & 0xff) + (COMPLETED_BRIGHTNESS_ADD & 0xff));
          const brightColour = (r1 << 16) | (g1 << 8) | b1;

          g.fillStyle(brightColour, 1);
          g.fillRect(px, py, size, size);

          // White outline for accessibility — distinguishable without colour alone
          g.lineStyle(2, COLOUR_COMPLETED_OUTLINE, 1);
          g.strokeRect(px, py, size, size);
        }
      }
    }
  }
}
