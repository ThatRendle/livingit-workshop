# Breaktris — Technical Specification

Version: 1.0
Status: Draft
Author: Technical Architect
Date: 2026-04-25

---

## 1. Overview

Breaktris is a local two-player cooperative browser game. One player controls falling Tetris pieces (the Tetris Player) in the upper portion of a shared vertical pit; the other controls a ball and paddle (the Breakout Player) in the lower portion. Completed Tetris rows become destructible bricks that the ball must destroy to collapse the stack. The game ends when the Tetris stack reaches the top of the pit.

This specification covers the complete technical implementation: engine, rendering, physics, input, data architecture, systems, and asset pipeline. It is the binding technical contract for the implementation team.

---

## 2. Platform and Distribution

| Dimension | Target |
|-----------|--------|
| Platform | Desktop web browser (no plugins) |
| Browsers | Chrome 100+, Firefox 100+, Safari 15+, Edge 100+ |
| Screen | Desktop/laptop; minimum viewport 600×800px |
| Input | Physical keyboard only; touch and gamepad are **out of scope** |
| Distribution | Static file hosting (GitHub Pages, Netlify, or itch.io web embed) |
| Offline | Fully functional after initial load; no runtime network dependency |
| Server | None required |

The game is a single self-contained HTML page with a bundled JavaScript file and optional static assets. No build step is required at runtime.

---

## 3. Engine and Technology Stack

| Component | Choice | Version |
|-----------|--------|---------|
| Game framework | Phaser 3 | 3.80+ |
| Language | TypeScript | 5.x |
| Bundler | Vite | 5.x |
| Unit test runner | Vitest | 1.x |
| Linter | ESLint + `@typescript-eslint` | Latest |
| Formatter | Prettier | 3.x |

**Rationale — Phaser 3:** Phaser provides a requestAnimationFrame game loop, WebGL rendering with Canvas 2D fallback, a scene system, keyboard input management, and built-in geometry primitives. It is mature, MIT-licensed, and well-suited to 2D arcade games with grid-based mechanics. Raw Canvas would require hand-rolling every subsystem. Three.js is overbuilt for 2D. PixiJS is rendering-only and would require external physics and input handling.

**Rationale — TypeScript:** The game contains two interacting stateful systems (Tetris, Breakout) connected by shared mutable state and an event bus. Strong typing prevents category errors (e.g. pixel coordinates vs. grid coordinates) that are common sources of bugs in this class of game.

**Rationale — Vite:** Provides fast HMR for iterative development, TypeScript transpilation with no configuration overhead, and a production build that outputs a single bundled JS file suitable for static deployment.

---

## 4. Rendering

| Property | Value |
|----------|-------|
| Renderer | Phaser 3 (WebGL, Canvas 2D fallback) |
| Dimensionality | 2D orthographic |
| Rendering style | Shape/geometry primitives (rectangles, circles, lines); no external sprite assets required for MVP |
| Logical canvas | 560 × 860 px |
| Pit dimensions | 300 × 780 px (10 columns × 26 rows × 30 px per cell) |
| Pit position | Centred horizontally; top offset 80 px (HUD area above) |
| Scale mode | Phaser `FIT` scale mode; letterboxed to viewport; aspect ratio preserved |
| Target frame rate | 60 fps |
| HDR | Not required |
| Post-processing | None |

### Grid Constants (define in `src/config.ts`)

```typescript
CELL_SIZE     = 30      // px per grid cell (logical)
GRID_COLS     = 10
TETRIS_ROWS   = 18      // rows 0–17 (top of pit to zone boundary)
BREAKOUT_ROWS = 8       // rows 18–25 (zone boundary to bottom of pit)
TOTAL_ROWS    = 26      // TETRIS_ROWS + BREAKOUT_ROWS
CANVAS_W      = 560
CANVAS_H      = 860
PIT_X         = 130     // left edge of pit in canvas coords
PIT_Y         = 80      // top edge of pit in canvas coords
```

`TETRIS_ROWS` and `BREAKOUT_ROWS` are the defaults for open question OQ-005. Both constants must be centralised in `config.ts`; they must not be inlined anywhere else in the codebase so that the split can be adjusted without a code search.

### Visual Layers (back to front)

