# Requirements Document
## Breaktris

**Version:** 1.0
**Date:** 2026-04-25
**Prepared by:** Requirements Analyst
**Status:** Draft

---

### 1. Executive Summary

Breaktris is a local two-player cooperative web browser game combining Tetris and Breakout mechanics within a single shared play area. One player controls falling Tetris pieces in the upper half of the pit; the other controls a ball-and-paddle in the lower half. Players must work together to achieve the highest possible score before the Tetris stack reaches the top of the pit. The game is designed for casual players sharing a single keyboard.

---

### 2. Stakeholders & User Roles

| Role | Description | Key Concerns |
|------|-------------|--------------|
| Tetris Player | Controls falling pieces in the upper half of the pit | Completing rows cleanly; managing increasing piece speed |
| Breakout Player | Controls the paddle and ball in the lower half of the pit | Destroying completed rows; avoiding dropping the ball |
| Casual Player (general) | Either of the above; likely playing with a friend in the same physical location | Easy to pick up, fun, fair input sharing on one keyboard |

---

### 3. Goals & Success Criteria

- **Goal:** Deliver a playable, fun cooperative experience for two players at one keyboard.
  - **Success criterion:** Both input schemes are simultaneously responsive with no perceptible conflict or lag.
- **Goal:** Make the cooperative mechanic feel meaningful.
  - **Success criterion:** Neither player can achieve a high score without the other performing well.
- **Goal:** Provide a clear, escalating challenge.
  - **Success criterion:** Game difficulty increases monotonically; every dropped ball produces a noticeable speed increase in Tetris piece fall rate.

---

### 4. Scope

#### 4.1 In Scope
- Single shared play area (the pit) split into an upper Tetris zone and a lower Breakout zone
- Tetris mechanics: falling pieces, rotation, line completion, downward collapse on line destruction
- Breakout mechanics: ball, paddle, bouncing, brick destruction
- Cooperative scoring: points awarded for completing a row and again for destroying it
- Ball-drop penalty: Tetris piece fall speed increases each time the ball is dropped
- Single shared score displayed during play
- Game-over state when Tetris pieces reach the top of the pit
- New ball launches automatically when the previous ball is dropped
- Playable in a web browser, single keyboard

#### 4.2 Out of Scope
- Online/network multiplayer
- Single-player mode
- High score persistence or leaderboards (unless added later)
- User accounts or profiles
- Mobile/touch input
- Sound and music (not discussed — see Open Questions)
- Difficulty settings or game modes

#### 4.3 Assumptions
- Both players are physically present at the same device
- The keyboard has sufficient key separation to allow both players to operate simultaneously without conflict
- The game is self-contained in the browser — no download or installation required
- The game targets modern desktop browsers

#### 4.4 Dependencies & Constraints
- Must run in a web browser without plugins

---

### 5. Functional Requirements

#### 5.1 Play Area

| ID | Priority | Requirement | Notes |
|----|----------|-------------|-------|
| FR-001 | Must Have | The play area is a single vertical pit divided into an upper Tetris zone and a lower Breakout zone | Exact proportional split to be determined by design |
| FR-002 | Must Have | The boundary between the two zones is visible to both players | Acts as the "floor" for Tetris and the "ceiling" for Breakout |

#### 5.2 Tetris Mechanics

| ID | Priority | Requirement | Notes |
|----|----------|-------------|-------|
| FR-010 | Must Have | Tetris pieces spawn at the top of the upper zone and fall downward | Standard Tetris piece set (I, O, T, S, Z, J, L) assumed — see Open Questions |
| FR-011 | Must Have | The Tetris player can move pieces left, right, and rotate them | Via keyboard input |
| FR-012 | Must Have | The Tetris player can soft-drop pieces | Accelerate fall speed manually |
| FR-013 | Must Have | When a row in the upper zone is fully filled, it is marked as a completed row and becomes a destructible brick in the Breakout zone | Completed rows transfer to the top of the Breakout zone |
| FR-014 | Must Have | Completing a row awards points | Points value TBD |
| FR-015 | Must Have | When a completed row is destroyed by the Breakout ball, the Tetris stack collapses downward as in standard Tetris | Remaining pieces above the destroyed row drop down one row |
| FR-016 | Must Have | The game ends when Tetris pieces stack to the top of the pit | Game-over condition |

#### 5.3 Breakout Mechanics

| ID | Priority | Requirement | Notes |
|----|----------|-------------|-------|
| FR-020 | Must Have | The Breakout player controls a horizontal paddle in the lower zone | Via keyboard input |
| FR-021 | Must Have | A ball bounces around the lower zone, rebounding off the side walls, the ceiling (zone boundary), and the paddle | Standard Breakout physics |
| FR-022 | Must Have | The ball bounces off incomplete rows without destroying them | Incomplete rows act as solid but indestructible obstacles |
| FR-023 | Must Have | The ball destroys a brick only if it is a completed Tetris row | Only completed rows are destructible |
| FR-024 | Must Have | Destroying a completed row awards points | Points value TBD |
| FR-025 | Must Have | When the ball drops below the paddle, a new ball is launched automatically | Infinite balls — no lives mechanic |
| FR-026 | Must Have | Each time the ball is dropped, the Tetris piece fall speed increases permanently | One-way ratchet; no mechanism to reduce speed |

