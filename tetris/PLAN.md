# Breaktris — Implementation Plan

Version: 1.0
Status: Draft
Author: Technical Architect
Date: 2026-04-25

---

## 1. Overview

The build follows a **vertical slice first** approach: get a playable loop (pieces fall, ball bounces, one mechanic interacts with the other) as early as possible, then harden each system in place. This de-risks the core cooperative mechanic — which is the game's primary novelty — before investing in polish.

**Overarching principles:**

- All game constants live in `src/config.ts`. Nothing is hardcoded outside that file.
- All cross-system communication goes through the EventBus. Systems do not import each other.
- Unit tests cover pure logic (grid operations, coordinate conversion, scoring, speed ratchet). Phaser-coupled rendering is not unit-tested.
- Every phase ends with a playable build. There are no dark phases.

---

## 2. Team Structure (Assumed)

This plan is written for **one to two developers** working full-time, sharing a single codebase on a single branch strategy. If the team is larger, phases 3 and 4 can be parallelised between a Tetris developer and a Breakout developer (see §5).

Adjust phase durations proportionally for part-time contributors.

---

## 3. Milestones

| Milestone | Goal | Acceptance Criteria |
|-----------|------|---------------------|
| M1 — Vertical Slice | Core cooperative loop is playable end-to-end | Pieces fall; ball bounces; a completed row becomes a destructible brick; destroying it collapses the stack; game over triggers on overflow |
| M2 — Full Mechanics | All Must Have requirements implemented and verified | All FR-001 through FR-042 pass manual test; scoring, speed ratchet, and respawn all function correctly |
| M3 — Playable Release | Game is fun, stable, and deployable | Playtested by ≥ 4 people; no P1 bugs; bundle deploys cleanly to static host; IP risk reviewed |

---

## 4. Phase Breakdown

### Phase 1 — Project Scaffolding
**Goal:** Working dev environment; empty Phaser scene renders in browser.
**Duration:** 1–2 days

**Deliverables:**
- Repository with Vite + TypeScript + Phaser 3 configured
- `src/config.ts` with all constants (grid dimensions, speeds, scoring, input map)
- `src/strings.ts` with all UI string constants
- Empty `BootScene`, `MenuScene`, `GameScene`, `GameOverScene` (stubs)
- Vitest configured and running with one passing smoke test
- ESLint and Prettier configured; pre-commit hook runs lint and format check
- `README.md` with local dev setup instructions (`npm install`, `npm run dev`, `npm test`)
- CI pipeline (GitHub Actions) runs: lint → type-check → test → build on every push

**Tasks:**
- `npm create vite@latest breaktris -- --template vanilla-ts`; install Phaser 3
- Configure `vite.config.ts` for Phaser (no tree-shaking issues with dynamic imports)
- Add `tsconfig.json` with `strict: true`
- Write `src/config.ts` with all constants from SPEC §4 and §11 (use placeholder values; note OQ-004, OQ-005, OQ-008 in comments)
- Write `src/strings.ts` with `TITLE`, `PRESS_SPACE_TO_START`, `GAME_OVER`, `SCORE_LABEL`, `RESTART_PROMPT`
- Implement `BootScene` → immediately transitions to `MenuScene`
- Implement `MenuScene` stub (black screen, "BREAKTRIS" title text, "Press Space to Start")
- Implement `GameScene` stub (black screen, no systems)
- Implement `GameOverScene` stub
- Wire scene transitions with `Space` key
- Write `src/events/EventBus.ts` (typed event emitter wrapping Phaser EventEmitter)
- Configure Vitest; write one test: `1 + 1 === 2` placeholder to confirm runner works
- Configure ESLint (`@typescript-eslint/recommended`)
- Add `.github/workflows/ci.yml`: `npm ci → npm run lint → npm run typecheck → npm test → npm run build`

---

### Phase 2 — Tetris Core (Grid + Pieces, No Rendering)
**Goal:** Tetris grid logic is fully correct and unit-tested. Nothing renders yet.
**Duration:** 3–4 days

