## 1. Project Scaffolding

- [ ] 1.1 Initialise Vite + TypeScript project: `npm create vite@latest breaktris -- --template vanilla-ts`; install Phaser 3
- [ ] 1.2 Configure `vite.config.ts` for Phaser (prevent tree-shaking issues with dynamic imports)
- [ ] 1.3 Add `tsconfig.json` with `strict: true`
- [ ] 1.4 Write `src/config.ts` with all constants (grid dimensions, speeds, scoring placeholders, `INPUT_MAP`)
- [ ] 1.5 Write `src/strings.ts` with UI string constants (`TITLE`, `PRESS_SPACE_TO_START`, `GAME_OVER`, `SCORE_LABEL`, `RESTART_PROMPT`)
- [ ] 1.6 Write `src/events/EventBus.ts` (typed event emitter wrapping Phaser EventEmitter)
- [ ] 1.7 Implement scene stubs: `BootScene`, `MenuScene`, `GameScene`, `GameOverScene` (black screens with wired `Space` key transitions)
- [ ] 1.8 Configure Vitest; write one passing smoke test to confirm runner works
- [ ] 1.9 Configure ESLint (`@typescript-eslint/recommended`) and Prettier
- [ ] 1.10 Add `.github/workflows/ci.yml`: `npm ci → lint → typecheck → test → build` on push/PR to main

## 2. Tetris Engine — Pure Logic

- [ ] 2.1 Write `src/data/pieces.ts`: all 7 tetromino `PieceDefinition` objects with rotation arrays and colours
- [ ] 2.2 Write `src/data/wallKicks.ts`: SRS wall-kick tables for J/L/S/T/Z and I pieces
- [ ] 2.3 Write `src/utils/grid.ts`: `createGrid`, `isRowComplete`, `markRowCompleted`, `collapseRow`, `canPlace`, `lockPiece`
- [ ] 2.4 Write `src/utils/coords.ts`: `gridToPixel` and `pixelToGrid` conversion functions
- [ ] 2.5 Write `src/systems/TetrisSystem.ts`: `spawnPiece`, `update(delta)`, `moveLeft`, `moveRight`, `rotate`, `softDrop`, `onRowDestroyed`
- [ ] 2.6 Write unit tests for `src/utils/grid.ts`: row completion, row marking, stack collapse, `canPlace`, `lockPiece`
- [ ] 2.7 Write unit tests for `src/systems/TetrisSystem.ts`: 7-bag shuffle, SRS wall kicks, spawn overflow detection
- [ ] 2.8 Write unit tests for `src/utils/coords.ts`: round-trip pixel↔grid conversion

## 3. Breakout Engine — Pure Logic

- [ ] 3.1 Write `src/utils/collision.ts`: `resolveCircleAABB(ball, aabb)` and `reflectVelocity(velocity, normal)`
- [ ] 3.2 Write unit tests for `src/utils/collision.ts`: left/right/top/bottom face hits and corner cases
- [ ] 3.3 Write `src/systems/BreakoutSystem.ts`: `update(delta)`, `movePaddleLeft(delta)`, `movePaddleRight(delta)`, `respawnBall()`
- [ ] 3.4 Write unit tests for `BreakoutSystem`: respawn position, paddle angle response at centre/edges, wall reflection, zone boundary reflection, ball drop detection

## 4. Rendering

- [ ] 4.1 Implement `src/rendering/PitRenderer.ts`: pit border and zone divider line
- [ ] 4.2 Implement `src/rendering/GridRenderer.ts`: `OCCUPIED` cells as coloured rects; `COMPLETED` cells with bright outline (accessibility)
- [ ] 4.3 Implement `src/rendering/PieceRenderer.ts`: active piece and next-piece preview panel
- [ ] 4.4 Implement `src/rendering/BreakoutRenderer.ts`: ball as filled circle; paddle as rounded rectangle
- [ ] 4.5 Implement `src/rendering/HUDRenderer.ts`: score and speed Phaser Text objects; subscribe to `SCORE_CHANGED` and `SPEED_CHANGED`
- [ ] 4.6 Integrate all renderers into `GameScene.create()` and `GameScene.update()`
- [ ] 4.7 Manual test: pieces fall and render; ball and paddle visible; zone divider present; cell colours correct