#### 5.4 Scoring

| ID | Priority | Requirement | Notes |
|----|----------|-------------|-------|
| FR-030 | Must Have | There is a single shared score for both players | Cooperative, not competitive |
| FR-031 | Must Have | The score is displayed continuously during play | |
| FR-032 | Must Have | Points are awarded when the Tetris player completes a row | |
| FR-033 | Must Have | Points are awarded when the Breakout player destroys a completed row | |

#### 5.5 Game State

| ID | Priority | Requirement | Notes |
|----|----------|-------------|-------|
| FR-040 | Must Have | The game has a start state, an active play state, and a game-over state | |
| FR-041 | Must Have | On game over, the final score is displayed | |
| FR-042 | Should Have | Players can restart the game without refreshing the browser | |

---

### 6. Non-Functional Requirements

#### 6.1 Performance & Scale
- Input from both players must be processed simultaneously without one player's input blocking or delaying the other's.
- Game state must update smoothly; animation should not stutter during normal play.
- No server-side processing required; the game runs entirely client-side.

#### 6.2 Availability & Reliability
- The game must be self-contained and functional without a network connection once loaded.

#### 6.3 Security & Anti-Cheat
- Not applicable for this scope.

#### 6.4 Compliance & Legal
- Tetris piece shapes and mechanics are well-established; the Tetris Company has historically enforced IP rights. The design should be reviewed for IP risk before release. (See OQ-001.)

#### 6.5 Accessibility
- Not explicitly discussed. See OQ-002.

#### 6.6 Localisation & Internationalisation
- Not in scope for initial version.

#### 6.7 Observability & Analytics
- Not in scope for initial version.

---

### 7. User Journeys

#### Journey 1: A Round of Breaktris

**Actor:** Two players at one keyboard
**Precondition:** Game is loaded in a browser and at the start screen

1. Players press a key (or button) to start the game.
2. A Tetris piece spawns at the top of the upper zone. A ball launches in the lower zone.
3. The Tetris player moves and rotates pieces to fill rows.
4. The Breakout player moves the paddle to keep the ball in play.
5. The Tetris player completes a row — it is marked as a destructible brick and the shared score increases.
6. The Breakout ball strikes the completed row — it is destroyed, the stack collapses, and the shared score increases again.
7. The Breakout player fails to catch the ball — it drops. A new ball launches. Tetris piece fall speed increases.
8. Play continues with escalating Tetris speed until pieces stack to the top of the pit.
9. Game over is triggered. The final score is displayed.
10. Players choose to restart or close the browser.

**Postcondition:** Final score is shown; players can restart.
**Exceptions / Failure cases:** If pieces stack to the top before any row is completed, the score may be zero — the game should still reach a valid game-over state.

---

### 8. Data Requirements

| Entity | Key Attributes | Relationships | Retention / Compliance Notes |
|--------|---------------|---------------|-------------------------------|
| Game Session | Current score, Tetris piece fall speed, Tetris grid state, Breakout ball position/velocity, paddle position | All local in-session state | Not persisted beyond the browser session |
| Tetris Piece | Shape, orientation, position | Exists within game session | Transient |
| Breakout Ball | Position, velocity, active state | Exists within game session | Transient |
| Completed Row | Row index, destroyed flag | Part of Tetris grid state | Transient |

---

### 9. Stakeholder Preferences & Constraints

- The game must run in a web browser. (Stakeholder constraint.)
- Target audience is casual players. (Informs that the game should be immediately understandable with minimal or no tutorial.)

---

### 10. Open Questions

| ID | Question | Owner | Due |
|----|----------|-------|-----|
| OQ-001 | Does the use of Tetris piece shapes and mechanics create IP/trademark risk? Legal review recommended before public release. | Stakeholder / Legal | TBD |
| OQ-002 | Are there any accessibility requirements — e.g. colour blindness support, key remapping? | Stakeholder | TBD |
| OQ-003 | Should sound effects and/or music be included? | Stakeholder | TBD |
| OQ-004 | What are the specific point values for completing a row vs. destroying one? | Game Designer | TBD |
| OQ-005 | What is the exact proportional split between the Tetris zone and the Breakout zone? | Game Designer | TBD |
| OQ-006 | Should the standard 7-piece Tetris tetromino set be used, or a custom set? | Game Designer | TBD |
| OQ-007 | Should the final score be shareable (e.g. copy to clipboard, screenshot prompt)? | Stakeholder | TBD |
| OQ-008 | How much does Tetris speed increase per dropped ball — a fixed increment, a percentage, or a curve? | Game Designer | TBD |

---

### 11. Glossary

| Term | Definition |
|------|------------|
| Pit | The shared vertical play area containing both the Tetris zone and the Breakout zone |
| Tetris Zone | The upper portion of the pit where Tetris pieces fall and stack |
| Breakout Zone | The lower portion of the pit where the ball and paddle operate |
| Completed Row | A fully filled horizontal row in the Tetris zone; becomes a destructible brick in the Breakout zone |
| Destructible Brick | A completed Tetris row that the Breakout ball can destroy |
| Stack Collapse | The downward movement of Tetris pieces when a row below them is destroyed |
| Ball Drop | The event of the Breakout ball passing below the paddle |
| Speed Ratchet | The mechanic by which Tetris piece fall speed increases permanently on each ball drop |
