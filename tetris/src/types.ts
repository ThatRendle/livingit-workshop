import type { PieceType } from "./data/pieces";
import type { Grid, ActivePiece } from "./utils/grid";

export enum GamePhase {
  MENU = "MENU",
  PLAYING = "PLAYING",
  GAME_OVER = "GAME_OVER",
}

export interface Ball {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  active: boolean;
}

export interface Paddle {
  x: number;
  width: number;
  speed: number;
}

export interface GameSession {
  phase: GamePhase;
  score: number;
  ballDropCount: number;
  fallSpeedMultiplier: number;
  grid: Grid;
  activePiece: ActivePiece | null;
  nextPieceType: PieceType;
  pieceBag: PieceType[];
  ball: Ball;
  paddle: Paddle;
}
