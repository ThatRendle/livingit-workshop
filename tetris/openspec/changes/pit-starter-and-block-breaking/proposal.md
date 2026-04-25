## Why

The breakout zone can become permanently unwinnable: if any incomplete row sits below a complete row, the ball bounces off its OCCUPIED cells forever and can never reach the complete row to destroy it. Additionally, the game starts with an empty breakout zone, giving the ball player nothing to interact with until the tetris player completes several rows.

## What Changes

- **Bug fix**: OCCUPIED cells that sit below the highest complete row in the breakout zone are now individually breakable — the ball destroys that single cell on contact rather than just reflecting off it.
- **New event**: `CELL_DESTROYED` emitted when an individual pit cell is broken.
- **New scoring**: 25 points awarded per destroyed cell (`POINTS_CELL_DESTROYED`).
- **Starting pit**: Game begins with 3 pre-filled rows in the breakout zone — one complete row (row 23) and two incomplete rows below it (rows 24–25) — built from 6 real tetromino shapes. One of 4 fixed configurations is chosen randomly each game.

## Capabilities

### New Capabilities

- `pit-starter`: Pre-filled breakout zone rows at game start using 4 fixed tetromino configurations, one selected randomly per session.

### Modified Capabilities

- `breakout-engine`: Ball now destroys individual OCCUPIED cells below the first complete row, in addition to destroying whole complete rows. New `CELL_DESTROYED` event emitted per cell broken.
- `cooperative-mechanic`: Starting pit rows (1 complete + 2 incomplete) are present at game start, immediately enabling ball–tetris interaction from the first ball launch.

## Impact

- `src/config.ts` — new `POINTS_CELL_DESTROYED` constant
- `src/events/EventBus.ts` — new `CELL_DESTROYED` event
- `src/utils/grid.ts` — new `fillInitialPit(grid)` function with 4 hardcoded configs
- `src/systems/BreakoutSystem.ts` — updated `resolveGridCells()` logic
- `src/systems/TetrisSystem.ts` — calls `fillInitialPit(grid)` from `init()`
- `src/systems/ScoringSystem.ts` — handles `CELL_DESTROYED` for scoring
