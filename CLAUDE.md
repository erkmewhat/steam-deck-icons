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

All rules documented in `tools/quality-checklist.md` under "Stream Deck Profile Rules".
Violating ANY rule causes silent failures — SD gives zero error feedback.

**5 rules that must ALL be followed:**
1. **Action UUID**: Use `com.elgato.streamdeck.system.hotkey`. Never custom plugin UUIDs.
2. **Images**: 72x72 PNGs in per-page `Profiles/<PAGE>/Images/`. Never base64 data URIs.
3. **UUID case**: UPPERCASE for directory names, lowercase for JSON values.
4. **Pages array**: Only main page in top-level `Pages[]`. Child pages via folder buttons only.
5. **Icon packs**: Install to `Plugins/com.elgato.StreamDeck/Icons/`, not `IconPacks/`.

**Profile icon pipeline:**
1. SVGs live in icon pack `icons/` dirs (144x144, source of truth)
2. `generate-profile*.py` converts SVGs → 72x72 PNGs via `tools/svg-to-png.js` (resvg-js)
3. PNGs stored per-page: `Profiles/<UPPERCASE-PAGE-UUID>/Images/HASH.png`
4. Manifest references: `"States": [{"Image": "Images/HASH.png"}]` (minimal state object)
5. Profile copied to `%APPDATA%/Elgato/StreamDeck/ProfilesV3/UPPERCASE-UUID.sdProfile/`

**Hotkey action format:**
```json
{
  "ActionID": "<uuid>", "LinkedTitle": true, "Name": "Hotkey", "Resources": null,
  "Settings": {"Coalesce": true, "Hotkeys": [<key>, <empty>, <empty>, <empty>]},
  "State": 0, "States": [{"Image": "Images/HASH.png"}],
  "UUID": "com.elgato.streamdeck.system.hotkey"
}
```

**Folder button format:**
```json
{
  "ActionID": "<uuid>", "LinkedTitle": true, "Name": "Create Folder",
  "Plugin": {"Name": "Create Folder", "UUID": "com.elgato.streamdeck.profile.openchild", "Version": "1.0"},
  "Resources": null, "Settings": {"ProfileUUID": "<lowercase-target-page-uuid>"},
  "State": 0, "States": [{"Image": "Images/HASH.png"}],
  "UUID": "com.elgato.streamdeck.profile.openchild"
}
```

### Components
- **Icons** are SVGs in icon pack `icons/` dirs (144x144, source of truth)
- **Profiles** generated by `tools/generate-profile[-game].py` — toggle actions use plugin UUID, others use built-in hotkey
- **Plugin** (`com.simracing.lmu`) — Node.js plugin with SDK v2, handles toggle state via `setState(0/1)`
- **Icon packs** need `manifest.json`, `icons.json`, `icons/` dir, and `previews/1-preview.png`
- **Exports** — `.streamDeckProfile` files in `exports/` for cross-machine portability

### Toggle Actions (Plugin-Based)
Actions that have on/off state use the custom plugin (not built-in hotkey):
- headlights, ignition, pit-limiter, wipers, starter, headlight-flash, request-pitstop, ai-takeover, launch-control
- Each has an `-on.svg` variant in `plugin/com.simracing.lmu.sdPlugin/imgs/actions/`
- Manifest defines 2 States with `DisableAutomaticStates: true`
- Plugin calls `setState(0/1)` on keyDown to swap icons
- SD does NOT support animated GIFs/WebP on state changes — static icons only

### Icon Style Variants
- **LMU**: Custom style with radial gradients, glow filters, accent bars
- **ACE**: Glass style (dark red bg, glass shine overlay, red-to-yellow accent bar)
- **ACE alternates**: Neon, Carbon styles stored in `plugin/com.simracing.ace.sdPlugin/imgs/styles/`
- **Nav buttons**: V1 big-chevron (active for LMU), V5 pill-arrow preserved as variant
- **All variants**: Stored in `style-samples/` for future reference
- **Preview**: Open `icon-collection.html` in Chrome to browse all icons

## Build & Deploy

```bash
bash tools/deploy.sh [lmu|ace]     # Full 9-step pipeline (stop SD first!)
bash tools/restart-streamdeck.sh   # Kill and relaunch SD app
```

**Deploy pipeline (9 steps):**
1. Preflight checks
2. Build TypeScript + bundle SDK v2 deps (@elgato/streamdeck, schemas, utils, ws, koffi)
3. Sync icons (SVG → PNG)
4. Install plugin to SD Plugins dir
5. Install icon pack with preview to `Plugins/com.elgato.StreamDeck/Icons/`
6. Regenerate profile (toggle actions use plugin UUID, non-toggles use built-in hotkey)
7. Validate profile UUIDs
8. Export `.streamDeckProfile` to `exports/` for portability
9. Summary

**IMPORTANT: Stop Stream Deck before deploying** — plugin dir is locked while SD runs.

## Known Issues & Gotchas

