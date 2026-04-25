import Phaser from "phaser";
import {
  BALL_RADIUS,
  COLOUR_BALL,
  COLOUR_PADDLE,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PIT_Y,
  TOTAL_ROWS,
  CELL_SIZE,
} from "../config";
import type { Ball, Paddle } from "../types";

const PADDLE_TOP = PIT_Y + TOTAL_ROWS * CELL_SIZE - PADDLE_HEIGHT;
const PADDLE_RADIUS = 4;

export class BreakoutRenderer {
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics();
  }

  draw(ball: Ball, paddle: Paddle): void {
    const g = this.gfx;
    g.clear();

    // Paddle (rounded rectangle)
    const paddleLeft = paddle.x - PADDLE_WIDTH / 2;
    g.fillStyle(COLOUR_PADDLE, 1);
    g.fillRoundedRect(paddleLeft, PADDLE_TOP, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_RADIUS);

    // Ball (filled circle)
    if (ball.active) {
      g.fillStyle(COLOUR_BALL, 1);
      g.fillCircle(ball.x, ball.y, BALL_RADIUS);
    }
  }
}
