import {
  BALL_RADIUS,
  BALL_SPEED,
  CELL_SIZE,
  GRID_COLS,
  MAX_BALL_SPEED_X,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PIT_X,
  PIT_Y,
  TETRIS_ROWS,
  TOTAL_ROWS,
  PIT_WIDTH,
} from "../config";
import { eventBus, Events } from "../events/EventBus";
import type { GameSession } from "../types";
import { CellState } from "../utils/grid";
import { resolveCircleAABB, reflectVelocity } from "../utils/collision";

// Reusable AABB objects — no per-frame heap allocation
const _wallBox = { x: 0, y: 0, width: 0, height: 0 };
const _cellBox = { x: 0, y: 0, width: CELL_SIZE, height: CELL_SIZE };

// Zone boundary pixel values
const PIT_LEFT = PIT_X;
const PIT_RIGHT = PIT_X + PIT_WIDTH;
const ZONE_CEILING_Y = PIT_Y + TETRIS_ROWS * CELL_SIZE;
const PIT_BOTTOM_Y = PIT_Y + TOTAL_ROWS * CELL_SIZE;
const PADDLE_HALF_W = PADDLE_WIDTH / 2;

export class BreakoutSystem {
  private session: GameSession;

  constructor(session: GameSession) {
    this.session = session;
    this.respawnBall();
  }

  respawnBall(): void {
    const { ball, paddle } = this.session;
    ball.x = paddle.x;
    ball.y = PIT_Y + TOTAL_ROWS * CELL_SIZE - PADDLE_HEIGHT - BALL_RADIUS - 2;
    // 315° = upward-right at 45°
    const angle = (315 * Math.PI) / 180;
    ball.velocityX = BALL_SPEED * Math.cos(angle);
    ball.velocityY = BALL_SPEED * Math.sin(angle);
    ball.active = true;
  }

  movePaddleLeft(delta: number): void {
    const { paddle } = this.session;
    paddle.x -= paddle.speed * (delta / 1000);
    const minX = PIT_LEFT + PADDLE_HALF_W;
    if (paddle.x < minX) paddle.x = minX;
  }

  movePaddleRight(delta: number): void {
    const { paddle } = this.session;
    paddle.x += paddle.speed * (delta / 1000);
    const maxX = PIT_RIGHT - PADDLE_HALF_W;
    if (paddle.x > maxX) paddle.x = maxX;
  }

  update(delta: number): void {
    const { ball } = this.session;
    if (!ball.active) return;

    const dt = delta / 1000;
    ball.x += ball.velocityX * dt;
    ball.y += ball.velocityY * dt;

    this.resolveWalls();
    this.resolvePaddleCollision();
    this.resolveGridCells();
    this.checkBallDrop();
  }

  private resolveWalls(): void {
    const { ball } = this.session;

    // Left wall
    if (ball.x - BALL_RADIUS < PIT_LEFT) {
      ball.x = PIT_LEFT + BALL_RADIUS;
      ball.velocityX = Math.abs(ball.velocityX);
    }
    // Right wall
    if (ball.x + BALL_RADIUS > PIT_RIGHT) {
      ball.x = PIT_RIGHT - BALL_RADIUS;
      ball.velocityX = -Math.abs(ball.velocityX);
    }
    // Zone boundary (ceiling of breakout zone)
    if (ball.y - BALL_RADIUS < ZONE_CEILING_Y) {
      ball.y = ZONE_CEILING_Y + BALL_RADIUS;
      ball.velocityY = Math.abs(ball.velocityY);
    }
  }

  private resolvePaddleCollision(): void {
    const { ball, paddle } = this.session;
    const paddleTop = PIT_Y + TOTAL_ROWS * CELL_SIZE - PADDLE_HEIGHT;
    const paddleLeft = paddle.x - PADDLE_HALF_W;

    _wallBox.x = paddleLeft;
    _wallBox.y = paddleTop;
    _wallBox.width = PADDLE_WIDTH;
    _wallBox.height = PADDLE_HEIGHT;

    const ballCircle = {
      x: ball.x,
      y: ball.y,
      velocityX: ball.velocityX,
      velocityY: ball.velocityY,
      radius: BALL_RADIUS,
    };

    const result = resolveCircleAABB(ballCircle, _wallBox);
    if (!result.hit) return;

    // Apply position push-out
    ball.x = ballCircle.x;
    ball.y = ballCircle.y;

    // Angle response based on offset from paddle centre
    const offset = (ball.x - paddle.x) / PADDLE_HALF_W; // -1 to 1
    const newVx = offset * MAX_BALL_SPEED_X;
    const newVy = -Math.abs(ball.velocityY); // always bounce upward

    // Normalise and scale to BALL_SPEED
    const len = Math.sqrt(newVx * newVx + newVy * newVy);
    if (len > 0) {
      ball.velocityX = (newVx / len) * BALL_SPEED;
      ball.velocityY = (newVy / len) * BALL_SPEED;
    } else {
      // Exact centre — go straight up
      ball.velocityX = 0;
      ball.velocityY = -BALL_SPEED;
    }
  }

  private resolveGridCells(): void {
    const { ball, grid } = this.session;

    // Only check rows in the Breakout zone (TETRIS_ROWS to TOTAL_ROWS-1)
    const ballCircle = {
      x: ball.x,
      y: ball.y,
      velocityX: ball.velocityX,
      velocityY: ball.velocityY,
      radius: BALL_RADIUS,
    };

    for (let r = TETRIS_ROWS; r < TOTAL_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = grid[r][c];
        if (cell.state === CellState.EMPTY) continue;

        const cellPixelX = PIT_X + c * CELL_SIZE;
        const cellPixelY = PIT_Y + r * CELL_SIZE;

        _cellBox.x = cellPixelX;
        _cellBox.y = cellPixelY;
        // width/height already set

        const result = resolveCircleAABB(ballCircle, _cellBox);
        if (!result.hit) continue;

        ball.x = ballCircle.x;
        ball.y = ballCircle.y;
        ballCircle.x = ball.x;
        ballCircle.y = ball.y;

        if (cell.state === CellState.COMPLETED) {
          // Destroy entire row
          const rowIdx = r;
          for (let cc = 0; cc < GRID_COLS; cc++) {
            grid[rowIdx][cc].state = CellState.EMPTY;
            grid[rowIdx][cc].pieceType = null;
          }
          eventBus.emit(Events.ROW_DESTROYED, { rowIndex: rowIdx });
          // Ball reflects
          const [rvx, rvy] = reflectVelocity(
            ball.velocityX,
            ball.velocityY,
            result.normalX,
            result.normalY
          );
          ball.velocityX = rvx;
          ball.velocityY = rvy;
          // Row is now empty — no further cells in this row
          break;
        } else {
          // OCCUPIED — reflect
          const [rvx, rvy] = reflectVelocity(
            ball.velocityX,
            ball.velocityY,
            result.normalX,
            result.normalY
          );
          ball.velocityX = rvx;
          ball.velocityY = rvy;
        }
      }
    }
  }

  private checkBallDrop(): void {
    const { ball } = this.session;
    if (ball.y > PIT_BOTTOM_Y) {
      ball.active = false;
      eventBus.emit(Events.BALL_DROPPED);
      this.respawnBall();
    }
  }
}
