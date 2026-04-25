## ADDED Requirements

### Requirement: Starting pit creates immediate cooperative state
At game start, the pre-filled Breakout zone (one complete row at row 23, two incomplete rows below) SHALL create an immediately playable state for both players. The ball player SHALL be able to destroy the starting complete row from the first launch. The incomplete rows below the complete row SHALL be individually breakable per the breakout-engine spec, giving the ball player path-clearing work before subsequent complete rows arrive from the Tetris zone.

#### Scenario: Starting complete row is destroyable from first ball launch
- **WHEN** the ball is launched at game start
- **THEN** the ball SHALL be able to reach and destroy the complete row at row 23 without any Tetris player action required

#### Scenario: Starting incomplete rows are breakable
- **WHEN** the ball contacts an OCCUPIED cell in rows 24–25 at game start
- **THEN** that cell SHALL be individually destroyable (per breakout-engine spec) because the complete row at row 23 sits above it

### Requirement: Cell destruction scoring
When `CELL_DESTROYED` is emitted, the scoring system SHALL award `POINTS_CELL_DESTROYED = 25` points. This is proportional to `POINTS_ROW_DESTROYED / GRID_COLS` (250 / 10).

#### Scenario: Points awarded for individual cell break
- **WHEN** `CELL_DESTROYED` is emitted
- **THEN** the session score SHALL increase by 25 points