- **Toggle actions use plugin UUID** (`com.simracing.lmu.*`) — deploy.sh handles this correctly via `make_action()` in the profile generator. Non-toggle actions use `com.elgato.streamdeck.system.hotkey`.
- **Profile icons must be 72x72 PNGs** in per-page `Images/` dirs. Base64 data URIs, SVGs, and wrong-size PNGs all fail silently.
- **Icon packs for local dev** go in `Plugins/com.elgato.StreamDeck/Icons/`, NOT `IconPacks/`.
- **UUID case**: UPPERCASE for directory names, lowercase for JSON values.
- **Pages array**: Only main page in top-level `Pages[]`. Child pages via folder buttons only.
- **Plugin deps**: SDK v2 requires @elgato/schemas, @elgato/utils, ws in addition to @elgato/streamdeck.
- **ESM imports**: Post-build script adds `.js` extensions to compiled output (Node 20 requires them).
- **ACE uses binary protobuf config** — keybinds must be set manually in-game.
- **After profile changes, restart SD** — use `bash tools/restart-streamdeck.sh`.
- **SD does not support animated GIFs/WebP** on state changes — use setState with static images only.
- **setImage() with SVG data URIs** does not visually update buttons — use setState() only.
- **Full SDK reference**: `tools/sd-sdk-reference.md` (1500 lines) — read before any plugin work.

---

## Current Status

### Games Deployed
| Game | Actions | Toggle | Icon Style | Status |
|------|---------|--------|------------|--------|
| LMU  | 47      | 9 on/off | Custom (gradients + glow) | Fully deployed, plugin running, V1 nav icons |
| ACE  | 27      | 0       | Glass | Deployed with glass icons, 9 missing glass icons created |

### Key Assets
| Asset | Location |
|-------|----------|
| LMU exportable profile | `exports/LMU Sim Racing.streamDeckProfile` |
| ACE exportable profile | `exports/ACE Sim Racing.streamDeckProfile` |
| Icon collection preview | `icon-collection.html` (open in Chrome) |
| SD SDK reference | `tools/sd-sdk-reference.md` (1500 lines) |
| Nav button variants | `style-samples/nav-variants/` (V1-V5 concepts + V1 colored set) |
| ACE style variants | `plugin/com.simracing.ace.sdPlugin/imgs/styles/{glass,neon,carbon}/` |

### Version History
- **v0.1.0** (tagged 2026-03-23) — LMU + ACE hotkey plugins, icon packs, profiles, deploy tooling
- **v0.1.1** (2026-03-23) — Profile icon pipeline fixed (5 silent failure modes), toggle on/off, glass ACE icons, V1 nav, SDK v2, exportable profiles

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
| `tools/quality-checklist.md` | Self-evolving checklist with SD profile rules + failure patterns | Read on start, before any profile work |
| `tools/sd-sdk-reference.md` | Comprehensive Elgato SDK reference (1500 lines) | Before any plugin/profile/icon code |
| `tools/deploy.sh` | 9-step build + deploy + export pipeline | Every deploy |
| `tools/restart-streamdeck.sh` | Kill + relaunch SD app | After deploy |
| `tools/svg-to-png.js` | SVG → 72x72 PNG conversion (resvg-js) | During profile generation |
| `tools/generate-previews.js` | Icon pack preview mosaic (1920x960) | During deploy |
| `icon-collection.html` | Browsable gallery of all icons | Design review |
| `.claude/settings.json` | Hook wiring, permissions | Loaded by Claude Code |
| `.current-game` | Active game context | Checked on session start |

### Self-Learning Loop

1. **Session starts** → preflight hook fires → Claude reads CLAUDE.md + quality checklist
2. **During work** → Claude silently runs checklist checks before major actions
3. **Before SD work** → Claude reads SD profile rules section in quality checklist
4. **Before plugin work** → Claude reads `tools/sd-sdk-reference.md`
5. **Mistake happens** → Claude adds learned failure pattern to `tools/quality-checklist.md`
6. **Session ends** → Claude updates CLAUDE.md status, commits, pushes
7. **Next session** → new failure pattern is now part of the checklist, preventing repeat

All workflow artifacts live in the repo (not just in Claude memory) so they sync across
machines and survive context resets.

### Deploy Workflow

1. Stop Stream Deck first (`taskkill //IM "StreamDeck.exe" //F`)
2. Run `bash tools/deploy.sh [lmu|ace]` — builds, bundles deps, syncs icons, installs, validates, exports
3. After deploy, manually install plugin SDK deps if needed (deploy.sh handles this now)
4. Restart SD: `bash tools/restart-streamdeck.sh`
5. For toggle actions: buttons must be **drag-and-dropped from SD UI** the first time (profile JSON alone doesn't wire up plugin events)
6. Exported `.streamDeckProfile` files are in `exports/` for cross-machine use

### Adding Toggle Actions to a Game

1. Create `-on.svg` in `plugin/<game>.sdPlugin/imgs/actions/` (bright, glowing variant)
2. Set `isToggle = true` in the action's `.ts` file
3. Add 2 States + `DisableAutomaticStates: true` in plugin manifest
4. Add action_id to `TOGGLE_ACTIONS` set in profile generator
5. Deploy — toggle actions will use plugin UUID, non-toggles use built-in hotkey

### Adding Icon Style Variants

1. Create new SVGs in `plugin/<game>.sdPlugin/imgs/styles/<style-name>/`
2. To switch active style: copy SVGs to `com.simracing.<game>-icons.sdIconPack/icons/`
3. Store style samples in `style-samples/` for future reference
4. Update `icon-collection.html` and open in Chrome to preview

### Session End Checklist

After every session or major milestone:
- [ ] All work committed and pushed to `develop`
- [ ] CLAUDE.md "Current Status" and "Roadmap" updated if anything changed
- [ ] Research/plans/decisions saved to memory files
- [ ] `tools/quality-checklist.md` updated if any new failure patterns discovered
- [ ] `icon-collection.html` regenerated if icons changed
- [ ] `.streamDeckProfile` exports up to date (deploy.sh handles automatically)
- [ ] Version tagged if releasing
