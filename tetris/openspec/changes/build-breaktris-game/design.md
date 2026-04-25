## Context

Breaktris is built from scratch as a static browser game. There is no existing codebase to migrate. The primary design challenge is that two independent game subsystems (Tetris and Breakout) must interact via a single shared event, each operating at different logical abstractions (grid cells vs. pixel physics). The tech stack is Phaser 3 + TypeScript + Vite.

## Goals / Non-Goals

**Goals:**
- Deliver a playable two-player cooperative game in a single static HTML + JS bundle
- Keep both subsystems decoupled; cross-system communication via event bus only
- All game constants in one file (`src/config.ts`) so tuning requires no code search
- Unit-testable pure logic (grid ops, collision math, scoring) at ≥ 90% branch coverage
- 60 fps on a mid-range 2023 desktop browser; bundle ≤ 500 KB gzipped

**Non-Goals:**
- Online/network multiplayer
- Mobile or touch support
- Audio (v1.0 — stub only)
- High-score persistence
- Single-player mode

## Decisions

### D-01: Phaser 3 as game framework (not raw Canvas or PixiJS)
Phaser provides a requestAnimationFrame game loop, WebGL + Canvas 2D fallback, a scene system, keyboard input, and built-in geometry primitives. Raw Canvas requires hand-rolling every subsystem. PixiJS is rendering-only. Three.js is 3D-first.

### D-02: Plain OOP with a central EventBus (not ECS)
The game has exactly two interacting subsystems with well-defined interfaces and a small entity count. ECS overhead is unwarranted. The event bus is the sole channel for cross-system communication — systems never hold direct references to each other.

**Events:**
| Event | Publisher | Subscriber(s) |
|-------|-----------|---------------|
| `ROW_COMPLETED` | TetrisSystem | ScoringSystem |
| `ROW_DESTROYED` | BreakoutSystem | TetrisSystem, ScoringSystem |
| `BALL_DROPPED` | BreakoutSystem | SpeedRatchetSystem |
| `PIECE_LOCKED` | TetrisSystem | HUD |
| `STACK_OVERFLOW` | TetrisSystem | GameScene |
| `SCORE_CHANGED` | ScoringSystem | HUD |
| `SPEED_CHANGED` | SpeedRatchetSystem | TetrisSystem, HUD |

### D-03: Single unified pit grid (not separate Tetris/Breakout grids)
`Grid = Cell[][]` covering all 26 rows. Tetris zone is rows 0–17; Breakout zone is rows 18–25. This is the default split — both constants live in `src/config.ts` as `TETRIS_ROWS` and `BREAKOUT_ROWS`. The zone divider is a derived value, not a hard boundary in data.

### D-04: Custom discrete-step collision (not Phaser Arcade Physics)
Phaser Arcade Physics is AABB-only and not suited to grid-cell collision. The Breakout ball uses custom per-frame AABB overlap testing against occupied grid cells. Tunnelling is not a risk: at `BALL_SPEED = 300 px/s` and 16.67 ms frame time, max displacement is ~5 px vs. 30 px cell size.

### D-05: 7-bag piece randomisation
Prevents long piece droughts. `pieceBag` is a shuffled array of all 7 piece types; refilled when exhausted.

### D-06: SRS wall kicks for rotation
Standard Rotation System with separate I-piece kick table. Defined as pure data in `src/data/wallKicks.ts`; no logic changes if tables are updated.

### D-07: Logical canvas at 560 × 860 px, scaled via Phaser FIT mode
Game renders at fixed logical resolution; Phaser scales to fill the viewport letterboxed. No responsive layout complexity.

### D-08: TypeScript `strict: true`
Two interacting stateful systems with grid coords vs. pixel coords mix. Strict typing prevents category errors that are common in this class of game.

## Risks / Trade-offs

- **R-01 Tetris IP** → Isolate piece shapes in `src/data/pieces.ts`; obtain legal review before any public URL is shared. Game name "Breaktris" also requires review.
- **R-02 Keyboard ghosting** → WASD + Arrow key layout is within 6KRO of most modern keyboards. Document as known limitation; test on ≥ 3 keyboard models.
- **R-03 Ball physics feel** → Prototype ball speed and paddle angle response in Phase 1 vertical slice; tune `BALL_SPEED` and angle sensitivity before full implementation.
- **R-04 Off-by-one collision** → Define canonical grid↔pixel conversion in `src/utils/coords.ts` only; unit-test round-trips.
- **R-05 Stack collapse visual jank** → If rows teleport visually, a `CollapseAnimationSystem` interpolating over ~100 ms can be added additively without touching `TetrisSystem`.
- **R-06 Safari WebGL** → Phaser Canvas 2D fallback handles Safari edge cases; force `type: Phaser.CANVAS` if WebGL fails.
- **R-07 Late zone split change** → `TETRIS_ROWS` / `BREAKOUT_ROWS` in `src/config.ts` are the only change points; zone divider rendering and ball ceiling are derived from them.

## Migration Plan

No existing code to migrate. Deployment is:
1. `npm run build` → `dist/`
2. Push `dist/` to `gh-pages` branch via GitHub Actions `deploy.yml`
3. Confirm live URL in repository settings

Rollback: revert `gh-pages` branch to previous commit.

## Open Questions

- **OQ-001** Legal review of piece shapes and "Breaktris" name — required before any public announcement
- **OQ-002** Accessibility: key remapping not implemented in v1.0; `INPUT_MAP` constant enables future addition
- **OQ-003** Audio: `IAudioSystem` stub compiled in; Phaser Web Audio API is the designated implementation path
- **OQ-004** Point values for `ROW_COMPLETED` and `ROW_DESTROYED` — placeholder values (100/200) pending stakeholder decision
- **OQ-005** Zone split ratio (18 Tetris / 8 Breakout rows) — configurable via `TETRIS_ROWS` / `BREAKOUT_ROWS` in `src/config.ts`
- **OQ-006** Ghost/shadow piece — Should Have, deferred from MVP
- **OQ-007** Score sharing — out of scope until stakeholder decision
- **OQ-008** Speed ratchet increment (default 15% per drop, max 4×) — pending playtesting validation