**Deliverables:**
- `src/systems/TetrisSystem.ts` with all grid operations implemented
- `src/data/pieces.ts` with all 7 tetromino definitions and SRS kick tables
- `src/utils/grid.ts` with grid helper functions
- `src/utils/coords.ts` with pixel↔grid coordinate conversion
- Unit test suite covering all grid operations (≥ 90% branch coverage on pure logic)

**Tasks:**
- Write `src/data/pieces.ts`: define all 7 pieces as `PieceDefinition[]` with rotation arrays and colours
- Write `src/data/wallKicks.ts`: SRS wall kick tables for J/L/S/T/Z and I pieces
- Write `src/utils/grid.ts`:
  - `createGrid(rows, cols): Grid` — returns grid of EMPTY cells
  - `isRowComplete(grid, row): boolean`
  - `markRowCompleted(grid, row): void`
  - `collapseRow(grid, row): void` — removes row, inserts EMPTY row at top
  - `canPlace(grid, piece, rotation, row, col): boolean`
  - `lockPiece(grid, piece): void`
- Write `src/utils/coords.ts`:
  - `gridToPixel(gridRow, gridCol): { x, y }` — returns top-left pixel of cell
  - `pixelToGrid(x, y): { row, col }` — returns grid cell containing pixel
- Write `src/systems/TetrisSystem.ts`:
  - Constructor takes `GameSession` and `EventBus`
  - `spawnPiece()`: draw from bag, create `ActivePiece`, check for overflow → emit `STACK_OVERFLOW`
  - `update(delta)`: advance fall timer; lock if blocked
  - `moveLeft()`, `moveRight()`, `rotate()`, `softDrop()`: input handlers (called by InputSystem)
  - `onRowDestroyed(rowIndex)`: event handler; calls `collapseRow`
- Write unit tests in `src/systems/TetrisSystem.test.ts` and `src/utils/grid.test.ts`:
  - Row completion detection (complete, nearly complete, empty)
  - Row marking
  - Stack collapse (row removed; rows above shift down; EMPTY row inserted at top)
  - Piece placement and obstruction detection
  - Piece locking (cells written to grid with correct state)
  - 7-bag shuffle (no piece repeats within a bag; bag refills)
  - SRS wall kick: rotation accepted with offset when blocked straight
  - Stack overflow detection (piece spawns into occupied cells)
  - Coordinate conversion round-trips

---

### Phase 3 — Breakout Core (Ball + Paddle, No Grid Interaction)
**Goal:** Ball bounces correctly off walls, ceiling, and paddle. Paddle moves responsively.
**Duration:** 2–3 days

**Deliverables:**
- `src/systems/BreakoutSystem.ts` with ball physics and paddle logic
- `src/utils/collision.ts` with ball-vs-AABB collision resolution
- Unit tests for collision resolution

**Tasks:**
- Write `src/utils/collision.ts`:
  - `resolveCircleAABB(ball, aabb): { normal, penetration }` — returns collision normal and penetration depth; ball is represented as `{ x, y, radius }`
  - `reflectVelocity(velocity, normal): velocity` — reflects velocity vector about normal
  - Unit test: ball hitting left face, right face, top face, bottom face of AABB; corner cases
- Write `src/systems/BreakoutSystem.ts`:
  - `update(delta)`: move ball, test wall collisions (left wall, right wall, zone boundary ceiling), test paddle collision, detect ball drop
  - `movePaddleLeft(delta)`, `movePaddleRight(delta)`: called by InputSystem
  - `respawnBall()`: position at paddle centre, set velocity at 315°
  - Emit `BALL_DROPPED` on drop; call `respawnBall()` immediately
  - Wall collision: reflect and clamp (no penetration)
  - Paddle collision: reflect `velocityY`; set `velocityX` proportional to hit offset (see SPEC §5); normalise to `BALL_SPEED`
- Write unit tests: ball respawn position; paddle angle response at centre, left edge, right edge; ball drop detection trigger; wall reflection; zone boundary reflection

