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

## Before Generating Profiles or Icon Packs

- [ ] Profile icons are 72x72 PNGs in `Images/` dir, referenced as `Images/HASH.png`
- [ ] Icon packs have `previews/` dir with 1920x960 PNG mosaic
- [ ] Icon packs are copied to `$APPDATA/Elgato/StreamDeck/Plugins/com.elgato.StreamDeck/Icons/` (NOT IconPacks/)
- [ ] Profiles are copied to `$APPDATA/Elgato/StreamDeck/ProfilesV3/`
- [ ] Verified against a known-working installed pack/profile structure

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

### 2026-03-23 — Skipped session greeting
**What happened:** Claude did not present the mandatory session greeting on session start,
despite instructions in CLAUDE.md, the quality checklist, and the SessionStart hook output.
User had to repeatedly ask for it. The greeting instruction was buried in `additionalContext`
where it was easy to deprioritize.
**Rule:** The session greeting is the FIRST thing Claude outputs. Before addressing any user
message, before doing any work. Show the greeting. Every. Single. Time.

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

### 2026-03-23 — Profile icons never displayed (multiple root causes, hours wasted)
**What happened:** Icons never appeared on Stream Deck buttons despite multiple fix attempts.
Three separate issues were discovered over several hours of debugging:

1. **Wrong action UUID** (THE MAIN BLOCKER): Profile actions used custom plugin UUIDs
   (`com.simracing.lmu.*`, `com.simracing.ace.*`) but those plugins were never installed.
   Stream Deck silently renders blank buttons for unknown plugin actions. The fix was to use
   the built-in `com.elgato.streamdeck.system.hotkey` action with proper scan/VKey/Qt codes.
   Working profiles on the machine (ACC by Hana, AMS2) all use this built-in action.

2. **Wrong image format**: Originally embedded as `data:image/svg+xml;base64,...` inline.
   SD expects PNG files in `Profiles/<PAGE_UUID>/Images/` referenced as `Images/HASH.png`.

3. **Wrong icon pack location**: Icon packs were copied to `IconPacks/` (marketplace only).
   Local dev packs go in `Plugins/com.elgato.StreamDeck/Icons/`.

**Rules — Stream Deck Profile Icons:**
- Actions MUST use `com.elgato.streamdeck.system.hotkey` UUID (NOT custom plugin UUIDs)
  unless the custom plugin is actually installed and running
- States should be minimal: `[{"Image": "Images/HASH.png"}]`
- Images are 72x72 PNGs in per-page `Profiles/<PAGE_UUID>/Images/` directories
- Icon packs for local dev: `$APPDATA/Elgato/StreamDeck/Plugins/com.elgato.StreamDeck/Icons/`
- Preview images: `1-preview.png` in `previews/` dir, 1920x960 PNG
- ALWAYS verify by comparing against a known-working profile on the same device

---

## How to Evolve This Checklist

When Claude identifies a new failure pattern (user correction, missed context, wrong
approach, wasted effort), it should:

1. Add a new entry under "Learned Failure Patterns" with date, what happened, and rule
2. Add a corresponding checkbox to the appropriate section above if it's a recurring check
3. Commit the update with message: "quality-checklist: add lesson — [brief description]"
4. Push to develop immediately
