import Phaser from "phaser";
import { DAS_DELAY, ARR_INTERVAL, INPUT_MAP } from "../config";
import type { TetrisSystem } from "./TetrisSystem";
import type { BreakoutSystem } from "./BreakoutSystem";

type KeyboardPlugin = Phaser.Input.Keyboard.KeyboardPlugin;
type Key = Phaser.Input.Keyboard.Key;

export class InputSystem {
  private keys: Record<string, Key> = {};
  private dasTimer = 0;
  private arrTimer = 0;
  private dasActive = false;
  // Track previous direction to detect changes
  private lastDirection: "left" | "right" | null = null;

  constructor(
    keyboard: KeyboardPlugin,
    private tetris: TetrisSystem,
    private breakout: BreakoutSystem
  ) {
    const addKey = (name: string) => {
      this.keys[name] = keyboard.addKey(name);
    };
    addKey(INPUT_MAP.PIECE_LEFT);
    addKey(INPUT_MAP.PIECE_RIGHT);
    addKey(INPUT_MAP.PIECE_ROTATE);
    addKey(INPUT_MAP.PIECE_SOFT_DROP);
    addKey(INPUT_MAP.PADDLE_LEFT);
    addKey(INPUT_MAP.PADDLE_RIGHT);
  }

  update(delta: number): void {
    this.handlePieceMovement(delta);
    this.handleRotation();
    this.handleSoftDrop();
    this.handlePaddle(delta);
  }

  private handlePieceMovement(delta: number): void {
    const leftDown = this.keys[INPUT_MAP.PIECE_LEFT].isDown;
    const rightDown = this.keys[INPUT_MAP.PIECE_RIGHT].isDown;

    // Determine current direction
    let direction: "left" | "right" | null = null;
    if (leftDown && !rightDown) direction = "left";
    else if (rightDown && !leftDown) direction = "right";

    if (direction === null) {
      // No key held
      this.dasActive = false;
      this.dasTimer = 0;
      this.arrTimer = 0;
      this.lastDirection = null;
      return;
    }

    if (direction !== this.lastDirection) {
      // New direction pressed — immediate move + reset DAS
      if (direction === "left") this.tetris.moveLeft();
      else this.tetris.moveRight();
      this.dasActive = false;
      this.dasTimer = 0;
      this.arrTimer = 0;
      this.lastDirection = direction;
      return;
    }

    // Same direction held
    if (!this.dasActive) {
      this.dasTimer += delta;
      if (this.dasTimer >= DAS_DELAY) {
        this.dasActive = true;
        this.arrTimer = 0;
      }
    } else {
      this.arrTimer += delta;
      while (this.arrTimer >= ARR_INTERVAL) {
        this.arrTimer -= ARR_INTERVAL;
        if (direction === "left") this.tetris.moveLeft();
        else this.tetris.moveRight();
      }
    }
  }

  private handleRotation(): void {
    const rotateKey = this.keys[INPUT_MAP.PIECE_ROTATE];
    if (Phaser.Input.Keyboard.JustDown(rotateKey)) {
      this.tetris.rotate();
    }
  }

  private handleSoftDrop(): void {
    const softDropDown = this.keys[INPUT_MAP.PIECE_SOFT_DROP].isDown;
    this.tetris.setSoftDrop(softDropDown);
  }

  private handlePaddle(delta: number): void {
    if (this.keys[INPUT_MAP.PADDLE_LEFT].isDown) {
      this.breakout.movePaddleLeft(delta);
    }
    if (this.keys[INPUT_MAP.PADDLE_RIGHT].isDown) {
      this.breakout.movePaddleRight(delta);
    }
  }
}