---

### Phase 4 — Rendering (Pit, Grid, Piece, Ball, Paddle)
**Goal:** The game is visible. The Tetris grid, active piece, ball, and paddle render correctly.
**Duration:** 2–3 days

**Deliverables:**
- `src/rendering/PitRenderer.ts` — draws pit border and zone divider
- `src/rendering/GridRenderer.ts` — draws grid cells (EMPTY, OCCUPIED, COMPLETED)
- `src/rendering/PieceRenderer.ts` — draws active piece and next piece preview
- `src/rendering/BreakoutRenderer.ts` — draws ball and paddle
- `src/rendering/HUDRenderer.ts` — draws score and speed indicator
- All renderers integrated into `GameScene.update()`

**Tasks:**
- Implement `PitRenderer`: draw pit border rect; draw zone divider line at `PIT_Y + TETRIS_ROWS * CELL_SIZE`
- Implement `GridRenderer`: iterate `session.grid`; draw `OCCUPIED` cells as filled rects with piece colour; draw `COMPLETED` cells as filled rects with a bright outline (accessibility — see SPEC §13)
- Implement `PieceRenderer`: draw active piece cells using `ActivePiece` + `PIECE_DEFINITIONS`; draw next piece preview in right panel at fixed position
- Implement `BreakoutRenderer`: draw ball as filled circle; draw paddle as rounded rectangle
- Implement `HUDRenderer`: Phaser Text objects for score (`SCORE: 0`) and speed level (`SPEED: 1×`); subscribe to `SCORE_CHANGED` and `SPEED_CHANGED` events to update text
- Integrate all renderers in `GameScene.create()` and `GameScene.update()`
- Manual test: pieces fall and render correctly; ball and paddle visible; grid cells colour correctly; zone divider visible

---

### Phase 5 — System Integration (Cross-System Events)
**Goal:** The cooperative mechanic works end-to-end. Completing a row makes it destructible. The ball destroys it. Stack collapses. Speed ratchet fires on ball drop.
**Duration:** 3–4 days

**Deliverables:**
- `src/systems/ScoringSystem.ts`
- `src/systems/SpeedRatchetSystem.ts`
- Full event bus wiring in `GameScene`
- `ROW_COMPLETED → COMPLETED cell state` flow working
- `ROW_DESTROYED → stack collapse` flow working
- `BALL_DROPPED → speed increase` flow working
- `STACK_OVERFLOW → game over` flow working
- End-to-end playable session (no polish)

**Tasks:**
- Write `ScoringSystem`: subscribe to `ROW_COMPLETED` (+`POINTS_ROW_COMPLETED`), `ROW_DESTROYED` (+`POINTS_ROW_DESTROYED`); emit `SCORE_CHANGED`
- Write `SpeedRatchetSystem`: subscribe to `BALL_DROPPED`; apply ratchet formula (SPEC §11.6); emit `SPEED_CHANGED`
- Wire all event subscriptions in `GameScene.create()` after all systems constructed
- Test `ROW_COMPLETED` flow: manually fill a row → check cell states change to COMPLETED → check score increases → check `ROW_COMPLETED` event fired
- Test `ROW_DESTROYED` flow: place ball to hit a COMPLETED row → check row removed → check stack collapses → check score increases
- Test `BALL_DROPPED` flow: let ball pass paddle → check `BALL_DROPPED` fires → check `fallSpeedMultiplier` increases → check ball respawns
- Test `STACK_OVERFLOW` flow: fill grid to top → check `STACK_OVERFLOW` fires → check `GameOverScene` launches
- Manual end-to-end playtest: two-player cooperative session from start to game over

---

### Phase 6 — Input System and DAS/ARR
**Goal:** Input is responsive for both players simultaneously. DAS/ARR is implemented for lateral Tetris movement.
**Duration:** 1–2 days

**Deliverables:**
- `src/systems/InputSystem.ts` fully implemented
- DAS/ARR for piece left/right movement
- Edge-triggered rotation
- Simultaneous WASD + Arrow keys confirmed working

