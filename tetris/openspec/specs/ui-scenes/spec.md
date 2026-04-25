### Requirement: Scene structure
The game SHALL use four Phaser scenes: `BootScene` (asset loading, transitions to `MenuScene`), `MenuScene` (title and start prompt), `GameScene` (all gameplay and HUD), and `GameOverScene` (score and restart prompt). `GameOverScene` SHALL run as an overlay on top of a paused `GameScene`.

#### Scenario: Boot transitions to menu
- **WHEN** `BootScene` finishes loading
- **THEN** it SHALL transition immediately to `MenuScene`

### Requirement: MenuScene content
`MenuScene` SHALL display the game title, a controls summary (Tetris: WASD, Breakout: Arrow Keys), and a "Press SPACE to Start" prompt.

#### Scenario: Menu shows controls
- **WHEN** the menu is displayed
- **THEN** the title, control legend, and start prompt SHALL all be visible

### Requirement: GameOverScene overlay
When the game ends, `GameOverScene` SHALL launch as an overlay, displaying "GAME OVER", the final score, and a "Press SPACE or R to Restart" prompt. `GameScene` SHALL be paused (not destroyed).

#### Scenario: Score shown on game over
- **WHEN** `GameOverScene` launches
- **THEN** it SHALL display the exact final score from the completed session

### Requirement: Restart without browser refresh
On restart, `GameOverScene` SHALL be stopped and `GameScene` SHALL be restarted with a fully reset `GameSession`. No score, speed, or grid state SHALL carry over.

#### Scenario: No state leakage between sessions
- **WHEN** a new session starts after a restart
- **THEN** score SHALL be 0, `fallSpeedMultiplier` SHALL be 1.0, and the grid SHALL be empty

### Requirement: No event bus leakage between sessions
Event subscriptions from a completed session SHALL be cleared before the new session starts. No event SHALL fire from a previous session into the new one.

#### Scenario: Events cleared on restart
- **WHEN** a session restarts
- **THEN** no event handlers from the previous session SHALL remain active
