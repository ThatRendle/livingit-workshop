### Requirement: Two-player key mapping
The system SHALL use WASD for the Tetris Player (left hand) and Arrow keys for the Breakout Player (right hand). Space SHALL start the game or confirm menus. All key bindings SHALL be defined in a single `INPUT_MAP` constant in `src/config.ts`; no bindings SHALL be inlined elsewhere.

#### Scenario: Both players can act simultaneously
- **WHEN** the Tetris Player holds A and the Breakout Player holds ArrowLeft
- **THEN** both the piece and paddle SHALL move left simultaneously

### Requirement: DAS/ARR for lateral piece movement
When A or D is held, the piece SHALL move one column immediately, then after `DAS_DELAY` ms delay, repeat every `ARR_INTERVAL` ms while held.

#### Scenario: Initial move on key press
- **WHEN** A or D is pressed
- **THEN** the piece SHALL move one column immediately

#### Scenario: Auto-repeat after DAS delay
- **WHEN** A or D is held for longer than `DAS_DELAY` ms
- **THEN** the piece SHALL continue moving one column every `ARR_INTERVAL` ms

### Requirement: Edge-triggered rotation
The rotate action (W) SHALL fire exactly once per key press, not repeat while held.

#### Scenario: Single rotation per keypress
- **WHEN** W is pressed once
- **THEN** the piece SHALL rotate exactly once regardless of how long the key is held

### Requirement: Continuous paddle movement
Arrow keys for paddle movement SHALL be polled each frame; the paddle SHALL move while the key is held.

#### Scenario: Paddle moves while key held
- **WHEN** ArrowLeft or ArrowRight is held
- **THEN** the paddle SHALL move continuously at `PADDLE_SPEED` px/s

### Requirement: Input polling (not event-driven)
Input SHALL be polled once per game loop update using Phaser's `KeyboardPlugin.isDown`. Rotation SHALL use `JustDown` for edge detection. Input SHALL not use event listeners for continuous actions.

#### Scenario: Input read each frame
- **WHEN** the game loop update runs
- **THEN** all key states SHALL be read via `isDown` (or `justDown` for rotation) in that frame's update call
