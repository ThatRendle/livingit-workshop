### Requirement: Logical canvas and scale
The game SHALL render at a logical canvas of 560 × 860 px. The pit SHALL be 300 × 780 px (10 columns × 26 rows × 30 px per cell), centred horizontally with an 80 px top offset for the HUD. The canvas SHALL scale to fill the viewport using Phaser `FIT` scale mode with `autoCenter: CENTER_BOTH`, letterboxed with aspect ratio preserved. No external sprite assets are required for MVP.

#### Scenario: Canvas scales without distortion
- **WHEN** the browser viewport is smaller than 560 × 860 px
- **THEN** the game SHALL scale down uniformly and be letterboxed

### Requirement: Grid cell rendering
`OCCUPIED` cells SHALL be rendered as filled rectangles using the colour of the cell's `pieceType`. `COMPLETED` cells SHALL be rendered with a bright outline or distinct visual treatment that is distinguishable without colour alone. `EMPTY` cells SHALL not be rendered (background shows through).

#### Scenario: Completed row visually distinct
- **WHEN** a row has `state = COMPLETED`
- **THEN** it SHALL have an additional visual treatment (outline, brightness, or pattern) beyond colour alone

### Requirement: Active piece rendering
The active piece SHALL be rendered using `ActivePiece` data plus `PIECE_DEFINITIONS`, drawn as filled rectangles with the piece's assigned colour. The next piece preview SHALL be rendered in the right panel at a fixed position.

#### Scenario: Active piece uses piece colour
- **WHEN** the active piece is an I-piece
- **THEN** it SHALL render in the I-piece colour defined in `PIECE_DEFINITIONS`

### Requirement: Ball and paddle rendering
The ball SHALL be rendered as a filled circle of radius `BALL_RADIUS = 8 px`. The paddle SHALL be rendered as a rounded rectangle of width `PADDLE_WIDTH = 80 px`.

#### Scenario: Ball visible during play
- **WHEN** `ball.active = true`
- **THEN** the ball SHALL be rendered at `(ball.x, ball.y)` as a filled circle

### Requirement: HUD rendering
The HUD SHALL display the current score (updated on `SCORE_CHANGED`), the current speed level (updated on `BALL_DROPPED`), and the next piece preview (updated on `PIECE_LOCKED`). A zone divider line SHALL be drawn at `PIT_Y + TETRIS_ROWS × CELL_SIZE`. All HUD text SHALL use a minimum logical font size of 16 px.

#### Scenario: Score updates on event
- **WHEN** `SCORE_CHANGED` is emitted
- **THEN** the score display SHALL show the new score value immediately

### Requirement: Visual layer ordering
The rendering SHALL produce layers in this back-to-front order: background fill, pit border, zone divider, grid cells, active piece, ball, paddle, HUD overlay, menu/game-over overlay.

#### Scenario: Ball renders above grid
- **WHEN** the ball overlaps a cell position
- **THEN** the ball SHALL appear in front of the grid cell visually