## 5. System Integration and Cross-System Events

- [ ] 5.1 Write `src/systems/ScoringSystem.ts`: subscribe to `ROW_COMPLETED` and `ROW_DESTROYED`; emit `SCORE_CHANGED`
- [ ] 5.2 Write unit tests for `ScoringSystem`: score increments on both events; `SCORE_CHANGED` emitted
- [ ] 5.3 Write `src/systems/SpeedRatchetSystem.ts`: subscribe to `BALL_DROPPED`; apply ratchet formula; emit `SPEED_CHANGED`
- [ ] 5.4 Write unit tests for `SpeedRatchetSystem`: multiplier increases per drop; capped at `SPEED_RATCHET_MAX`; never decreases
- [ ] 5.5 Wire all event subscriptions in `GameScene.create()` after all systems are constructed
- [ ] 5.6 Manual test `ROW_COMPLETED` flow: fill a row → cells become `COMPLETED` → score increases
- [ ] 5.7 Manual test `ROW_DESTROYED` flow: ball hits `COMPLETED` row → row removed → stack collapses → score increases
- [ ] 5.8 Manual test `BALL_DROPPED` flow: ball passes paddle → `BALL_DROPPED` → fall speed increases → ball respawns
- [ ] 5.9 Manual test `STACK_OVERFLOW` flow: fill grid to top → `STACK_OVERFLOW` → `GameOverScene` launches

## 6. Input System

- [ ] 6.1 Write `src/systems/InputSystem.ts`: register all keys from `INPUT_MAP`; poll each frame; route to systems
- [ ] 6.2 Implement DAS/ARR accumulator in `InputSystem` for left/right piece movement
- [ ] 6.3 Implement edge-triggered rotation using `Phaser.Input.Keyboard.JustDown`
- [ ] 6.4 Physical keyboard test: confirm `A + ArrowLeft` simultaneous; confirm `W + A + S + D + ArrowLeft + ArrowRight` produce no dropped inputs

## 7. Menu, Game Over, and Restart

- [ ] 7.1 Complete `MenuScene`: title text, control legend, "Press SPACE to Start"
- [ ] 7.2 Complete `GameOverScene`: receive `score` from scene data; render "GAME OVER", final score, "Press SPACE or R to Restart"
- [ ] 7.3 Implement restart in `GameScene`: reset `GameSession` to initial state; clear event bus subscriptions; stop `GameOverScene`; restart systems
- [ ] 7.4 Verify restart: play to game over → restart → confirm score is 0, speed is 1×, grid is empty
- [ ] 7.5 Verify no event bus leakage: confirm no duplicate event handlers after restart

## 8. Hardening, Tuning, and Deployment

- [ ] 8.1 Add `AudioSystem` stub (`IAudioSystem` interface + empty class) so audio calls compile
- [ ] 8.2 Conduct ≥ 2 playtesting sessions; note frustration points and game length
- [ ] 8.3 Tune `BALL_SPEED`, `SPEED_RATCHET_INCREMENT`, `SPEED_RATCHET_MAX`, `POINTS_ROW_COMPLETED`, `POINTS_ROW_DESTROYED` in `src/config.ts` based on playtest feedback
- [ ] 8.4 Run `npm run build`; verify gzipped bundle ≤ 500 KB
- [ ] 8.5 Run full manual regression checklist in Chrome, Firefox, Safari, and Edge
- [ ] 8.6 Deploy to static host (push `dist/` to `gh-pages` via GitHub Actions `deploy.yml`)
- [ ] 8.7 Confirm live deployment loads and plays correctly in all four browsers
- [ ] 8.8 Log OQ-002, OQ-003, OQ-005, OQ-006, OQ-007 as GitHub issues with owners assigned
- [ ] 8.9 Initiate OQ-001 legal review before sharing any public URL
