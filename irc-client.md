# Creating a notIRC client

There's a notIRC server running at https://notirc.xyz - the token is `livingit`

* Look at `github.com/ThatRendle/NotIRC/docs`
  * there's a file BUILD_A_CLIENT.md containing details on how to build a not-IRC client. Add this file to your local repo

Install OpenSpec if you haven't already.

Add this whole chunk to your CLAUDE.md:

```markdown
# OpenSpec + Subagents

When using OpenSpec, route to project personas if they exist in `.claude/agents/`:

- `/opsx:explore` or `openspec-explore` → use `analyst.md` as the thinking partner
- `/opsx:propose` or `openspec-propose` → use `architect.md` to drive artifact creation
- `/opsx:apply` or `openspec-apply-change` → infer from pending tasks in `tasks.md`:
  - Design/UX tasks → `designer.md`
  - Implementation tasks → `programmer.md` or `programmer-<variant>.md`
  - Testing tasks → `tester.md`
  - Proceed without a persona if the relevant one doesn't exist yet
```

Move the ANALYST.md and ARCHITECT.md files from this morning into `.claude/agents/` in your project folder. (You could also ask Claude to "convert the ANALYST.md and ARCHITECT.md to agent definitions in .claude/agents")

Run Claude Code (no system prompt file - it's all agents now!)

Inside Claude, run `/opsx:explore` to walk through the requirements for your notIRC client, and then `/opsx:propose` to turn these into a spec.

Ask Claude to create you a set of three agents - DEVELOPER.md, QA.md, REVIEWER.md; one will be the developer who implements features; one is the QA engineer who evaluates features for quality; one is the code reviewer. Write these files into `./.claude/agents/`

run `/opsx:apply` to implement your client using the agents.

Connect to the notIRC server at https://notirc.xyz