**Tasks:**
- Write `InputSystem.ts`:
  - Use `Phaser.Input.Keyboard.addKeys()` to register all keys from `INPUT_MAP`
  - `update(delta)`: read all key states each frame
  - Rotation (`W`): use `Phaser.Input.Keyboard.JustDown()`; call `tetrisSystem.rotate()` once per press
  - Left/right (`A`/`D`): implement DAS/ARR accumulator; call `tetrisSystem.moveLeft()` / `moveRight()` at correct intervals
  - Soft drop (`S`): pass `isSoftDrop = S.isDown` to `tetrisSystem.update()` (or set a flag; TetrisSystem reads it each frame)
  - Paddle left/right (arrows): call `breakoutSystem.movePaddleLeft(delta)` / `movePaddleRight(delta)` each frame when held
- Test on a physical keyboard: press `A + ArrowLeft` simultaneously; confirm both respond; press `W + A + S + D + ArrowLeft + ArrowRight`; confirm no dropped inputs

---

### Phase 7 — Menu, Game Over, and Restart
**Goal:** Full game flow from title screen through game over to restart works without browser refresh.
**Duration:** 1–2 days

**Deliverables:**
- `MenuScene` complete (title, controls summary, start prompt)
- `GameOverScene` complete (final score, restart prompt)
- Restart resets all `GameSession` state correctly
- No state leakage between sessions

**Tasks:**
- Complete `MenuScene`: render title text, control legend (Tetris: WASD, Breakout: Arrow Keys), "Press SPACE to Start"
- Complete `GameOverScene`: receive `score` from scene data; render "GAME OVER", final score, "Press SPACE or R to Restart"
- Implement restart in `GameScene`: on `GAME_OVER → PLAYING` transition, reset `GameSession` to initial state; stop `GameOverScene`; rebuild all systems (or reset them via a `reset()` method)
- Verify restart: play one full session to game over; restart; play another session; confirm no score/state carries over
- Verify no event bus leakage: check that event subscriptions from the previous session are not duplicated after restart (clear event bus on session reset)

---

### Phase 8 — Hardening, Playtesting, and Deployment
**Goal:** Game is stable, balanced, and deployed.
**Duration:** 2–3 days

**Deliverables:**
- Playtesting feedback incorporated (speed ratchet tuning, ball speed, scoring values)
- OQ-004 and OQ-008 resolved (or confirmed as defaults)
- Static deployment live on chosen host
- P1 and P2 bugs resolved
- IP legal review initiated (OQ-001)

**Tasks:**
- Conduct ≥ 2 playtesting sessions with pairs of players; note: frustration points, game length at default settings, input conflicts observed
- Tune `BALL_SPEED`, `SPEED_RATCHET_INCREMENT`, `SPEED_RATCHET_MAX`, `POINTS_ROW_COMPLETED`, `POINTS_ROW_DESTROYED` based on playtest feedback; update constants in `src/config.ts`
- Run `npm run build`; verify bundle size ≤ 500 KB gzipped
- Deploy to static host (GitHub Pages: push `dist/` to `gh-pages` branch via GitHub Actions; or drag-and-drop to Netlify / itch.io)
- Confirm deployment loads in Chrome, Firefox, Safari, Edge
- Initiate OQ-001 legal review before any public announcement
- Document all remaining open questions (OQ-002, OQ-003, OQ-005, OQ-006, OQ-007) as GitHub issues for post-launch consideration

---

## 5. System Build Order

Systems must be built in the following dependency order. Systems on the same level can be built in parallel by separate developers.

