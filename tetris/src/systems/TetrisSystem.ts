import {
  FALL_INTERVAL,
  SOFT_DROP_INTERVAL,
  SPAWN_COL,
  SPAWN_ROW,
} from "../config";
import { ALL_PIECE_TYPES, PieceType } from "../data/pieces";
import { WALL_KICKS_I, WALL_KICKS_JLSTZ } from "../data/wallKicks";
import { eventBus, Events } from "../events/EventBus";
import type { GameSession } from "../types";
import {
  CellState,
  canPlace,
  collapseRow,
  fillInitialPit,
  getPieceRowRange,
  isRowComplete,
  lockPiece,
  markRowCompleted,
} from "../utils/grid";
import type { ActivePiece } from "../utils/grid";

export class TetrisSystem {
  private session: GameSession;
  private fallAccumulator = 0;
  private softDropActive = false;

  constructor(session: GameSession) {
    this.session = session;
    eventBus.on(Events.ROW_DESTROYED, (p) => this.onRowDestroyed(p.rowIndex));
    // SPEED_CHANGED: fallSpeedMultiplier is read directly from session each frame — no subscription needed
  }

  /** Shuffle in-place using Fisher-Yates. No heap allocation beyond initial array. */
  private shuffleBag(bag: PieceType[]): void {
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = bag[i];
      bag[i] = bag[j];
      bag[j] = tmp;
    }
  }

  private drawNextPiece(): PieceType {
    const { pieceBag } = this.session;
    if (pieceBag.length === 0) {
      // Refill bag
      for (const t of ALL_PIECE_TYPES) pieceBag.push(t);
      this.shuffleBag(pieceBag);
    }
    return pieceBag.pop()!;
  }

  /** Attempt to spawn the next piece. Emits STACK_OVERFLOW if blocked. */
  spawnPiece(): void {
    const type = this.session.nextPieceType;
    // Queue the one after
    this.session.nextPieceType = this.drawNextPiece();

    const candidate: ActivePiece = {
      type,
      rotationIndex: 0,
      gridRow: SPAWN_ROW,
      gridCol: SPAWN_COL,
    };

    if (!canPlace(this.session.grid, candidate)) {
      eventBus.emit(Events.STACK_OVERFLOW);
      this.session.activePiece = null;
      return;
    }

    this.session.activePiece = candidate;
    this.fallAccumulator = 0;
  }

  /** Initialise the piece bag and spawn the first piece. */
  init(): void {
    const { pieceBag } = this.session;
    pieceBag.length = 0;
    for (const t of ALL_PIECE_TYPES) pieceBag.push(t);
    this.shuffleBag(pieceBag);
    this.session.nextPieceType = pieceBag.pop()!;
    fillInitialPit(this.session.grid);
    this.spawnPiece();
  }

  setSoftDrop(active: boolean): void {
    this.softDropActive = active;
  }

  update(delta: number): void {
    const { activePiece, fallSpeedMultiplier } = this.session;
    if (!activePiece) return;

    const interval = this.softDropActive
      ? SOFT_DROP_INTERVAL
      : FALL_INTERVAL / fallSpeedMultiplier;

    this.fallAccumulator += delta;
    while (this.fallAccumulator >= interval) {
      this.fallAccumulator -= interval;
      this.tryFall();
      if (!this.session.activePiece) return; // piece just locked
    }
  }

  private tryFall(): void {
    const piece = this.session.activePiece;
    if (!piece) return;

    piece.gridRow += 1;
    if (!canPlace(this.session.grid, piece)) {
      piece.gridRow -= 1;
      this.doLock();
    }
  }

  private doLock(): void {
    const piece = this.session.activePiece;
    if (!piece) return;

    lockPiece(this.session.grid, piece);
    const [minRow, maxRow] = getPieceRowRange(piece);
    this.session.activePiece = null;

    // Check rows for completion
    for (let r = Math.max(0, minRow); r <= maxRow; r++) {
      if (isRowComplete(this.session.grid, r)) {
        markRowCompleted(this.session.grid, r);
        eventBus.emit(Events.ROW_COMPLETED, { rowIndex: r });
      }
    }

    eventBus.emit(Events.PIECE_LOCKED, { nextPieceType: this.session.nextPieceType });
    this.spawnPiece();
  }

  moveLeft(): void {
    const piece = this.session.activePiece;
    if (!piece) return;
    piece.gridCol -= 1;
    if (!canPlace(this.session.grid, piece)) {
      piece.gridCol += 1;
    }
  }

  moveRight(): void {
    const piece = this.session.activePiece;
    if (!piece) return;
    piece.gridCol += 1;
    if (!canPlace(this.session.grid, piece)) {
      piece.gridCol -= 1;
    }
  }

  rotate(): void {
    const piece = this.session.activePiece;
    if (!piece) return;

    const fromRot = piece.rotationIndex;
    const toRot = (fromRot + 1) % 4;
    const key = `${fromRot}->${toRot}`;

    const kicks =
      piece.type === PieceType.I ? WALL_KICKS_I[key] : WALL_KICKS_JLSTZ[key];

    if (!kicks) return;

    piece.rotationIndex = toRot;

    for (const [dc, dr] of kicks) {
      piece.gridCol += dc;
      piece.gridRow += dr;
      if (canPlace(this.session.grid, piece)) {
        return; // accepted
      }
      piece.gridCol -= dc;
      piece.gridRow -= dr;
    }

    // All kicks failed — revert rotation
    piece.rotationIndex = fromRot;
  }

  softDrop(): void {
    const piece = this.session.activePiece;
    if (!piece) return;
    piece.gridRow += 1;
    if (!canPlace(this.session.grid, piece)) {
      piece.gridRow -= 1;
      this.doLock();
    } else {
      this.fallAccumulator = 0;
    }
  }

  private onRowDestroyed(rowIndex: number): void {
    // Validate the row is COMPLETED before collapsing
    const row = this.session.grid[rowIndex];
    if (!row) return;

    // Check the row has at least one non-EMPTY cell (it should be COMPLETED)
    const hasContent = row.some((c) => c.state !== CellState.EMPTY);
    if (!hasContent) return;

    collapseRow(this.session.grid, rowIndex);
  }

}