1. Background fill
2. Pit border
3. Zone divider line (between Tetris zone and Breakout zone)
4. Grid cells (occupied, completed, empty)
5. Active Tetris piece (ghost/shadow piece is a **Should Have**, not MVP)
6. Breakout ball
7. Paddle
8. HUD overlay (score, speed indicator)
9. Menu / Game Over overlay

---

## 5. Physics and Collision

The Tetris subsystem is purely grid-based; it uses no physics engine. The Breakout subsystem uses custom discrete-step collision detection. **Phaser's Arcade Physics system is not used.**

### Breakout Ball Collision

The ball is a circle of radius `BALL_RADIUS = 8px` (logical). Each frame, the ball's position is advanced by `velocity × deltaTime`. After each step, the following collision tests are applied in priority order:

| Collision | Behaviour |
|-----------|-----------|
| Left pit wall | Reflect `velocityX`, clamp ball to wall |
| Right pit wall | Reflect `velocityX`, clamp ball to wall |
| Zone boundary (top of Breakout zone) | Reflect `velocityY`, clamp ball to boundary |
| Occupied grid cell (incomplete row) | Reflect on the face struck; cell is **not** destroyed |
| Completed grid row | Reflect on the face struck; row is destroyed (see §11.4); emit `ROW_DESTROYED` |
| Paddle top surface | Reflect `velocityY`; modify `velocityX` based on paddle-relative hit position |
| Bottom of pit (ball drop) | Emit `BALL_DROPPED`; respawn ball |

**Paddle angle response:** When the ball hits the paddle, `velocityX` is set proportional to the signed offset of the ball's centre from the paddle's centre, clamped to `±MAX_BALL_SPEED_X`. `velocityY` is always reflected (negated). This gives the Breakout Player directional control. The ball's total speed is held constant after each paddle hit (normalise velocity vector, then scale to `BALL_SPEED`).

**Ball speed:** `BALL_SPEED = 300 px/s` (logical). This is a constant; the Speed Ratchet does not affect ball speed.

**Grid cell collision:** The ball is tested against each occupied cell in rows 18–25 (Breakout zone). For each occupied cell, construct its AABB. If the ball overlaps the AABB, determine the axis of least penetration and reflect accordingly. Only cells in the Breakout zone are tested; the ball cannot enter the Tetris zone.

**Tunnelling prevention:** Given `BALL_SPEED = 300 px/s` and target frame time of 16.67 ms, maximum ball displacement per frame is `~5 px`. Cell size is 30 px. Tunnelling through a single cell in one frame is not possible. No sub-step integration is required.

---

## 6. Input

| Action | Player | Default Key |
|--------|--------|-------------|
| Move piece left | Tetris Player | `A` |
| Move piece right | Tetris Player | `D` |
| Rotate piece clockwise | Tetris Player | `W` |
| Soft drop | Tetris Player | `S` |
| Move paddle left | Breakout Player | `←` (ArrowLeft) |
| Move paddle right | Breakout Player | `→` (ArrowRight) |
| Start game | Either | `Space` |
| Restart (Game Over screen) | Either | `Space` or `R` |

**Key separation:** WASD (left hand) and Arrow keys (right hand) provide physical separation on a standard keyboard to allow simultaneous input without conflict.

**Input abstraction:** All key bindings are defined as a single `INPUT_MAP` constant in `src/config.ts`. No runtime remapping is implemented in v1.0. If OQ-002 (accessibility) requires remapping, it can be added by replacing `INPUT_MAP` with a user-editable structure without changing the input consumers.

**Keyboard ghosting:** On low-cost keyboards, simultaneous `W+A+S+D+ArrowLeft+ArrowRight` (6-key rollover) may not be fully supported. The selected key set (WASD + arrows) is within the 6-key rollover capability of the majority of keyboards sold in the past decade. This is documented as a known limitation, not a defect.

**Input polling:** The input system is polled once per game loop update. Phaser's `Phaser.Input.Keyboard.KeyboardPlugin` is used to read `isDown` state each frame. Input events are not edge-triggered for continuous actions (movement, soft drop, paddle movement). The Tetris rotation action (`W`) is edge-triggered (fires once per keypress, not held).

**Repeat delay for Tetris lateral movement:** When `A` or `D` is held, the piece moves one column immediately, then after a 150 ms delay, repeats every 50 ms (DAS/ARR — Delayed Auto Shift / Auto Repeat Rate). These values are configurable constants in `src/config.ts`.

---

## 7. Audio

