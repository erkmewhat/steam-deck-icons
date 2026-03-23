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

## Stream Deck Profile Rules (MANDATORY — read before ANY profile work)

These rules were learned through painful debugging. Violating ANY of them causes
silent failures — SD gives zero error feedback, buttons just disappear or go blank.

### Action Format
- [ ] ALL hotkey buttons use `com.elgato.streamdeck.system.hotkey` UUID
- [ ] NEVER use custom plugin UUIDs (com.simracing.lmu.*, com.simracing.ace.*)
      unless the plugin is actually installed and running on the target machine
- [ ] Hotkey Settings must include Coalesce, Hotkeys array with scan/VKey/Qt codes
- [ ] States must be minimal: `[{"Image": "Images/HASH.png"}]` or `[{}]`

### Folder / Navigation Buttons
- [ ] Folder buttons use `com.elgato.streamdeck.profile.openchild` UUID
- [ ] Back buttons use `com.elgato.streamdeck.profile.backtoparent` UUID
- [ ] Both MUST include `Plugin` key (unlike hotkey actions which omit it)
- [ ] Child pages must NOT be in top-level `Pages` array — only the main page goes there
- [ ] Child pages are discovered via openchild `Settings.ProfileUUID` references

### UUID Case Rules
- [ ] Directory names: UPPERCASE (e.g., `EBAAB49C-EFF9-4A7F-9C43-FFCE95C09427.sdProfile`)
- [ ] JSON UUID values: lowercase (e.g., `"ProfileUUID": "c68f250f-93f5-41f9-b888-d9dd28d9df3e"`)
- [ ] This includes: Pages array, Default, Current, ProfileUUID in folder Settings

### Icon Images
- [ ] Icons are 72x72 PNGs (converted from SVG via `tools/svg-to-png.js`)
- [ ] PNGs stored per-page: `Profiles/<PAGE_UUID>/Images/HASH.png`
- [ ] Referenced as `"Image": "Images/HASH.png"` (relative path, NOT data URI)
- [ ] NEVER use base64 inline images — SD ignores them

### Icon Packs
- [ ] Local dev packs go in `$APPDATA/Elgato/StreamDeck/Plugins/com.elgato.StreamDeck/Icons/`
- [ ] NOT in `$APPDATA/Elgato/StreamDeck/IconPacks/` (marketplace only)
- [ ] Must have `previews/1-preview.png` (1920x960 PNG)

### Profile Structure
- [ ] Top-level `Pages` array contains ONLY the main page UUID
- [ ] Profile dir: `UPPERCASE-UUID.sdProfile/`
- [ ] Page dirs: `Profiles/UPPERCASE-UUID/manifest.json`
- [ ] After changes, restart SD: `bash tools/restart-streamdeck.sh`
- [ ] Export `.streamDeckProfile` to `exports/` after every deploy (deploy.sh does this automatically)
- [ ] ALWAYS verify by comparing against a working profile on the same device

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

### 2026-03-23 — Stream Deck profile icons: 5 cascading failures over several hours
**What happened:** Icons never appeared on Stream Deck buttons. Five separate root causes
were discovered one at a time, each requiring a full restart cycle to test:

1. **Wrong action UUID**: Used custom plugin UUIDs (`com.simracing.lmu.*`) but plugin wasn't
   installed. SD silently shows blank buttons. Fix: use `com.elgato.streamdeck.system.hotkey`.
2. **Wrong image format**: Base64 SVG data URIs. SD ignores them. Fix: 72x72 PNGs in
   per-page `Images/` dirs referenced as `Images/HASH.png`.
3. **Wrong icon pack location**: `IconPacks/` is marketplace only. Fix: install to
   `Plugins/com.elgato.StreamDeck/Icons/`.
4. **Wrong UUID case**: Uppercase UUIDs in JSON. SD uses lowercase internally, so folder
   buttons couldn't resolve targets. Fix: lowercase in JSON, uppercase for directory names.
5. **Child pages in top-level Pages array**: SD treats `Pages` entries as swipe-pages, which
   conflicts with folder navigation. Fix: only main page in `Pages` array.

**Rule:** See "Stream Deck Profile Rules" checklist section above. EVERY rule was learned
from a silent failure. When debugging SD profiles, ALWAYS compare the full JSON structure
of a known-working profile on the same device before guessing.

---

## How to Evolve This Checklist

When Claude identifies a new failure pattern (user correction, missed context, wrong
approach, wasted effort), it should:

1. Add a new entry under "Learned Failure Patterns" with date, what happened, and rule
2. Add a corresponding checkbox to the appropriate section above if it's a recurring check
3. Commit the update with message: "quality-checklist: add lesson — [brief description]"
4. Push to develop immediately
