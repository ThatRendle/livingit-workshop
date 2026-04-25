## ADDED Requirements

### Requirement: Ball physics
The system SHALL maintain a ball with pixel-space position `(x, y)` and velocity `(velocityX, velocityY)` in px/s. Each frame, the ball's position SHALL be advanced by `velocity × deltaTime`. The ball's total speed SHALL remain constant at `BALL_SPEED = 300 px/s`. Phaser Arcade Physics SHALL NOT be used.

#### Scenario: Ball moves each frame
- **WHEN** the game is in PLAYING phase and `ball.active = true`
- **THEN** the ball's position SHALL advance by `velocityX × delta` and `velocityY × delta` each frame

### Requirement: Wall and ceiling collision
The ball SHALL reflect off the left pit wall, right pit wall, and the zone boundary (top of Breakout zone, i.e. `PIT_Y + TETRIS_ROWS × CELL_SIZE`). On collision, the relevant velocity component SHALL be negated and the ball clamped to the boundary.

#### Scenario: Left wall reflection
- **WHEN** the ball reaches the left pit wall
- **THEN** `velocityX` SHALL be negated and the ball clamped to the wall

#### Scenario: Zone boundary reflection
- **WHEN** the ball reaches the zone boundary (ceiling of Breakout zone)
- **THEN** `velocityY` SHALL be negated and the ball clamped to the boundary

### Requirement: Paddle collision
The ball SHALL reflect off the paddle's top surface. `velocityY` SHALL be negated. `velocityX` SHALL be set proportional to the signed offset of the ball's centre from the paddle's centre, clamped to `±MAX_BALL_SPEED_X`. After each paddle hit the velocity vector SHALL be normalised and scaled to `BALL_SPEED`.

#### Scenario: Centre hit
- **WHEN** the ball hits the paddle at its centre
- **THEN** `velocityX` SHALL be 0 and the ball SHALL travel vertically upward

#### Scenario: Edge hit
- **WHEN** the ball hits the paddle near its edge
- **THEN** `velocityX` SHALL be near `±MAX_BALL_SPEED_X` and speed SHALL equal `BALL_SPEED`

### Requirement: Grid cell collision in Breakout zone
The ball SHALL be tested against all occupied cells in rows 18–25 (Breakout zone) using AABB overlap. For `OCCUPIED` cells, the ball SHALL reflect on the axis of least penetration. For `COMPLETED` cells, the ball SHALL reflect and the cell SHALL be marked for destruction. The ball SHALL NOT enter the Tetris zone.

#### Scenario: Ball reflects off OCCUPIED cell
- **WHEN** the ball overlaps an `OCCUPIED` cell in the Breakout zone
- **THEN** the ball SHALL reflect on the nearest face without destroying the cell

#### Scenario: Ball destroys COMPLETED cell
- **WHEN** the ball overlaps a `COMPLETED` cell in the Breakout zone
- **THEN** the cell SHALL be marked for destruction and the ball SHALL reflect

### Requirement: Ball drop and respawn
When the ball's `y` position exceeds the bottom of the pit (`PIT_Y + TOTAL_ROWS × CELL_SIZE`), the system SHALL emit `BALL_DROPPED` and call `respawnBall()`. `respawnBall()` SHALL place the ball at the paddle's centre x, `BALL_RADIUS + 2` pixels above the paddle, and set velocity at 315° (upward-right at 45°).

#### Scenario: Ball respawn position
- **WHEN** `respawnBall()` is called
- **THEN** the ball SHALL be placed above the paddle centre with velocity pointing upward-right at 45° and speed equal to `BALL_SPEED`

### Requirement: Paddle movement
The paddle SHALL move left and right in response to input at `PADDLE_SPEED = 350 px/s`. The paddle SHALL be clamped so its edges remain within the pit.

#### Scenario: Paddle clamped at left wall
- **WHEN** the paddle is moved left past the pit boundary
- **THEN** the paddle SHALL stop at `PIT_X + PADDLE_WIDTH / 2`

#### Scenario: Paddle clamped at right wall
- **WHEN** the paddle is moved right past the pit boundary
- **THEN** the paddle SHALL stop at `PIT_X + PIT_WIDTH - PADDLE_WIDTH / 2`