Audio is **out of scope** for v1.0 (see requirements §4.2, OQ-003).

The codebase must include an `AudioSystem` stub (empty class implementing a defined `IAudioSystem` interface) so that audio calls in other systems compile and can be wired to a real implementation later without refactoring call sites.

Phaser's built-in audio system (Web Audio API) is the designated future implementation path. No third-party audio middleware is required.

---

## 8. Game State and Data Architecture

### 8.1 Architecture Pattern

The game uses a **plain object-oriented architecture with a central event bus** rather than ECS or a DOD approach. Justification: the game has two clearly bounded subsystems (Tetris, Breakout) with well-defined interfaces, a small number of entities, and no performance requirement that would justify ECS overhead.

The event bus is the sole channel for cross-system communication. Systems do not hold direct references to each other.

### 8.2 Game Phases

```
GamePhase = MENU | PLAYING | GAME_OVER
```

Transitions:
- `MENU → PLAYING`: player presses Start key
- `PLAYING → GAME_OVER`: `STACK_OVERFLOW` event received
- `GAME_OVER → MENU`: player presses Restart key

### 8.3 The Pit Grid

The pit is a single unified grid of `GRID_COLS × TOTAL_ROWS` cells. There is no separate data structure for the Tetris zone and Breakout zone; they are regions within the same grid.

```
enum CellState { EMPTY, OCCUPIED, COMPLETED }

type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

interface Cell {
  state: CellState
  pieceType: PieceType | null   // null when EMPTY; used for colour coding
}

type Grid = Cell[][]   // [row][col]; row 0 = top of pit, row TOTAL_ROWS-1 = bottom
```

**Invariants:**
- `EMPTY` cells always have `pieceType = null`.
- `COMPLETED` cells have `pieceType` set to the piece type of the row's first occupied cell (for colour display).
- A `COMPLETED` row is a row where every cell in columns 0–9 has `state !== EMPTY`.
- No `COMPLETED` cells exist in rows 0 through (`TETRIS_ROWS - 1`) above the highest occupied row — i.e. the Tetris Player cannot have a completed row floating above empty space. (Stack collapse preserves this.)

### 8.4 Active Piece

```
interface ActivePiece {
  type: PieceType
  rotationIndex: number       // 0–3
  gridRow: number             // row of top-left corner of 4×4 bounding box
  gridCol: number             // col of top-left corner of 4×4 bounding box
}
```

The active piece's cells are derived from `PIECE_DEFINITIONS[type].rotations[rotationIndex]` plus `(gridRow, gridCol)` offset. The piece does not exist in the `Grid` until it locks.

### 8.5 Ball and Paddle

```
interface Ball {
  x: number          // pixel position within canvas (not grid coords)
  y: number
  velocityX: number  // px/s
  velocityY: number  // px/s
  active: boolean
}

interface Paddle {
  x: number          // centre x in canvas coords
  width: number      // px; constant (PADDLE_WIDTH = 80)
  speed: number      // px/s; constant (PADDLE_SPEED = 350)
}
```

Ball and paddle positions are stored in canvas pixel coordinates, not grid coordinates. Conversion to grid coordinates (for cell collision) is `gridCol = floor((x - PIT_X) / CELL_SIZE)`, `gridRow = floor((y - PIT_Y) / CELL_SIZE)`.

### 8.6 Session State

```
interface GameSession {
  phase: GamePhase
  score: number
  ballDropCount: number
  fallSpeedMultiplier: number   // starts at 1.0; increases on BALL_DROPPED
  grid: Grid
  activePiece: ActivePiece | null
  nextPieceType: PieceType
  pieceBag: PieceType[]         // remaining pieces in current 7-bag shuffle
  ball: Ball
  paddle: Paddle
}
```

`GameSession` is the single source of truth. It is owned by `GameScene` and passed (by reference) to all systems at construction time. Systems mutate only the portions of `GameSession` they own:

| System | Owns |
|--------|------|
| `TetrisSystem` | `grid`, `activePiece`, `nextPieceType`, `pieceBag` |
| `BreakoutSystem` | `ball`, `paddle` |
| `ScoringSystem` | `score` |
| `SpeedRatchetSystem` | `fallSpeedMultiplier`, `ballDropCount` |

### 8.7 Persistence

No persistence. `GameSession` exists only in memory. On browser close or refresh, all state is lost. This is a stated requirement (§4.2).

