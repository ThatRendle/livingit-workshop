import Phaser from "phaser";
import {
  BALL_SPEED,
  CANVAS_H,
  CANVAS_W,
  COLOUR_BACKGROUND,
  PADDLE_SPEED,
  PADDLE_WIDTH,
  PIT_X,
  PIT_WIDTH,
  PIT_Y,
  TOTAL_ROWS,
  CELL_SIZE,
  PADDLE_HEIGHT,
  SPEED_RATCHET_BASE,
} from "../config";
import { PieceType } from "../data/pieces";
import { eventBus, Events } from "../events/EventBus";
import { BreakoutRenderer } from "../rendering/BreakoutRenderer";
import { GridRenderer } from "../rendering/GridRenderer";
import { HUDRenderer } from "../rendering/HUDRenderer";
import { PieceRenderer } from "../rendering/PieceRenderer";
import { PitRenderer } from "../rendering/PitRenderer";
import { BreakoutSystem } from "../systems/BreakoutSystem";
import { InputSystem } from "../systems/InputSystem";
import { ScoringSystem } from "../systems/ScoringSystem";
import { SpeedRatchetSystem } from "../systems/SpeedRatchetSystem";
import { TetrisSystem } from "../systems/TetrisSystem";
import type { GameSession } from "../types";
import { GamePhase } from "../types";
import { createGrid } from "../utils/grid";

function createInitialSession(): GameSession {
  return {
    phase: GamePhase.PLAYING,
    score: 0,
    ballDropCount: 0,
    fallSpeedMultiplier: SPEED_RATCHET_BASE,
    grid: createGrid(),
    activePiece: null,
    nextPieceType: PieceType.I, // replaced during TetrisSystem.init()
    pieceBag: [],
    ball: {
      x: PIT_X + PIT_WIDTH / 2,
      y: PIT_Y + TOTAL_ROWS * CELL_SIZE - PADDLE_HEIGHT - 10,
      velocityX: BALL_SPEED * Math.cos((315 * Math.PI) / 180),
      velocityY: BALL_SPEED * Math.sin((315 * Math.PI) / 180),
      active: true,
    },
    paddle: {
      x: PIT_X + PIT_WIDTH / 2,
      width: PADDLE_WIDTH,
      speed: PADDLE_SPEED,
    },
  };
}

export class GameScene extends Phaser.Scene {
  private session!: GameSession;
  private tetrisSystem!: TetrisSystem;
  private breakoutSystem!: BreakoutSystem;
  // Systems retained for their constructor side-effects (EventBus subscriptions)
  private sideEffectSystems: Array<ScoringSystem | SpeedRatchetSystem | PitRenderer | HUDRenderer> = [];
  private inputSystem!: InputSystem;

  // Renderers
  private gridRenderer!: GridRenderer;
  private pieceRenderer!: PieceRenderer;
  private breakoutRenderer!: BreakoutRenderer;

  private bgGfx!: Phaser.GameObjects.Graphics;
  private isGameOver = false;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.isGameOver = false;

    // Destroy any existing Phaser objects from previous session
    this.children.removeAll(true);

    // Clear all EventBus subscriptions from any previous session
    eventBus.removeAllListeners();

    // Background
    this.bgGfx = this.add.graphics();
    this.bgGfx.fillStyle(COLOUR_BACKGROUND, 1);
    this.bgGfx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Session state
    this.session = createInitialSession();

    // Systems — constructors register EventBus subscriptions
    this.tetrisSystem = new TetrisSystem(this.session);
    this.breakoutSystem = new BreakoutSystem(this.session);

    // Scoring and speed ratchet are retained for their EventBus subscriptions
    this.sideEffectSystems = [
      new ScoringSystem(this.session),
      new SpeedRatchetSystem(this.session),
    ];

    // Initialise tetris piece bag and spawn first piece
    this.tetrisSystem.init();

    // Input system
    this.inputSystem = new InputSystem(
      this.input.keyboard!,
      this.tetrisSystem,
      this.breakoutSystem
    );

    // Rendering layers (back to front): bg already done, then pit, grid, piece, ball/paddle, HUD
    const pitRenderer = new PitRenderer(this);
    this.gridRenderer = new GridRenderer(this);
    this.pieceRenderer = new PieceRenderer(this);
    this.breakoutRenderer = new BreakoutRenderer(this);
    const hudRenderer = new HUDRenderer(
      this,
      this.session.score,
      this.session.fallSpeedMultiplier,
      this.session.nextPieceType
    );
    this.sideEffectSystems.push(pitRenderer, hudRenderer);

    // Wire STACK_OVERFLOW → game over
    eventBus.on(Events.STACK_OVERFLOW, () => this.onGameOver());
  }

  override update(_time: number, delta: number): void {
    if (this.isGameOver) return;
    if (this.session.phase !== GamePhase.PLAYING) return;

    this.inputSystem.update(delta);
    this.tetrisSystem.update(delta);
    this.breakoutSystem.update(delta);

    // Render dynamic objects each frame
    this.gridRenderer.draw(this.session.grid);
    this.pieceRenderer.draw(this.session.activePiece, this.session.nextPieceType);
    this.breakoutRenderer.draw(this.session.ball, this.session.paddle);
  }

  private onGameOver(): void {
    this.isGameOver = true;
    this.session.phase = GamePhase.GAME_OVER;
    this.scene.launch("GameOverScene", { score: this.session.score });
    this.scene.pause("GameScene");
  }

  /** Called by GameOverScene when the player restarts. */
  restartGame(): void {
    this.scene.resume("GameScene");
    // create() will rebuild everything from scratch
    this.create();
  }
}
