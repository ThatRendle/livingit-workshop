export interface IAudioSystem {
  playPieceLock(): void;
  playRowComplete(): void;
  playRowDestroyed(): void;
  playBallDrop(): void;
  playGameOver(): void;
}

export class AudioSystem implements IAudioSystem {
  playPieceLock(): void { /* stub */ }
  playRowComplete(): void { /* stub */ }
  playRowDestroyed(): void { /* stub */ }
  playBallDrop(): void { /* stub */ }
  playGameOver(): void { /* stub */ }
}
