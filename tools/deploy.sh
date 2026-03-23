#!/bin/bash
# Full build + deploy pipeline for Stream Deck sim racing plugin and profile.
# Run from project root: bash tools/deploy.sh [game-id]
#
# Steps:
#   1. Build TypeScript plugin
#   2. Bundle node_modules into .sdPlugin
#   3. Sync icon SVGs from plugin to icon pack
#   4. Install plugin to Stream Deck
#   5. Install icon pack to Stream Deck
#   6. Regenerate profile (with keybindings + plugin actions)
#   7. Validate profile UUIDs against plugin manifest
#   8. Install profile to Stream Deck
#   9. Print reminder to restart Stream Deck

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SD_PLUGINS="$APPDATA/Elgato/StreamDeck/Plugins"
SD_ICONS="$APPDATA/Elgato/StreamDeck/Plugins/com.elgato.StreamDeck/Icons"
SD_PROFILES="$APPDATA/Elgato/StreamDeck/ProfilesV3"

GAMES_DIR="$ROOT/tools/games"
CURRENT_GAME_FILE="$ROOT/.current-game"

# Determine game ID: argument > .current-game file > default "lmu"
GAME="${1:-}"
if [ -z "$GAME" ] && [ -f "$CURRENT_GAME_FILE" ]; then
    GAME="$(cat "$CURRENT_GAME_FILE" | tr -d '[:space:]')"
fi
GAME="${GAME:-lmu}"

# Validate game config exists
GAME_CONFIG="$GAMES_DIR/$GAME.json"
if [ ! -f "$GAME_CONFIG" ]; then
    echo "ERROR: No game config found at $GAME_CONFIG"
    echo "Available games:"
    ls "$GAMES_DIR"/*.json 2>/dev/null | xargs -I{} basename {} .json | sed 's/^/  /'
    exit 1
fi

# Load IDs from game config using python (convert POSIX path to Windows for python)
GAME_CONFIG_WIN="$(cygpath -w "$GAME_CONFIG" 2>/dev/null || echo "$GAME_CONFIG")"
PLUGIN_ID="$(python3 -c "import json; print(json.load(open(r'$GAME_CONFIG_WIN'))['plugin_id'])")"
ICON_PACK_ID="$(python3 -c "import json; print(json.load(open(r'$GAME_CONFIG_WIN'))['icon_pack_id'])")"
GAME_NAME="$(python3 -c "import json; print(json.load(open(r'$GAME_CONFIG_WIN'))['name'])")"

# Save current game for future runs
echo "$GAME" > "$CURRENT_GAME_FILE"

echo "=== $GAME_NAME Stream Deck Deploy ==="
echo "  Game: $GAME (config: $GAME_CONFIG)"
echo ""

# 0. Pre-flight checks (catch issues before building)
echo "[0/8] Running preflight checks..."
cd "$ROOT"
if ! python3 tools/preflight.py --game "$GAME" 2>&1 | tail -1 | grep -q "FAILED"; then
    echo "  ✓ Preflight passed"
else
    echo ""
    python3 tools/preflight.py --game "$GAME"
    echo ""
    echo "  ✗ PREFLIGHT FAILED — fix errors above before deploying"
    exit 1
fi

# 1. Build TypeScript (game-specific entry point)
echo "[1/8] Building plugin TypeScript..."
cd "$ROOT/plugin"
ENTRY_SRC="src/plugin-${GAME}.ts"
if [ ! -f "$ENTRY_SRC" ]; then
    ENTRY_SRC="src/plugin.ts"
fi
npm run build
# tsconfig outputs to LMU's bin/. Copy compiled files to the target game's bin/.
if [ "$PLUGIN_ID" != "com.simracing.lmu.sdPlugin" ]; then
    mkdir -p "$ROOT/plugin/$PLUGIN_ID/bin/actions"
    cp -r "$ROOT/plugin/com.simracing.lmu.sdPlugin/bin/actions/"* "$ROOT/plugin/$PLUGIN_ID/bin/actions/" 2>/dev/null || true
    # Use game-specific entry point if it exists
    if [ -f "$ROOT/plugin/com.simracing.lmu.sdPlugin/bin/plugin-${GAME}.js" ]; then
        cp "$ROOT/plugin/com.simracing.lmu.sdPlugin/bin/plugin-${GAME}.js" "$ROOT/plugin/$PLUGIN_ID/bin/plugin.js"
    else
        cp "$ROOT/plugin/com.simracing.lmu.sdPlugin/bin/plugin.js" "$ROOT/plugin/$PLUGIN_ID/bin/plugin.js"
    fi
    cp "$ROOT/plugin/com.simracing.lmu.sdPlugin/bin/actions/hotkey-action.js" "$ROOT/plugin/$PLUGIN_ID/bin/actions/" 2>/dev/null || true
    cp "$ROOT/plugin/com.simracing.lmu.sdPlugin/bin/actions/send-key.js" "$ROOT/plugin/$PLUGIN_ID/bin/actions/" 2>/dev/null || true
fi
echo "  ✓ Build complete (entry: $ENTRY_SRC)"

# 2. Bundle node_modules into .sdPlugin
echo "[2/8] Bundling dependencies..."
for dep in @elgato/streamdeck koffi; do
    cp -r "node_modules/$dep" "$ROOT/plugin/$PLUGIN_ID/node_modules/" 2>/dev/null || true
done
for dep in node_modules/@elgato/streamdeck/node_modules/*; do
    [ -d "$dep" ] && cp -r "$dep" "$ROOT/plugin/$PLUGIN_ID/node_modules/" 2>/dev/null || true
done
echo "  ✓ Dependencies bundled"

# 3. Sync icons: icon pack (source of truth) → plugin + profile (PNG embed)
echo "[3/8] Syncing icons..."
cd "$ROOT"
node tools/sync-icons.js "$GAME"

# 4. Install plugin
echo "[4/8] Installing plugin..."
rm -rf "$SD_PLUGINS/$PLUGIN_ID"
cp -r "$ROOT/plugin/$PLUGIN_ID" "$SD_PLUGINS/"
echo "  ✓ Plugin installed"

# 5. Generate icon pack preview + install
echo "[5/8] Installing icon pack..."
cd "$ROOT"
node tools/generate-previews.js "$ICON_PACK_ID"
mkdir -p "$SD_ICONS"
rm -rf "$SD_ICONS/$ICON_PACK_ID"
cp -r "$ROOT/$ICON_PACK_ID" "$SD_ICONS/"
echo "  ✓ Icon pack installed (with preview)"

# 6. Regenerate profile (use game-specific generator if it exists)
echo "[6/8] Regenerating profile..."
cd "$ROOT"
PROFILE_GEN="tools/generate-profile-${GAME}.py"
if [ ! -f "$PROFILE_GEN" ]; then
    PROFILE_GEN="tools/generate-profile.py"
fi
python3 "$PROFILE_GEN" 2>&1 | grep -E "^(Profile|Installed|  )"
echo "  ✓ Profile generated and installed"

# 7. Validate profile against manifest
echo "[7/8] Validating profile UUIDs against manifest..."
if python3 tools/validate-profile.py 2>&1 | tail -1 | grep -q "PASSED"; then
    echo "  ✓ All UUIDs valid"
else
    echo ""
    python3 tools/validate-profile.py
    echo ""
    echo "  ✗ VALIDATION FAILED — fix UUID mismatches before restarting Stream Deck"
    exit 1
fi

# 8. Summary
echo ""
echo "=== Deploy Complete (8/8) ==="
echo "Restart Stream Deck to apply changes."
echo ""
