# Stream Deck Sim Racing — Claude Code Instructions

## On Session Start (MANDATORY)

The `tools/session-preflight.sh` hook runs automatically and injects project state.
After it fires, Claude MUST:

1. If on `main`, switch to `develop` immediately
2. If behind remote, pull
3. Read this entire CLAUDE.md for roadmap, status, and procedures
4. Read `tools/quality-checklist.md` for self-check rules and learned failure patterns
5. Check `.current-game` for active game context
6. **Present the session greeting** (see format below)

### Session Greeting Format

Always greet the user with this structure:

```
**[Project Name] — [branch] @ [version]**

**Recent accomplishments:**
- [bullet points from git log and Current Status section]

**Up next on roadmap:**
- [next milestone from Roadmap section with status]

**What do you want to work on?**
```

Keep it concise — 3-5 bullets for accomplishments, 2-3 for what's next. Always end
with "What do you want to work on?" to hand control to the user.

## User Preferences

- **Be autonomous.** Drive tasks forward without excessive confirmation. Only ask when genuinely blocked.
- **Always save progress.** Research, plans, decisions, and ideation go into memory files AND get updated in this CLAUDE.md. Never rely on conversation context alone.
- **Commit and push at milestones.** Don't let work accumulate. Push after every logical unit so work is accessible from other machines.
- **Follow the new-game 5-step flow.** Never skip proposal steps when adding a game.

## Git Workflow

- **`main`** — tagged releases only. Never commit directly.
- **`develop`** — active integration branch. All feature work merges here.
- **`feature/<name>`** — short-lived branches off `develop` for specific features.
- **`release/vX.Y.Z`** — cut from develop for release prep, merge to main when ready.
- Commit at natural milestones with descriptive messages. Push immediately.
- Current version: **pre-v1.0** (fine-tuning phase)

## Project Structure

```
CLAUDE.md                              # THIS FILE — project instructions, roadmap, status
.claude/
  settings.json                         # Project Claude Code config (hooks, permissions)
  settings.local.json                   # Machine-local overrides (gitignored)
.current-game                           # Active game context (lmu|ace)

com.simracing.lmu-icons.sdIconPack/    # LMU icon pack (47 SVGs + manifest)
com.simracing.ace-icons.sdIconPack/    # ACE icon pack (51 SVGs + manifest)

plugin/
  src/                                  # TypeScript source (actions, plugin entry points)
  com.simracing.lmu.sdPlugin/          # Compiled LMU plugin (JS + node_modules + manifest)
  com.simracing.ace.sdPlugin/          # Compiled ACE plugin
plugin-ace/                             # ACE plugin source variant

profile/                                # LMU Stream Deck profile (.sdProfile dir)
profile-ace/                            # ACE Stream Deck profile

tools/
  # === Workflow & Quality (Claude-facing) ===
  session-preflight.sh                  # SessionStart hook — injects project state into Claude
  quality-checklist.md                  # Self-evolving checklist — read on start, update on mistakes
  setup.sh                              # Interactive project sync and dependency check

  # === Build & Deploy ===
  deploy.sh                             # Full 9-step build + deploy pipeline
  preflight.py                          # Pre-deploy validation
  sync-icons.js                         # Sync SVGs from icon packs to plugin imgs/

  # === Game Scaffolding ===
  new-game.py                           # Scaffold a new game (interactive or --config)
  generate-profile.py                   # LMU profile generator
  generate-profile-ace.py               # ACE profile generator
  design-icons.py                       # Icon design agent prompts from brand config
  setup-keybinds.py                     # Keybind configuration helper
  read-lmu-bindings.py                  # Parse LMU keybind config files

  # === Icon Tools ===
  convert-icons.mjs                     # SVG to PNG conversion (LMU)
  convert-ace-icons.mjs                 # SVG to PNG conversion (ACE)
  switch-style.py                       # Switch icon style variants
  preview-icons.py                      # Generate icon preview HTML

  # === Validation ===
  validate-profile.py                   # Profile UUID consistency check

  # === Config ===
  games/                                # Game configs (lmu.json, ace.json)
  brands/                               # Branding configs (colors, style)
```

