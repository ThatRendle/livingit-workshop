## ADDED Requirements

### Requirement: Central GameSession state object
The system SHALL maintain a single `GameSession` object as the source of truth for all runtime state: `phase`, `score`, `ballDropCount`, `fallSpeedMultiplier`, `grid`, `activePiece`, `nextPieceType`, `pieceBag`, `ball`, and `paddle`. `GameScene` SHALL own `GameSession` and pass it by reference to all systems at construction.

#### Scenario: Single source of truth
- **WHEN** any system reads or writes game state
- **THEN** it SHALL do so through the shared `GameSession` object, not a local copy

### Requirement: GamePhase state machine
The game SHALL have three phases: `MENU`, `PLAYING`, and `GAME_OVER`. Transitions: `MENU → PLAYING` on Start key press; `PLAYING → GAME_OVER` on `STACK_OVERFLOW`; `GAME_OVER → MENU` on Restart key press.

#### Scenario: Start from menu
- **WHEN** the Space key is pressed in `MENU` phase
- **THEN** phase SHALL become `PLAYING` and pieces SHALL begin falling

#### Scenario: Game over on stack overflow
- **WHEN** `STACK_OVERFLOW` is emitted
- **THEN** phase SHALL become `GAME_OVER` and `GameOverScene` SHALL launch as an overlay

#### Scenario: Restart resets state
- **WHEN** the restart key is pressed in `GAME_OVER` phase
- **THEN** `GameSession` SHALL be fully reset to initial values and `phase` SHALL become `PLAYING`

### Requirement: No persistence
`GameSession` SHALL exist only in memory. No game state SHALL be saved to localStorage, sessionStorage, cookies, or any external service. All state SHALL be lost on browser close or refresh.

#### Scenario: Fresh state on restart
- **WHEN** the player restarts after game over
- **THEN** score SHALL be 0, `fallSpeedMultiplier` SHALL be 1.0, and the grid SHALL be empty

### Requirement: System ownership of state partitions
Each system SHALL mutate only the portions of `GameSession` it owns: `TetrisSystem` owns `grid`, `activePiece`, `nextPieceType`, `pieceBag`; `BreakoutSystem` owns `ball`, `paddle`; `ScoringSystem` owns `score`; `SpeedRatchetSystem` owns `fallSpeedMultiplier`, `ballDropCount`.

#### Scenario: Systems do not cross-mutate state
- **WHEN** a system handles an event or update
- **THEN** it SHALL only write to the fields it owns in `GameSession`

### Requirement: Scoring
`ScoringSystem` SHALL award `POINTS_ROW_COMPLETED` points on each `ROW_COMPLETED` event and `POINTS_ROW_DESTROYED` points on each `ROW_DESTROYED` event. After each award, `SCORE_CHANGED` SHALL be emitted.

#### Scenario: Score increases on row completed
- **WHEN** `ROW_COMPLETED` is emitted
- **THEN** `session.score` SHALL increase by `POINTS_ROW_COMPLETED` and `SCORE_CHANGED` SHALL be emitted

#### Scenario: Score increases on row destroyed
- **WHEN** `ROW_DESTROYED` is emitted
- **THEN** `session.score` SHALL increase by `POINTS_ROW_DESTROYED` and `SCORE_CHANGED` SHALL be emitted
