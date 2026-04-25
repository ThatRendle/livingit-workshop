## ADDED Requirements

### Requirement: Breakout zone pre-filled at game start
At game start, the bottom three rows of the Breakout zone (rows 23–25) SHALL be pre-filled using one of four fixed tetromino configurations chosen at random. Row 23 SHALL be fully filled and marked `COMPLETED`. Rows 24–25 SHALL be partially filled with `OCCUPIED` cells. All pre-filled cells SHALL carry a `pieceType` matching their tetromino of origin for correct colour rendering.

#### Scenario: Game starts with complete row at row 23
- **WHEN** a new game session begins
- **THEN** all 10 cells in row 23 SHALL have `state = COMPLETED` with a non-null `pieceType`

#### Scenario: Rows 24 and 25 are incomplete
- **WHEN** a new game session begins
- **THEN** rows 24 and 25 SHALL each have between 1 and 9 `OCCUPIED` cells and SHALL NOT be fully filled

#### Scenario: Configuration is randomly selected
- **WHEN** multiple game sessions are played
- **THEN** each of the four fixed configurations SHALL be selectable, giving visual variety across sessions

### Requirement: Four fixed pit configurations
The system SHALL define exactly four hardcoded pit configurations. Each configuration SHALL represent a valid placement of exactly six standard tetrominoes (from the set I, J, L, O, S, T, Z) into the three-row area such that row 23 is completely covered and rows 24–25 are each partially covered.

#### Scenario: Config 0 — left-heavy
- **WHEN** configuration 0 is selected
- **THEN** row 23 SHALL be filled with two I-pieces (cols 0–3, 4–7) and one O-piece (cols 8–9 spanning rows 23–24); row 24 SHALL have 8 cells; row 25 SHALL have 6 cells

#### Scenario: Config 1 — right-heavy
- **WHEN** configuration 1 is selected
- **THEN** row 23 SHALL be filled with two I-pieces and one O-piece; row 24 SHALL have 6 cells; row 25 SHALL have 8 cells

#### Scenario: Config 2 — sparse bottom
- **WHEN** configuration 2 is selected
- **THEN** row 23 SHALL be filled with two I-pieces and one O-piece; row 24 SHALL have 8 cells; row 25 SHALL have 5 cells

#### Scenario: Config 3 — distinct complete row
- **WHEN** configuration 3 is selected
- **THEN** row 23 SHALL be filled with a J-piece (cols 0–2), a T-piece (cols 3–5), and an I-piece (cols 6–9); row 24 and row 25 SHALL each have 7 cells
