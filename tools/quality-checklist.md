# Claude Quality Checklist — Self-Evolving

This file is read on every session start. Claude MUST silently verify these items before
taking actions. When a new failure pattern is discovered, Claude adds it to this checklist
and commits it so the lesson persists across sessions and machines.

Last updated: 2026-03-23

---

## Session Start (run once at beginning)

- [ ] Ran `git fetch origin --tags --prune` before assuming branch state
- [ ] Checked ALL branches with `git branch -a` — never assume only main exists
- [ ] Read `CLAUDE.md` fully — it has roadmap, status, architecture, and procedures
- [ ] Confirmed on `develop` or feature branch — never work on `main`
- [ ] Read `.current-game` for active game context
- [ ] Presented user with: recent accomplishments, what's next, "What do you want to work on?"
- [ ] Read this checklist file for latest rules

## Before Every Action

- [ ] Acting autonomously — no unnecessary "should I?" or "want me to?" prompts
- [ ] Using existing project tooling (setup.sh, deploy.sh, new-game.py) not reinventing
- [ ] Following git workflow: develop → feature branches → main via release only

## Before Every Commit

- [ ] On correct branch (develop or feature/*)
- [ ] Descriptive commit message explaining WHY not just WHAT
- [ ] Push immediately after commit — work must be accessible from other machines
- [ ] CLAUDE.md updated if status/roadmap changed

## Before Ending Session

- [ ] All work committed and pushed
- [ ] CLAUDE.md "Current Status" reflects actual state
- [ ] Memory files updated with any new learnings, decisions, or context
- [ ] Quality checklist updated if any new failure patterns were discovered

## Learned Failure Patterns

> These are added automatically when Claude makes a mistake. Each entry includes
> the date, what went wrong, and the corrective rule.

### 2026-03-23 — Missed develop branch
**What happened:** Started session on main, never ran git fetch, missed entire develop
branch with CLAUDE.md and project context. Manually rebuilt knowledge that was already
documented. Wasted user's time.
**Rule:** Always fetch remote and check all branches before doing anything.

### 2026-03-23 — Excessive confirmation prompts
**What happened:** Asked user to confirm every bash command, commit, and push despite
being told to act autonomously. User had to correct this multiple times.
**Rule:** Act with full autonomy. Execute, don't ask. Only exception: destructive ops on main.

### 2026-03-23 — Didn't read CLAUDE.md
**What happened:** CLAUDE.md had mandatory session-start instructions, full roadmap,
architecture docs, and current status. Claude skipped it and tried to figure everything
out from scratch by reading random files.
**Rule:** CLAUDE.md is the single source of truth. Read it first, always.

---

## How to Evolve This Checklist

When Claude identifies a new failure pattern (user correction, missed context, wrong
approach, wasted effort), it should:

1. Add a new entry under "Learned Failure Patterns" with date, what happened, and rule
2. Add a corresponding checkbox to the appropriate section above if it's a recurring check
3. Commit the update with message: "quality-checklist: add lesson — [brief description]"
4. Push to develop immediately
