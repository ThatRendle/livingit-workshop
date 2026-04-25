[ADD THIS TO CLAUDE.md - DELETE THIS LINE]

## OpenSpec + Subagents

When using OpenSpec, route to project personas if they exist in `.claude/agents/`:

- `/opsx:explore` or `openspec-explore` → use `analyst.md` as the thinking partner
- `/opsx:propose` or `openspec-propose` → use `architect.md` to drive artifact creation
- `/opsx:apply` or `openspec-apply-change` → infer from pending tasks in `tasks.md`:
  - Design/UX tasks → `designer.md`
  - Implementation tasks → `programmer.md` or `programmer-<variant>.md`
  - Testing tasks → `tester.md`
  - Proceed without a persona if the relevant one doesn't exist yet
