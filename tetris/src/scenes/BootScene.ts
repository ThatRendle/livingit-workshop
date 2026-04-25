import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // No external assets for MVP — nothing to load
  }

  create(): void {
    this.scene.start("MenuScene");
  }
}
