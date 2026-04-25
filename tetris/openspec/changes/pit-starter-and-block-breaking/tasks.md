## 1. Infrastructure

- [x] 1.1 Add `POINTS_CELL_DESTROYED = 25` constant to `src/config.ts`
- [x] 1.2 Add `CELL_DESTROYED` event to `src/events/EventBus.ts` with payload `{ rowIndex: number; colIndex: number }`

## 2. Pit Starter Configurations

- [x] 2.1 Define the four pit config arrays in `src/utils/grid.ts` as a constant `PIT_CONFIGS` — each a `(PieceType | null)[3][10]` grid
- [x] 2.2 Implement `fillInitialPit(grid: Grid): void` in `src/utils/grid.ts` — randomly selects one config, writes COMPLETED to row 23 cells and OCCUPIED to rows 24–25 cells with the appropriate `pieceType`

## 3. Bug Fix — Breakable Cells Below Complete Row

- [x] 3.1 In `BreakoutSystem.resolveGridCells()`, add a pre-scan of rows 18–25 to find `firstCompleteRow` (lowest row index with a COMPLETED cell; -1 if none)
- [x] 3.2 In the collision loop, add a branch for `OCCUPIED` cells where `r > firstCompleteRow`: clear the cell to EMPTY, emit `CELL_DESTROYED`, reflect the ball
- [x] 3.3 Verify existing OCCUPIED-reflects-only and COMPLETED-destroys-row branches are unchanged

## 4. Game Initialisation

- [x] 4.1 Call `fillInitialPit(this.session.grid)` from `TetrisSystem.init()` after the piece bag is set up

## 5. Scoring

- [x] 5.1 In `ScoringSystem`, subscribe to `CELL_DESTROYED` and add `POINTS_CELL_DESTROYED` to the session score

## 6. Tests

- [x] 6.1 Unit test `fillInitialPit`: row 23 is fully COMPLETED, rows 24–25 are partially OCCUPIED, all cells have non-null pieceType
- [x] 6.2 Unit test `resolveGridCells` breakable-cell branch: OCCUPIED cell below a COMPLETED row is cleared and CELL_DESTROYED is emitted
- [x] 6.3 Unit test `resolveGridCells` no-complete-row branch: OCCUPIED cell with no COMPLETED row above it is NOT cleared
- [x] 6.4 Unit test scoring: CELL_DESTROYED event increments score by 25
