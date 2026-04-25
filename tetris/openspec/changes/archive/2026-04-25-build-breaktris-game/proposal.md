## Why

Breaktris is a new local two-player cooperative browser game that does not yet exist in code. The game combines Tetris and Breakout mechanics in a shared vertical pit: one player controls falling tetrominoes while the other controls a ball and paddle — completed rows become destructible bricks the ball must clear. This project needs to be built from scratch as a static web application.

## What Changes

- New TypeScript + Phaser 3 project scaffolded with Vite
- Tetris engine: falling pieces, SRS rotation, 7-bag randomisation, row completion detection, stack collapse
- Breakout engine: ball physics, paddle control, custom AABB collision detection
- Cooperative mechanic: completed Tetris rows become destructible bricks; ball destroying a row triggers stack collapse
- Scoring system: points awarded on row completion and row destruction
- Speed ratchet: each ball drop increases Tetris fall speed (one-way escalation)
- Full game flow: Menu → Playing → Game Over → Restart (no browser refresh required)
- HUD: live score, speed indicator, next piece preview
- Static deployment via GitHub Pages with CI pipeline (lint → typecheck → test → build)

## Capabilities

### New Capabilities

- `tetris-engine`: Grid management, piece spawning, falling, locking, SRS wall-kick rotation, row completion, stack collapse on row destruction, stack overflow detection
- `breakout-engine`: Ball physics (constant speed, angle-response paddle), paddle movement, wall/ceiling/cell collision, ball drop and respawn
- `cooperative-mechanic`: Cross-system event bus; completed rows become destructible cells; ball destruction triggers stack collapse; speed ratchet ties drop count to fall speed
- `game-session`: Central `GameSession` state object, `GamePhase` state machine (MENU / PLAYING / GAME_OVER), scoring, session reset on restart
- `rendering`: Phaser 3 Graphics API renderers for pit, grid cells, active piece, ball, paddle, HUD, and next-piece preview; no external sprite assets for MVP
- `input`: WASD (Tetris Player) + Arrow keys (Breakout Player), DAS/ARR for lateral movement, edge-triggered rotation, all bindings in `INPUT_MAP` constant
- `ui-scenes`: BootScene, MenuScene, GameScene, GameOverScene; overlay pattern for game-over; no state leakage between sessions

### Modified Capabilities

## Impact

- New repository / project root; no existing code is modified
- Runtime dependencies: Phaser 3 (MIT), TypeScript 5.x, Vite 5.x
- Dev dependencies: Vitest 1.x, ESLint + @typescript-eslint, Prettier 3.x
- Distribution: single bundled HTML + JS, static hosting (GitHub Pages / Netlify / itch.io)
- No server, no persistence, no network, no audio (v1.0)
- IP risk: Tetris Company trademark — piece definitions isolated in `src/data/pieces.ts`; legal review required before public release
