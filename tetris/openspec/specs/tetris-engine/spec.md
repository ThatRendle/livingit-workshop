### Requirement: Grid data structure
The system SHALL represent the pit as a 2D grid of `Cell` objects with dimensions `GRID_COLS × TOTAL_ROWS`. Each cell SHALL have a `state` (`EMPTY`, `OCCUPIED`, or `COMPLETED`) and a `pieceType` (null when `EMPTY`). Row 0 is the top of the pit; row `TOTAL_ROWS - 1` is the bottom.

#### Scenario: Empty grid initialisation
- **WHEN** a new game session begins
- **THEN** all cells in the grid SHALL have `state = EMPTY` and `pieceType = null`

### Requirement: Active piece representation
The system SHALL maintain an `ActivePiece` with `type`, `rotationIndex` (0–3), `gridRow`, and `gridCol`. The active piece SHALL NOT exist in the grid until it locks. Its cell positions SHALL be derived from `PIECE_DEFINITIONS[type].rotations[rotationIndex]` plus the `(gridRow, gridCol)` offset.

#### Scenario: Active piece does not appear in grid
- **WHEN** a piece is falling
- **THEN** the grid cells it occupies SHALL remain `EMPTY` until the piece locks

### Requirement: Piece spawning
The system SHALL spawn the next piece at column 3, row 0 when a new piece is needed. It SHALL use the 7-bag shuffle algorithm: draw from a shuffled array of all 7 piece types; refill and reshuffle when exhausted.

#### Scenario: Spawn into occupied cells
- **WHEN** a new piece is spawned and its spawn position overlaps occupied grid cells
- **THEN** the system SHALL emit `STACK_OVERFLOW` and not place the piece

#### Scenario: Bag refill
- **WHEN** all 7 pieces have been drawn from the current bag
- **THEN** the system SHALL create a new shuffled bag of all 7 piece types before drawing the next piece

### Requirement: Piece falling
The system SHALL advance the active piece downward at an interval of `FALL_INTERVAL / fallSpeedMultiplier` milliseconds. When the piece cannot move further down, it SHALL lock.

#### Scenario: Fall blocked by floor
- **WHEN** the active piece's cells would move below row `TOTAL_ROWS - 1`
- **THEN** the piece SHALL lock immediately

#### Scenario: Fall blocked by occupied cell
- **WHEN** moving the piece down would place it on an occupied grid cell
- **THEN** the piece SHALL lock immediately

### Requirement: Piece locking
When a piece locks, the system SHALL write its cells into the grid as `OCCUPIED` with the piece's `PieceType`, then check every row in the piece's row range for completion.

#### Scenario: Lock writes correct cells
- **WHEN** a piece locks
- **THEN** each cell in the active piece's shape SHALL appear in the grid with `state = OCCUPIED` and `pieceType` set to the piece's type

### Requirement: Row completion detection
After a piece locks, the system SHALL check each row in the locked piece's row range. A row is complete when all 10 cells are non-`EMPTY`. Complete rows SHALL be marked as `COMPLETED` and `ROW_COMPLETED` SHALL be emitted for each.

#### Scenario: Full row marked completed
- **WHEN** all 10 cells in a row become non-`EMPTY` after a piece locks
- **THEN** all cells in that row SHALL have `state = COMPLETED` and `ROW_COMPLETED` SHALL be emitted with the row index

#### Scenario: Partial row not completed
- **WHEN** fewer than 10 cells in a row are non-`EMPTY`
- **THEN** no `ROW_COMPLETED` event SHALL be emitted for that row

### Requirement: Stack collapse on row destruction
When the system receives `ROW_DESTROYED`, it SHALL remove the destroyed row from the grid and insert a new `EMPTY` row at index 0, shifting all rows above the destroyed row down by one.

#### Scenario: Stack collapse correctness
- **WHEN** `ROW_DESTROYED` is received for row index N
- **THEN** rows 0 through N-1 SHALL each shift down by one row, and a new `EMPTY` row SHALL appear at row 0

### Requirement: SRS rotation with wall kicks
The system SHALL implement Super Rotation System rotation. On a rotation attempt, if the rotated piece is obstructed, the system SHALL test each SRS wall-kick offset in order and accept the first unobstructed one. If all offsets are obstructed, the rotation SHALL be cancelled with no state change. The I-piece SHALL use its own kick table; all other pieces SHALL share a common table.

#### Scenario: Rotation accepted without kick
- **WHEN** a piece is rotated and the rotated position is unobstructed
- **THEN** the rotation SHALL be applied with no offset

#### Scenario: Rotation accepted with wall kick
- **WHEN** a piece is rotated and the initial position is obstructed but a kick offset is unobstructed
- **THEN** the rotation SHALL be applied at the first valid kick offset

#### Scenario: Rotation cancelled
- **WHEN** a piece is rotated and all kick offsets are obstructed
- **THEN** no state change SHALL occur

### Requirement: Lateral movement with DAS/ARR
The system SHALL move the active piece left or right one column on initial input, then after `DAS_DELAY` ms repeat every `ARR_INTERVAL` ms while the key is held.

#### Scenario: Move blocked by wall
- **WHEN** moving left at column 0 or right at column `GRID_COLS - piece_width`
- **THEN** no movement SHALL occur

#### Scenario: Move blocked by occupied cell
- **WHEN** moving left or right would overlap an occupied grid cell
- **THEN** no movement SHALL occur

### Requirement: Soft drop
When soft drop input is held, the fall interval SHALL be reduced to `SOFT_DROP_INTERVAL`. Normal fall interval SHALL resume when the input is released.

#### Scenario: Soft drop accelerates fall
- **WHEN** soft drop key is held
- **THEN** the piece SHALL fall at `SOFT_DROP_INTERVAL` ms intervals instead of the normal interval

### Requirement: Stack overflow detection
If a spawned piece's cells overlap occupied grid cells, the system SHALL emit `STACK_OVERFLOW` to end the game.

#### Scenario: Game ends on overflow
- **WHEN** a new piece is spawned into occupied cells
- **THEN** `STACK_OVERFLOW` SHALL be emitted and no active piece SHALL be set
