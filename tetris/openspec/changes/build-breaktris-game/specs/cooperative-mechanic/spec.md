## ADDED Requirements

### Requirement: Completed rows become destructible bricks
When a Tetris row is completed, its cells SHALL transition to `COMPLETED` state and become destructible by the ball in the Breakout zone. Completed rows SHALL NOT be automatically removed; they persist until the ball destroys them.

#### Scenario: Row transitions to COMPLETED state
- **WHEN** all 10 cells in a row become occupied after a piece locks
- **THEN** all cells in that row SHALL have `state = COMPLETED` and SHALL be rendered with a distinct visual treatment (see rendering spec)

### Requirement: Ball destroys completed rows
When the ball contacts a `COMPLETED` row, all cells in that row SHALL be set to `EMPTY` and `ROW_DESTROYED` SHALL be emitted. The ball SHALL continue moving after the destruction (not stopped).

#### Scenario: Ball destroys a completed row
- **WHEN** the ball overlaps any cell in a `COMPLETED` row
- **THEN** all cells in that row SHALL be set to `EMPTY`, `ROW_DESTROYED` SHALL be emitted with the row index, and the ball SHALL continue

### Requirement: Stack collapse propagation
When `ROW_DESTROYED` is emitted, `TetrisSystem` SHALL remove that row and shift all rows above it down by one, inserting a new `EMPTY` row at the top.

#### Scenario: Stack collapses after row destruction
- **WHEN** `ROW_DESTROYED` is received by TetrisSystem
- **THEN** the destroyed row SHALL be removed, all rows above it SHALL shift down by one, and a new empty row SHALL appear at row 0

### Requirement: Speed ratchet on ball drop
Each time the ball drops below the pit (`BALL_DROPPED` event), the fall speed multiplier SHALL increase by `SPEED_RATCHET_INCREMENT × ballDropCount`, capped at `SPEED_RATCHET_MAX`. The multiplier SHALL never decrease within a session.

#### Scenario: Speed increases on first drop
- **WHEN** the ball drops for the first time
- **THEN** `fallSpeedMultiplier` SHALL be `SPEED_RATCHET_BASE × (1 + SPEED_RATCHET_INCREMENT × 1)` and `SPEED_CHANGED` SHALL be emitted

#### Scenario: Speed never decreases
- **WHEN** the ball drops multiple times
- **THEN** `fallSpeedMultiplier` SHALL be monotonically increasing and SHALL NOT exceed `SPEED_RATCHET_MAX`

### Requirement: Cross-system communication via EventBus only
TetrisSystem and BreakoutSystem SHALL NOT hold direct references to each other. All interaction SHALL occur through named events on the shared EventBus. All events SHALL be synchronous.

#### Scenario: No direct system references
- **WHEN** TetrisSystem needs to respond to a ball action
- **THEN** it SHALL do so via an event subscription, not a method call on BreakoutSystem
