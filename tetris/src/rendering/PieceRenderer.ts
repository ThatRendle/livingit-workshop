import Phaser from "phaser";
import { CELL_SIZE, PIT_X, PIT_Y } from "../config";
import { PIECE_DEFINITIONS, PieceType } from "../data/pieces";
import type { ActivePiece } from "../utils/grid";

const CELL_INSET = 1;
const PREVIEW_X = 420; // right of the pit
const PREVIEW_Y = 120;
const PREVIEW_CELL_SIZE = 24;

export class PieceRenderer {
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics();
  }

  draw(activePiece: ActivePiece | null, nextPieceType: PieceType): void {
    const g = this.gfx;
    g.clear();

    // Active falling piece
    if (activePiece) {
      const def = PIECE_DEFINITIONS[activePiece.type];
      const offsets = def.rotations[activePiece.rotationIndex];
      g.fillStyle(def.colour, 1);
      for (const [dr, dc] of offsets) {
        const px = PIT_X + (activePiece.gridCol + dc) * CELL_SIZE + CELL_INSET;
        const py = PIT_Y + (activePiece.gridRow + dr) * CELL_SIZE + CELL_INSET;
        const size = CELL_SIZE - CELL_INSET * 2;
        g.fillRect(px, py, size, size);
      }
    }

    // Next piece preview
    const nextDef = PIECE_DEFINITIONS[nextPieceType];
    const nextOffsets = nextDef.rotations[0];
    g.fillStyle(nextDef.colour, 1);
    for (const [dr, dc] of nextOffsets) {
      const px = PREVIEW_X + dc * PREVIEW_CELL_SIZE;
      const py = PREVIEW_Y + dr * PREVIEW_CELL_SIZE;
      const size = PREVIEW_CELL_SIZE - 2;
      g.fillRect(px, py, size, size);
    }
  }
}