## Architecture

### How Stream Deck Profiles Work (CRITICAL — read before touching profiles)

Profiles use the **built-in hotkey action** (`com.elgato.streamdeck.system.hotkey`), NOT
custom plugin UUIDs. SD silently shows blank buttons for uninstalled plugins. Every hotkey
button needs Windows scan codes, VKey codes, and Qt key codes in its Settings.

**Profile icon pipeline:**
1. SVGs live in icon pack `icons/` dirs (144x144, source of truth)
2. `generate-profile*.py` converts SVGs → 72x72 PNGs via `tools/svg-to-png.js` (resvg-js)
3. PNGs stored in each page's `Images/` dir: `Profiles/<PAGE_UUID>/Images/HASH.png`
4. Manifest references: `"States": [{"Image": "Images/HASH.png"}]` (minimal state object)
5. Profile copied to `%APPDATA%/Elgato/StreamDeck/ProfilesV3/`

**Action format (must match exactly):**
```json
{
  "ActionID": "<uuid>",
  "LinkedTitle": true,
  "Name": "Hotkey",
  "Resources": null,
  "Settings": {"Coalesce": true, "Hotkeys": [<key>, <empty>, <empty>, <empty>]},
  "State": 0,
  "States": [{"Image": "Images/HASH.png"}],
  "UUID": "com.elgato.streamdeck.system.hotkey"
}
```

