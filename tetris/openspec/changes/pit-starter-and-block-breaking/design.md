## Context

The breakout zone occupies rows 23–25 of the 26-row grid (rows 18–25 total). The ball operates only in this zone. `BreakoutSystem.resolveGridCells()` currently distinguishes two cell states: COMPLETED (destroy whole row) and OCCUPIED (reflect only). The bug arises because OCCUPIED cells block the ball permanently — they cannot be cleared, so any complete row above them is unreachable.

The grid's `CellState` enum has three values: EMPTY, OCCUPIED, COMPLETED. No new state is needed; breakability is a runtime computation, not a stored property.

## Goals / Non-Goals

**Goals:**
- Fix the permanent-block bug by making OCCUPIED cells below a complete row destroyable individually.
- Pre-fill the bottom 3 rows of the breakout zone at game start with real tetromino shapes.
- Award points for individual cell destruction.

**Non-Goals:**
- Dynamic/algorithmic pit generation at runtime — configs are hardcoded.
- Changing how complete rows are destroyed (whole-row behaviour unchanged).
- Persisting pit state across sessions.

## Decisions

### 1. Breakability computed per-frame, not stored on cells

**Decision**: Before the cell loop in `resolveGridCells()`, scan once for `firstCompleteRow` (lowest row index in breakout zone with `CellState.COMPLETED`). Any OCCUPIED cell at `r > firstCompleteRow` is breakable.

**Rationale**: Storing breakability as a third/fourth cell state would require updating state whenever rows collapse. A per-frame scan is O(rows × cols) — negligible — and stays correct automatically as the grid changes.

**Alternative considered**: A `CellState.BREAKABLE` enum variant. Rejected because it requires manual state transitions on every row collapse/addition.

### 2. Individual cell destruction (not whole row)

**Decision**: When a breakable OCCUPIED cell is hit, clear that single cell (`state = EMPTY, pieceType = null`), emit `CELL_DESTROYED`, and reflect the ball.

**Rationale**: These cells are path-clearing obstacles, not scoring rows. Destroying a whole incomplete row would be overpowered and skip the cooperative intent (tetris player must still complete rows for the ball to earn the big reward).

### 3. Four hardcoded pit configurations

**Decision**: Four 3×10 grids of `PieceType | null` defined as a constant in `grid.ts`. Row 0 of each config maps to grid row 23 (COMPLETED), rows 1–2 map to grid rows 24–25 (OCCUPIED). Randomly select one per `TetrisSystem.init()`.

The four configurations:

```
Config 0 — I+I+O base, left-heavy
R23: I I I I  I I I I  O O  (complete)
R24: . T Z Z  . L L L  O O
R25: T T T Z  Z L . .  . .

Config 1 — I+I+O base, right-heavy
R23: I I I I  I I I I  O O  (complete)
R24: J . . .  T Z Z .  O O
R25: J J J T  T T Z Z  . .

Config 2 — I+I+O base, sparse bottom
R23: I I I I  I I I I  O O  (complete)
R24: . S S L  L L Z Z  O O
R25: S S . .  . L . Z  Z .

Config 3 — J+T+I base (distinct complete row)
R23: J J J T  T T I I  I I  (complete)
R24: J O O .  T . S S  . J2
R25: . O O .  . S S J2 J2 J2
```

**Rationale**: Fixed configs are simple, always valid, visually designed, and easy to test. Runtime backtracking solvers are complex and could degenerate on unlucky piece selections. Four configs gives enough variety without over-engineering.

**Alternative considered**: Randomised algorithmic packing. Rejected — the constraint (complete top row, both lower rows incomplete) is non-trivial to guarantee without a solver.

### 4. `fillInitialPit` lives in `grid.ts`

**Decision**: A standalone `fillInitialPit(grid: Grid): void` function in `grid.ts`, called from `TetrisSystem.init()`.

**Rationale**: Keeps grid mutation logic alongside other grid utilities (`lockPiece`, `markRowCompleted`, etc.). `TetrisSystem` already owns game initialisation so the call site is natural.

### 5. Scoring at 25 points per cell

**Decision**: `POINTS_CELL_DESTROYED = 25` in `config.ts`. `ScoringSystem` subscribes to `CELL_DESTROYED`.

**Rationale**: `POINTS_ROW_DESTROYED = 250` for a 10-cell complete row = 25 per cell. Consistent scale; breaking a path cell earns a proportional reward.

## Risks / Trade-offs

- **Multiple balls per frame** (future feature): If two balls could hit cells in the same frame, a single `firstCompleteRow` scan and cell-clearing loop could have ordering effects. Not a concern with the current single-ball model.
- **Config visual quality**: Hardcoded configs are curated but limited. If the game adds more starting-difficulty levels later, configs would need to be extended manually. → Acceptable; four configs is enough for now.
- **Row collapse after CELL_DESTROYED**: `onRowDestroyed` in `TetrisSystem` calls `collapseRow`, which shifts everything down. `CELL_DESTROYED` (single cell) does NOT trigger collapse — a partially-cleared row stays in place until it becomes empty via multiple hits. This is intentional; incomplete rows don't collapse.

## Open Questions

None — all decisions resolved during design exploration.