```
Level 1 (no dependencies):
  config.ts
  strings.ts
  EventBus
  src/utils/grid.ts
  src/utils/coords.ts
  src/utils/collision.ts

Level 2 (depends on Level 1):
  src/data/pieces.ts          (depends on config)
  src/data/wallKicks.ts       (depends on pieces)
  TetrisSystem                (depends on grid utils, pieces, wallKicks, EventBus)
  BreakoutSystem              (depends on collision utils, coords, EventBus)

Level 3 (depends on Level 2):
  ScoringSystem               (depends on EventBus)
  SpeedRatchetSystem          (depends on EventBus)
  InputSystem                 (depends on TetrisSystem, BreakoutSystem)
  All Renderers               (depends on TetrisSystem, BreakoutSystem, config)

Level 4 (depends on Level 3):
  GameScene (integration)     (depends on all systems)
  MenuScene
  GameOverScene
```

**Parallel work opportunity (two-developer team):** After Phase 1, one developer takes Phase 2 (Tetris core + unit tests) while the other takes Phase 3 (Breakout core + unit tests). They merge before Phase 4.

---

## 6. Prototyping and Validation Gates

All gates must pass before the team proceeds to full implementation of the affected system.

| Gate | What to validate | Acceptance criterion |
|------|-----------------|----------------------|
| G-01 — Ball physics feel | Ball speed, angle response, and bounce behaviour | Two developers play the Breakout subsystem alone for 5 minutes; no complaints about ball being unpredictable or uncontrollable |
| G-02 — Speed ratchet balance | Does the ratchet create escalating pressure without being instantly fatal? | A pair of testers can survive ≥ 5 ball drops before finding the game overwhelming |
| G-03 — Cooperative mechanic clarity | Is it obvious to new players what they need to do? | Two players with no briefing understand their roles within 60 seconds of starting |
| G-04 — Keyboard simultaneity | WASD and Arrow keys respond simultaneously | Both players can act at the same time on the test hardware without input dropping |

G-01 and G-04 must pass at the end of Phase 5. G-02 and G-03 are validated during Phase 8 playtesting.

---

## 7. Testing Strategy

### Unit Tests
- **Owner:** Developer writing the system under test
- **Runner:** Vitest
- **Coverage target:** ≥ 90% branch coverage on all pure logic in `src/utils/` and `src/systems/` (excluding Phaser-coupled code)
- **What is covered:**
  - All functions in `src/utils/grid.ts`
  - All functions in `src/utils/coords.ts`
  - All functions in `src/utils/collision.ts`
  - `TetrisSystem` state transitions (no Phaser dependency; mock EventBus)
  - `BreakoutSystem` physics (no Phaser dependency)
  - `ScoringSystem` event handling
  - `SpeedRatchetSystem` ratchet formula
- **What is not unit-tested:** Phaser scene lifecycle, rendering output, keyboard input (covered by manual test)

### Integration Tests
- No automated integration tests for v1.0. Cross-system event flows are validated by manual end-to-end play at the end of Phase 5.

### Gameplay Regression
- At the end of Phase 7, document a set of manual regression steps:
  1. Start game → Tetris piece spawns → ball launches
  2. Fill a row → row becomes COMPLETED (visual change)
  3. Ball hits COMPLETED row → row destroyed → stack collapses → score increases
  4. Let ball drop → ball respawns → speed indicator increases
  5. Stack to top → game over screen shows final score
  6. Restart → fresh session with zeroed score and reset speed
- Run this checklist before every deployment.

### Platform Testing
- Test on Chrome, Firefox, Safari, Edge before M3.
- Test on at least two different physical keyboard models for simultaneity.
- No platform certification required (browser-only distribution).

---

## 8. Asset and Content Integration

**MVP:** No external assets. All visuals use Phaser Graphics API. No asset pipeline step required.

**If sprites or audio are added (post-MVP):**
- Sprites committed to `src/assets/images/` as PNG files; imported in `BootScene` via Phaser's `this.load.image()`
- Audio committed to `src/assets/audio/` as both MP3 and OGG; loaded via `this.load.audio()` with array of paths for cross-browser support
- Vite handles static asset copying to `dist/` on build
- Placeholder assets (coloured rectangles, silent audio) are used from Phase 4 onward; final assets drop in without code changes

---

## 9. Build and CI/CD

### Branch Strategy
- Single `main` branch for active development (one to two developers)
- Feature branches for anything taking more than one day; merged via pull request with at least one review
- No long-lived branches; integration is continuous