**Icon pack install location (local dev):**
`%APPDATA%/Elgato/StreamDeck/Plugins/com.elgato.StreamDeck/Icons/`
(NOT `IconPacks/` — that's marketplace only)

### Components
- **Icons** are SVGs in icon pack `icons/` dirs
- **Profiles** are generated by `tools/generate-profile[-game].py` using built-in hotkey actions
- **Hotkeys** use Windows scan codes, VKey codes, Qt key codes in SD's built-in hotkey action
- **Icon packs** need `manifest.json`, `icons.json`, `icons/` dir, and `previews/1-preview.png`

## Build & Deploy

```bash
bash tools/setup.sh                # Sync repo, install deps, verify build
bash tools/deploy.sh [lmu|ace]     # Full pipeline: build → bundle → sync → install → validate
python3 tools/generate-profile.py  # Regenerate LMU profile + install to ProfilesV3
python3 tools/generate-profile-ace.py  # Regenerate ACE profile + install
bash tools/restart-streamdeck.sh   # Kill and relaunch SD app
```

Deploy installs to `%APPDATA%/Elgato/StreamDeck/{Plugins/com.elgato.StreamDeck/Icons,ProfilesV3}/`.

## Known Issues & Gotchas

- **NEVER use custom plugin UUIDs in profiles** — SD silently blanks buttons for uninstalled plugins. Always use `com.elgato.streamdeck.system.hotkey`.
- **Profile icons must be 72x72 PNGs** in per-page `Images/` dirs. Base64 data URIs, SVGs, and wrong-size PNGs all fail silently.
- **Icon packs for local dev** go in `Plugins/com.elgato.StreamDeck/Icons/`, NOT `IconPacks/`.
- **ACE uses binary protobuf config** — keybinds must be set manually in-game (22 of 27 need manual assignment).
- **After profile changes, restart SD** — use `bash tools/restart-streamdeck.sh`.

---

## Current Status

### Games Deployed
| Game | Actions | Status | Plugin UUID | Profile UUID |
|------|---------|--------|-------------|--------------|
| LMU  | 47      | Fully deployed, keybinds set | com.simracing.lmu | EBAAB49C-EFF9-4A7F-9C43-FFCE95C09427 |
| ACE  | 27      | Deployed, icons need visual enhancement | com.simracing.ace | D7E4F2A8-91B3-4C6D-A5E7-8F2B1C3D4E5A |

### Version History
- **v0.1.0** (tagged 2026-03-23) — LMU + ACE hotkey plugins, icon packs, profiles, deploy tooling

---

## Roadmap & Next Steps

### v0.2.0 — ACC Hotkey Game (Phase 1 of JustPush Integration)
**Status: NOT STARTED**

Add Assetto Corsa Competizione as a third game using existing hotkey architecture.
Follow the 5-step new-game flow. Use `tools/new-game.py`.

### v0.3.0 — Telemetry-Aware Features for LMU/ACE (Phase 2)
**Status: NOT STARTED**

Add game telemetry reading to enable:
- Dynamic fuel calculator (adapts to driving patterns)
- Tire pressure optimization
- Race flag visualization (flag colors on buttons)
- Ignition-aware button coloring (state-dependent colors)
- Smart pitstop macro sequences

This is our differentiator — JustPush (ACC-only competitor) doesn't support LMU/ACE.

### v1.0.0 — Stable Release
Future goal. Requires all games polished, telemetry features stable, icons finalized.

### Background: JustPush Competitive Research
JustPush is a free, closed-source SD plugin (Go) for ACC with: auto fuel calc, auto tire pressure, flag box, pitstop macros, ignition-aware coloring, auto starter, pre-configured profiles. Planned 2025 expansion to AC, ACE, iRacing, LMU. Our strategy: don't compete on ACC (JustPush owns it for free), instead bring telemetry features to LMU/ACE first.

---

## Adding a New Game (5-Step Flow)

**NEVER skip steps. NEVER scaffold before user approval.**

1. **Ask** — What game? Keybinding source (read config / defaults / custom)?
2. **Research** (in parallel):
   - Keybindings: web search defaults, find config file locations, determine if editable
   - Branding: game colors, logo, UI style from official site CSS
   - Competitors: search Elgato Marketplace for existing icon packs, analyze designs
3. **Propose Actions & Layout** — categorized table with keys, ASCII grid layout. Get approval.
4. **Propose Icon Style** — brand colors, competitor analysis, our color mapping, border/bg treatment. Get approval.
5. **Execute** — only after BOTH approvals:
   - Write game config → scaffold with `new-game.py` → design icons with `design-icons.py` → preview → deploy

## Claude Workflow System

This project has an integrated workflow that ensures Claude maintains context, quality,
and continuity across sessions and machines. The system is self-evolving — it improves
every time a mistake is caught.

### Components

| File | Purpose | When Used |
|------|---------|-----------|
| `CLAUDE.md` | Single source of truth: roadmap, status, procedures | Read every session start |
| `tools/session-preflight.sh` | SessionStart hook: fetches remote, injects state | Runs automatically via hook |
| `tools/quality-checklist.md` | Self-evolving checklist with learned failure patterns | Read on start, updated on mistakes |
| `.claude/settings.json` | Hook wiring, permissions | Loaded by Claude Code |
| `.current-game` | Active game context | Checked on session start |

### Self-Learning Loop

1. **Session starts** → preflight hook fires → Claude reads CLAUDE.md + quality checklist
2. **During work** → Claude silently runs checklist checks before major actions
3. **Mistake happens** → Claude adds learned failure pattern to `tools/quality-checklist.md`
4. **Session ends** → Claude updates CLAUDE.md status, commits, pushes
5. **Next session** → new failure pattern is now part of the checklist, preventing repeat

All workflow artifacts live in the repo (not just in Claude memory) so they sync across
machines and survive context resets.

### Session End Checklist

After every session or major milestone:
- [ ] All work committed and pushed to `develop`
- [ ] CLAUDE.md "Current Status" and "Roadmap" updated if anything changed
- [ ] Research/plans/decisions saved to memory files
- [ ] `tools/quality-checklist.md` updated if any new failure patterns discovered
- [ ] Version tagged if releasing
