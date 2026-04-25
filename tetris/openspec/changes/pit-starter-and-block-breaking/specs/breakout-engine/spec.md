## MODIFIED Requirements

### Requirement: Grid cell collision in Breakout zone
The ball SHALL be tested against all occupied cells in rows 18–25 (Breakout zone) using AABB overlap. Before the collision loop each frame, the system SHALL scan the Breakout zone once to find `firstCompleteRow` — the lowest row index (closest to row 18) that contains any `COMPLETED` cell. For `COMPLETED` cells, the ball SHALL reflect and the entire row SHALL be destroyed. For `OCCUPIED` cells at a row index greater than `firstCompleteRow`, the ball SHALL reflect and that single cell SHALL be cleared to `EMPTY` and `CELL_DESTROYED` SHALL be emitted. For `OCCUPIED` cells where no `firstCompleteRow` exists or whose row index is not greater than `firstCompleteRow`, the ball SHALL reflect only, with no cell destruction. The ball SHALL NOT enter the Tetris zone.

#### Scenario: Ball reflects off OCCUPIED cell with no complete row above
- **WHEN** the ball overlaps an `OCCUPIED` cell in the Breakout zone and no `COMPLETED` row exists at a lower row index
- **THEN** the ball SHALL reflect on the nearest face and the cell SHALL remain unchanged

#### Scenario: Ball destroys OCCUPIED cell below a complete row
- **WHEN** the ball overlaps an `OCCUPIED` cell in the Breakout zone and a `COMPLETED` row exists at a lower row index
- **THEN** that single cell SHALL be set to `EMPTY`, `CELL_DESTROYED` SHALL be emitted, and the ball SHALL reflect

#### Scenario: Ball destroys COMPLETED cell
- **WHEN** the ball overlaps a `COMPLETED` cell in the Breakout zone
- **THEN** all cells in that row SHALL be set to `EMPTY`, `ROW_DESTROYED` SHALL be emitted with the row index, and the ball SHALL reflect

## ADDED Requirements

### Requirement: CELL_DESTROYED event
When an individual `OCCUPIED` cell is destroyed by the ball, the system SHALL emit `CELL_DESTROYED` with the row and column index of the destroyed cell. No row collapse SHALL occur as a result of `CELL_DESTROYED`.

#### Scenario: Event emitted on individual cell break
- **WHEN** the ball destroys a single `OCCUPIED` cell below a complete row
- **THEN** `CELL_DESTROYED` SHALL be emitted with `{ rowIndex, colIndex }` and the rest of the row SHALL remain unchanged