### Build
```
npm run dev      # Vite dev server with HMR (development)
npm run build    # Vite production build → dist/
npm run preview  # Serve dist/ locally to verify build
npm test         # Vitest unit tests
npm run lint     # ESLint
npm run typecheck  # tsc --noEmit
```

### CI (GitHub Actions — `.github/workflows/ci.yml`)
Triggers: push to `main`, pull request to `main`

Steps (in order):
1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`

Artefact: `dist/` directory uploaded as a CI artefact on every successful build of `main`.

### CD (GitHub Pages)
- Separate workflow (`.github/workflows/deploy.yml`) triggers on push to `main` after CI passes
- Deploys `dist/` to `gh-pages` branch via `peaceiris/actions-gh-pages` action
- Live URL confirmed in repository settings

---

## 10. Known Risks and Contingency

| Risk | Contingency |
|------|-------------|
| R-01 — Tetris IP claim | Before any public link is shared, initiate legal review. If legal review requires piece shape changes, modify `src/data/pieces.ts` only. If game name is a risk, rename — the name appears only in `src/strings.ts` and `index.html`. |
| R-02 — Keyboard ghosting | If 6-key simultaneous input fails on test hardware, change Tetris Player keys from WASD to IJKL or another non-conflicting set. Update `INPUT_MAP` in `src/config.ts` only. |
| R-03 — Ball physics feel | If playtest G-01 fails, increase `BALL_SPEED` in 10% increments and re-test. If angle control is frustrating, widen the paddle or increase the sensitivity of the angle mapping. All constants are in `src/config.ts`. |
| R-04 — Coordinate conversion bugs | If collision bugs appear, add `console.assert` guards on coordinate conversion at the call sites during debugging; remove before release. |
| R-05 — Stack collapse visual jank | If playtesting identifies this as a problem, add a `CollapseAnimationSystem` that interpolates row positions over 100 ms before applying grid state. This is additive; it does not require changes to `TetrisSystem`. |
| R-06 — Safari WebGL issues | If WebGL rendering fails on Safari, force Canvas 2D renderer via Phaser config (`type: Phaser.CANVAS`). Performance is acceptable for this game's complexity. |
| R-07 — Late zone split change | Change `TETRIS_ROWS` and `BREAKOUT_ROWS` in `src/config.ts`. The zone divider rendering and ball ceiling are derived from `TETRIS_ROWS`. Verify via manual test after change. |

---

## 11. Definition of Done

The project is shippable when all of the following are true:

**Functionality**
- [ ] All FR-001 through FR-041 pass manual verification
- [ ] FR-042 (restart without refresh) passes manual verification
- [ ] Game starts, plays, reaches game over, and restarts correctly in a single browser session
- [ ] Score increments correctly on row completion and row destruction
- [ ] Speed ratchet increases on each ball drop; speed does not decrease
- [ ] Stack collapses correctly when a completed row is destroyed
- [ ] Ball respawns correctly after each drop

**Performance**
- [ ] Game runs at 60 fps on a mid-range 2023 laptop in Chrome, Firefox, Safari, Edge
- [ ] JavaScript heap remains below 50 MB during a 10-minute session
- [ ] Production bundle (gzipped) is ≤ 500 KB

**Quality**
- [ ] All unit tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Manual regression checklist (§7) passes in all four browsers

**Deployment**
- [ ] `npm run build` produces a clean `dist/` with no errors
- [ ] Deployed build loads and plays correctly on the target static host
- [ ] No runtime network requests after initial load

**Legal**
- [ ] OQ-001 legal review initiated; team has received written guidance before any public URL is shared

**Open Questions**
- [ ] OQ-004 (point values) resolved and constants updated in `src/config.ts`
- [ ] OQ-008 (speed ratchet increment) resolved and constant updated in `src/config.ts`
- [ ] Remaining open questions (OQ-002, OQ-003, OQ-005, OQ-006, OQ-007) logged as GitHub issues with owner assigned