---

## 9. Networking

Not applicable. The game is single-device, local co-op only. No networking code is required.

---

## 10. UI and HUD

### 10.1 Scenes

Phaser 3 scenes are used for all UI states:

| Scene Key | Purpose |
|-----------|---------|
| `BootScene` | Loads any static assets; transitions immediately to `MenuScene` |
| `MenuScene` | Displays title, controls summary, start prompt |
| `GameScene` | All gameplay; owns all game systems and the HUD |
| `GameOverScene` | Displays final score and restart prompt; launched in parallel with `GameScene` (overlay) |

`GameScene` and `GameOverScene` run concurrently when the game ends: `GameScene` is paused (not destroyed), `GameOverScene` is launched as an overlay. On restart, `GameOverScene` is stopped and `GameScene` is restarted (not recreated).

### 10.2 HUD Elements (rendered within GameScene)

| Element | Position | Update trigger |
|---------|----------|----------------|
| Score | Top-centre of canvas | `SCORE_CHANGED` event |
| Speed level indicator | Top-right | `BALL_DROPPED` event |
| Next piece preview | Right of pit | `PIECE_LOCKED` event |
| Zone divider line | Horizontal line at `PIT_Y + TETRIS_ROWS × CELL_SIZE` | Static |

All HUD text uses Phaser's `Phaser.GameObjects.Text` with a monospace bitmap-style font (system monospace; no external font asset required for MVP).

### 10.3 UI State Management

UI state follows the `GamePhase` state machine (§8.2). There is no separate UI state machine; scenes are activated and deactivated to match phase transitions.

### 10.4 Supported Resolutions

The canvas scales to fill the viewport using Phaser's `FIT` scale mode with `autoCenter: CENTER_BOTH`. The game is designed at 560×860 logical pixels. On viewports smaller than 560×860, the game scales down uniformly (letterboxed). The game is not designed for mobile viewports.

---

## 11. Key Systems and Data Structures

### 11.1 Event Bus

**Responsibility:** Decoupled publish/subscribe channel for cross-system events.

**Implementation:** A lightweight typed event emitter (thin wrapper around Phaser's `EventEmitter`, or a standalone implementation with ~30 lines of TypeScript).

**Events:**

| Event | Publisher | Subscriber(s) | Payload |
|-------|-----------|---------------|---------|
| `ROW_COMPLETED` | `TetrisSystem` | `ScoringSystem` | `{ rowIndex: number }` |
| `ROW_DESTROYED` | `BreakoutSystem` | `TetrisSystem`, `ScoringSystem` | `{ rowIndex: number }` |
| `BALL_DROPPED` | `BreakoutSystem` | `SpeedRatchetSystem` | none |
| `PIECE_LOCKED` | `TetrisSystem` | `HUD` | `{ nextPieceType: PieceType }` |
| `STACK_OVERFLOW` | `TetrisSystem` | `GameScene` | none |
| `SCORE_CHANGED` | `ScoringSystem` | `HUD` | `{ score: number }` |
| `SPEED_CHANGED` | `SpeedRatchetSystem` | `TetrisSystem`, `HUD` | `{ multiplier: number }` |

All events are synchronous (fired during the frame update in which the triggering action occurs). No async events.

---

### 11.2 TetrisSystem

**Responsibility:** Manages the active falling piece, spawns new pieces, handles player input (move/rotate/soft drop), detects row completion, marks completed rows, detects stack overflow, and applies stack collapse when a row is destroyed.

**Key operations:**

| Operation | Trigger | Behaviour |
|-----------|---------|-----------|
| Spawn piece | `PIECE_LOCKED` or game start | Draw `nextPieceType` from `pieceBag`; create `ActivePiece` at column 3, row 0; emit `PIECE_LOCKED` with next piece; if spawn position is occupied → emit `STACK_OVERFLOW` |
| Fall | Each frame | Advance `activePiece.gridRow` downward at `FALL_INTERVAL / fallSpeedMultiplier`; if blocked → lock |
| Move left/right | Input | Shift `gridCol ±1` if not blocked |
| Rotate | Input (edge-triggered) | Advance `rotationIndex`; apply SRS wall kicks (see §11.2.1) |
| Soft drop | Input (held) | Fall interval reduced to `SOFT_DROP_INTERVAL` while held |
| Lock | Cannot fall further | Write active piece cells to `grid` (state = OCCUPIED); check each row in piece's row range for completion |
| Row completion check | After lock | For each row in 0..TOTAL_ROWS-1 that is entirely non-EMPTY: mark all cells in that row as `COMPLETED`; emit `ROW_COMPLETED` |
| Stack collapse | `ROW_DESTROYED` received | Remove the destroyed row from the grid; insert a new EMPTY row at index 0 (top); shift all rows above down by one |

**Fall timing:** The system maintains an accumulator. `FALL_INTERVAL = 800 ms` at multiplier 1.0. At multiplier `m`, the effective fall interval is `FALL_INTERVAL / m`. Both constants are in `src/config.ts`.

**Invariant:** `activePiece` is non-null whenever `phase === PLAYING` (after the first spawn). Between lock and next spawn there is a zero-frame gap (spawn is synchronous with lock).

#### 11.2.1 Rotation — SRS Wall Kicks

Rotation uses the Super Rotation System. When a rotation is attempted:
1. Apply the rotation to the piece in its current position.
2. If the rotated piece is unobstructed, accept.
3. If obstructed, test each offset in the SRS wall kick table for the current piece type and rotation transition.
4. Accept the first unobstructed offset.
5. If all offsets are obstructed, cancel the rotation (no state change).

SRS kick tables are defined in `src/data/wallKicks.ts` as constant data. The I-piece uses its own table; all other pieces share a common table.

#### 11.2.2 Piece Definitions

Pieces are defined in `src/data/pieces.ts` as:

```typescript
interface PieceDefinition {
  type: PieceType
  colour: number          // Phaser hex colour
  rotations: [number, number][][]  // 4 rotations; each is array of [row, col] offsets
                                   // relative to 4×4 bounding box top-left
}
```

All 7 standard tetrominoes (I, O, T, S, Z, J, L) are defined. Piece shapes are pure data; changing piece definitions does not require changes to `TetrisSystem` logic.

#### 11.2.3 Piece Randomisation

A 7-bag shuffle is used: `pieceBag` is initialised as a shuffled array of all 7 piece types. When `pieceBag` is exhausted, it is refilled with a new shuffle. This ensures every piece appears once per 7 pieces, preventing long droughts.

---

### 11.3 BreakoutSystem

**Responsibility:** Manages ball physics, paddle movement, collision detection, ball drop detection, and ball respawn.

**Update loop (each frame, delta in seconds):**

1. Read paddle input; update `paddle.x` (clamped to pit bounds: `PIT_X + PADDLE_WIDTH/2` to `PIT_X + PIT_WIDTH - PADDLE_WIDTH/2`).
2. If `ball.active`:
   a. Compute candidate new position: `newX = ball.x + ball.velocityX × delta`, `newY = ball.y + ball.velocityY × delta`.
   b. Test wall collisions (left/right pit walls, zone boundary as ceiling).
   c. Test grid cell collisions for all occupied/completed cells in Breakout zone rows.
   d. Test paddle collision.
   e. If `newY > PIT_Y + TOTAL_ROWS × CELL_SIZE`: ball has dropped → emit `BALL_DROPPED` → call `respawnBall()`.
   f. Apply resolved position.
3. If `!ball.active`: no update.

**Ball respawn:** `respawnBall()` places the ball at the paddle's centre x, at `y = paddle.y - BALL_RADIUS - 2`, sets `velocityX = BALL_SPEED × cos(315°)`, `velocityY = BALL_SPEED × sin(315°)` (i.e. upward-right at 45°). Sets `ball.active = true`.

**Collision response for grid cells:**
- Determine which cells the ball's AABB overlaps.
- For each overlapping cell where `cell.state !== EMPTY`:
  - If `cell.state === COMPLETED`: mark cell for destruction; do not reflect yet (all collisions resolved first).
  - If `cell.state === OCCUPIED`: reflect on the nearest face.
- After all cells processed: remove destroyed cells and emit `ROW_DESTROYED` for each fully-destroyed row (see §11.4 for destruction semantics).

---

### 11.4 Row Destruction

When the ball contacts one or more cells in a `COMPLETED` row:
- All cells in that row are set to `EMPTY`.
- `ROW_DESTROYED` is emitted with `rowIndex`.
- `TetrisSystem` handles `ROW_DESTROYED` by applying stack collapse (§11.2).
- The ball continues (is not stopped by the destruction).

A single ball pass can destroy at most one completed row per frame (multiple completed rows in the Breakout zone can each be destroyed on separate passes). This is not explicitly restricted — the collision loop processes each row independently.

---

### 11.5 ScoringSystem

**Responsibility:** Maintains `session.score`. Responds to score-affecting events.

| Event | Points awarded | Notes |
|-------|----------------|-------|
| `ROW_COMPLETED` | 100 | Per row; **placeholder** — OQ-004 pending |
| `ROW_DESTROYED` | 200 | Per row; **placeholder** — OQ-004 pending |

After each award, `ScoringSystem` emits `SCORE_CHANGED`.

Scoring constants are defined in `src/config.ts` (`POINTS_ROW_COMPLETED`, `POINTS_ROW_DESTROYED`) so they can be updated when OQ-004 is resolved without code search.

---

### 11.6 SpeedRatchetSystem

**Responsibility:** Tracks ball drop count; increases fall speed multiplier on each `BALL_DROPPED` event.

```
On BALL_DROPPED:
  session.ballDropCount += 1
  session.fallSpeedMultiplier = min(
    SPEED_RATCHET_BASE * (1 + SPEED_RATCHET_INCREMENT * session.ballDropCount),
    SPEED_RATCHET_MAX
  )
  emit SPEED_CHANGED { multiplier: session.fallSpeedMultiplier }
```

**Constants (in `src/config.ts`, all pending OQ-008):**

| Constant | Default value |
|----------|---------------|
| `SPEED_RATCHET_BASE` | 1.0 |
| `SPEED_RATCHET_INCREMENT` | 0.15 (15% per drop) |
| `SPEED_RATCHET_MAX` | 4.0 (4× initial speed) |

The speed multiplier is one-way: it never decreases within a session.

---

### 11.7 InputSystem

**Responsibility:** Reads Phaser keyboard state each frame; dispatches typed input actions to the correct system.

`InputSystem.update(delta)` is called once per frame. It reads `Phaser.Input.Keyboard.Key.isDown` for each mapped key and calls the appropriate method on `TetrisSystem` or `BreakoutSystem`. Rotation (`W`) is edge-triggered via `justDown`.

DAS/ARR for lateral piece movement is implemented inside `InputSystem` using accumulators, not inside `TetrisSystem`.

---

### 11.8 GameScene (Orchestrator)

**Responsibility:** Owns all systems and the `GameSession`; drives the update loop; handles phase transitions.

```
GameScene.create():
  initialise GameSession
  initialise EventBus
  construct TetrisSystem(session, eventBus)
  construct BreakoutSystem(session, eventBus)
  construct ScoringSystem(session, eventBus)
  construct SpeedRatchetSystem(session, eventBus)
  construct InputSystem(session, eventBus, tetrisSystem, breakoutSystem)
  construct HUD(session, eventBus)
  subscribe to STACK_OVERFLOW → onGameOver()

GameScene.update(time, delta):
  if phase !== PLAYING: return
  inputSystem.update(delta)
  tetrisSystem.update(delta)
  breakoutSystem.update(delta)
  renderSystem.render(session)  // or Phaser game objects update themselves

GameScene.onGameOver():
  session.phase = GAME_OVER
  scene.launch('GameOverScene', { score: session.score })
  scene.pause()
```

---

## 12. Asset Pipeline

For MVP, all visuals are drawn using Phaser's `Graphics` API (rectangles, rounded rectangles, circles, lines). No external image assets are required.

If sprite assets are introduced in future:
- Format: PNG (power-of-two dimensions preferred)
- Authoring: any raster tool (Aseprite recommended for pixel art)
- Processing: none required beyond export
- Versioning: committed to the repository alongside source; processed by Vite's static asset handling

Audio assets (when OQ-003 is resolved):
- Format: MP3 (primary) with OGG fallback for Firefox compatibility
- Phaser loads both and selects based on browser capability

All assets are bundled/served statically; no CDN or runtime asset fetching.

---

## 13. Localisation and Accessibility

### Localisation
Not in scope for v1.0. All UI strings are hard-coded in English. String literals must be defined as named constants in `src/strings.ts` (not inlined in rendering code) to enable extraction for l10n in a future version without a code search.

### Accessibility
Minimum requirements for v1.0 (pending OQ-002):

- **Colour differentiation:** Each of the 7 Tetris piece types uses a distinct colour. Colour alone is not used to distinguish completed rows from occupied rows — completed rows must have an additional visual treatment (e.g. outline, brightness, pattern) visible to users with common colour vision deficiencies.
- **Text size:** All HUD text is a minimum 16px logical (scales with canvas).
- **Key remapping:** Not implemented in v1.0. Architecture accommodates future addition via `INPUT_MAP` centralisation (§6).
- **Subtitles / audio descriptions:** Not applicable (audio is out of scope).

---

## 14. Analytics and Telemetry

Not in scope for v1.0.

---

## 15. Third-Party Dependencies

| Library | Version | Purpose | Licence |
|---------|---------|---------|---------|
| Phaser | 3.80+ | Game framework (rendering, input, scene management, audio stub) | MIT |
| TypeScript | 5.x | Language | Apache 2.0 |
| Vite | 5.x | Bundler and dev server | MIT |
| Vitest | 1.x | Unit test runner | MIT |
| ESLint | 8.x | Static analysis | MIT |
| `@typescript-eslint/parser` | 7.x | TypeScript ESLint integration | MIT |
| Prettier | 3.x | Code formatting | MIT |

No proprietary SDKs. No runtime telemetry or analytics services. No authentication or payment SDKs.

**IP Risk (OQ-001):** The Tetris Company has historically enforced trademark and trade dress rights over Tetris implementations. The piece shapes (tetromino set) defined in `src/data/pieces.ts` are the primary risk surface. Legal review of piece designs and game name is required before any public release. The piece definitions are isolated in a single data file to facilitate substitution if legal review requires changes.

---

## 16. Performance Budgets

| Metric | Target | Platform |
|--------|--------|----------|
| Frame time | ≤16.67 ms (60 fps) | Desktop browser |
| JavaScript heap | ≤50 MB | Desktop browser |
| Initial load time | ≤3 s on 10 Mbps connection | Static host |
| Bundle size (gzipped) | ≤500 KB | — |

Phaser 3's tree-shakeable build (importing only used modules) keeps the bundle within budget. The game creates no per-frame heap allocations in the hot path (no object literals in `update()`); positions and velocities are mutated in place on the `GameSession` object.

---

## 17. Technical Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| R-01 | Tetris IP/trademark claim prevents public release | Medium | High | Isolate piece definitions in `src/data/pieces.ts`; obtain legal review before publishing; game name "Breaktris" should also be reviewed |
| R-02 | Keyboard ghosting prevents simultaneous WASD + Arrow key input on some hardware | Low | Medium | Test on at least 3 keyboard models; document as a known limitation; key layout (WASD + arrows) is within 6KRO of most modern keyboards |
| R-03 | Ball physics feel is unsatisfying (ball too fast/slow, angle response poor) | Medium | High | Prototype ball speed and paddle angle response in week 1; validate with playtesting before committing to full implementation |
| R-04 | Grid/pixel coordinate conversion introduces off-by-one collision errors | Medium | Medium | Unit-test coordinate conversion functions; define canonical conversion in one place (`src/utils/coords.ts`) |
| R-05 | Stack collapse after row destruction causes visual jank (rows teleport rather than animate) | Low | Low | If this reads as a defect in playtesting, add a brief collapse animation (interpolate row positions over ~100 ms); not required for MVP |
| R-06 | Safari WebGL compatibility issues | Low | Low | Phaser's Canvas 2D fallback handles Safari edge cases; test on Safari 15 during integration |
| R-07 | OQ-005 (zone split) change late in development requires layout rework | Low | Medium | All grid dimension constants are in `src/config.ts`; changing `TETRIS_ROWS` and `BREAKOUT_ROWS` should not require changes outside config and possibly HUD positioning |

---

## 18. Out of Scope

The following are explicitly not covered by this specification:

- Online or network multiplayer of any kind
- Single-player mode
- Mobile or touch input
- High score persistence or leaderboards
- User accounts or profiles
- Difficulty settings or selectable game modes
- Sound effects or music (v1.0)
- Ghost/shadow piece (Should Have; deferred from MVP)
- Hard drop (not specified in requirements)
- Hold piece mechanic (not specified in requirements)
- Platform certification (no platform; browser-only)
- Accessibility beyond minimum requirements in §13
- Localisation beyond English
- Analytics or telemetry
- Score sharing (OQ-007; not in scope until stakeholder decision)
