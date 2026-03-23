"""
Preflight checks for Stream Deck sim racing projects.
Run before making changes to catch issues early.
Run after changes to verify everything is consistent.

Usage: python tools/preflight.py [--game lmu]

Checks:
  1. All plugin manifest action UUIDs have matching TypeScript action files
  2. All TypeScript actions have matching SVG icon files
  3. All icon pack SVGs match plugin SVGs (not stale)
  4. All BINDINGS keys in generate-profile.py match manifest UUIDs
  5. All actions have defaultHotkey set in TypeScript source
  6. Installed plugin matches source (not stale)
  7. Installed profile matches generated profile (not stale)
  8. Game keyboard config has all required bindings
"""

import argparse
import json
import os
import re
import sys
import filecmp

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES_DIR = os.path.join(ROOT, "tools", "games")


def load_game_config(game_id):
    """Load game config from tools/games/{game_id}.json."""
    config_path = os.path.join(GAMES_DIR, f"{game_id}.json")
    if not os.path.isfile(config_path):
        print(f"ERROR: No game config found at {config_path}")
        print(f"Available games: {list_available_games()}")
        sys.exit(1)
    with open(config_path, encoding="utf-8") as f:
        return json.load(f)


def list_available_games():
    """List game IDs that have config files in tools/games/."""
    if not os.path.isdir(GAMES_DIR):
        return []
    return [f.replace(".json", "") for f in os.listdir(GAMES_DIR) if f.endswith(".json")]


def detect_game():
    """Auto-detect game by checking which game plugins are installed."""
    sd_base = os.path.join(os.environ.get("APPDATA", ""), "Elgato", "StreamDeck")
    sd_plugins = os.path.join(sd_base, "Plugins")

    for game_id in list_available_games():
        config = load_game_config(game_id)
        plugin_dir = os.path.join(sd_plugins, config["plugin_id"])
        if os.path.isdir(plugin_dir):
            return game_id

    # Fall back to first available game config
    available = list_available_games()
    if available:
        return available[0]
    return None


errors = 0
warnings = 0


def ok(msg):
    print(f"  \u2713 {msg}")

def err(msg):
    global errors
    errors += 1
    print(f"  \u2717 {msg}")

def warn(msg):
    global warnings
    warnings += 1
    print(f"  \u26a0 {msg}")


def check_manifest_actions(config):
    """1. All manifest actions have matching TS files and SVGs."""
    print("\n[1] Manifest actions \u2192 TypeScript + SVG files")

    plugin_id = config["plugin_id"]
    plugin_prefix = plugin_id.replace(".sdPlugin", ".")

    sdplugin_dir = os.path.join(ROOT, "plugin", plugin_id)
    manifest_path = os.path.join(sdplugin_dir, "manifest.json")
    actions_src = os.path.join(ROOT, "plugin", "src", "actions")
    actions_imgs = os.path.join(sdplugin_dir, "imgs", "actions")

    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)

    for action in manifest["Actions"]:
        uuid = action["UUID"]
        suffix = uuid.replace(plugin_prefix, "")
        icon_ref = action.get("Icon", "").split("/")[-1]

        # Check TS file exists (try common name patterns)
        ts_candidates = [
            os.path.join(actions_src, f"{suffix}.ts"),
            os.path.join(actions_src, f"{icon_ref}.ts"),
        ]
        ts_found = any(os.path.isfile(p) for p in ts_candidates)
        if not ts_found:
            err(f"{uuid}: no TypeScript file found (tried {suffix}.ts, {icon_ref}.ts)")
        else:
            ok(f"{uuid}: TS source exists")

        # Check SVG exists
        svg_path = os.path.join(actions_imgs, f"{icon_ref}.svg")
        if not os.path.isfile(svg_path):
            err(f"{uuid}: missing SVG at imgs/actions/{icon_ref}.svg")
        else:
            ok(f"{uuid}: SVG icon exists")


def check_icon_pack_sync(config):
    """2. Icon pack SVGs match plugin SVGs."""
    print("\n[2] Icon pack \u2194 plugin SVG sync")

    plugin_id = config["plugin_id"]
    icon_pack_id = config["icon_pack_id"]

    sdplugin_dir = os.path.join(ROOT, "plugin", plugin_id)
    plugin_icons = os.path.join(sdplugin_dir, "imgs", "actions")
    pack_icons = os.path.join(ROOT, icon_pack_id, "icons")

    if not os.path.isdir(pack_icons):
        err("Icon pack icons/ directory missing")
        return

    for svg in os.listdir(plugin_icons):
        if not svg.endswith(".svg"):
            continue
        plugin_svg = os.path.join(plugin_icons, svg)
        pack_svg = os.path.join(pack_icons, svg)
        if not os.path.isfile(pack_svg):
            warn(f"{svg}: in plugin but not in icon pack")
        elif not filecmp.cmp(plugin_svg, pack_svg, shallow=False):
            warn(f"{svg}: plugin and icon pack versions differ (stale)")
        else:
            ok(f"{svg}: in sync")


def check_profile_bindings(config):
    """3. BINDINGS keys in generate-profile.py match manifest UUIDs."""
    print("\n[3] Profile generator BINDINGS \u2192 manifest UUIDs")

    plugin_id = config["plugin_id"]
    plugin_prefix = plugin_id.replace(".sdPlugin", ".")

    sdplugin_dir = os.path.join(ROOT, "plugin", plugin_id)
    manifest_path = os.path.join(sdplugin_dir, "manifest.json")
    profile_gen = os.path.join(ROOT, "tools", "generate-profile.py")

    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)
    manifest_suffixes = {
        a["UUID"].replace(plugin_prefix, "")
        for a in manifest["Actions"]
    }

    with open(profile_gen, encoding="utf-8") as f:
        gen_source = f.read()

    # Extract BINDINGS keys
    bindings_match = re.findall(r'"([a-z\-]+)":\s*\{.*?"key":', gen_source)
    for key in bindings_match:
        if key in manifest_suffixes:
            ok(f'BINDINGS["{key}"] matches manifest UUID')
        else:
            err(f'BINDINGS["{key}"] has NO matching manifest UUID! '
                f"Available: {sorted(manifest_suffixes)}")


def check_hotkeys_in_source(config):
    """4. All TS action files have defaultHotkey set."""
    print("\n[4] TypeScript actions have defaultHotkey")

    actions_src = os.path.join(ROOT, "plugin", "src", "actions")

    for ts_file in sorted(os.listdir(actions_src)):
        if not ts_file.endswith(".ts") or ts_file in ("hotkey-action.ts", "send-key.ts"):
            continue
        path = os.path.join(actions_src, ts_file)
        with open(path, encoding="utf-8") as f:
            content = f.read()
        match = re.search(r'defaultHotkey\s*=\s*"([^"]*)"', content)
        if match and match.group(1):
            ok(f"{ts_file}: defaultHotkey = \"{match.group(1)}\"")
        else:
            err(f"{ts_file}: defaultHotkey is missing or empty")


def check_installed_freshness(config):
    """5. Installed plugin/profile match source."""
    print("\n[5] Installed files freshness")

    plugin_id = config["plugin_id"]
    profile_uuid = config["profile_uuid"]

    sdplugin_dir = os.path.join(ROOT, "plugin", plugin_id)
    manifest_path = os.path.join(sdplugin_dir, "manifest.json")
    profile_dir = os.path.join(ROOT, "profile", f"{profile_uuid}.sdProfile")

    sd_base = os.path.join(os.environ.get("APPDATA", ""), "Elgato", "StreamDeck")
    sd_plugin_installed = os.path.join(sd_base, "Plugins", plugin_id)
    sd_profile_installed = os.path.join(sd_base, "ProfilesV3", f"{profile_uuid}.sdProfile")

    # Check plugin manifest
    installed_manifest = os.path.join(sd_plugin_installed, "manifest.json")
    if os.path.isfile(installed_manifest):
        if filecmp.cmp(manifest_path, installed_manifest, shallow=False):
            ok("Installed plugin manifest matches source")
        else:
            warn("Installed plugin manifest is STALE \u2014 run deploy.sh")
    else:
        warn("Plugin not installed")

    # Check profile manifest
    src_profile_manifest = os.path.join(profile_dir, "manifest.json")
    installed_profile_manifest = os.path.join(sd_profile_installed, "manifest.json")
    if os.path.isfile(src_profile_manifest) and os.path.isfile(installed_profile_manifest):
        if filecmp.cmp(src_profile_manifest, installed_profile_manifest, shallow=False):
            ok("Installed profile manifest matches generated")
        else:
            warn("Installed profile is STALE \u2014 run deploy.sh")
    elif not os.path.isfile(src_profile_manifest):
        warn("Profile not generated yet \u2014 run generate-profile.py")
    else:
        warn("Profile not installed")


def check_game_keybinds(config):
    """6. Game keyboard config has all required bindings."""
    game_name = config["name"]
    print(f"\n[6] {game_name} keyboard bindings")

    keybind_config = config.get("keybind_config")
    if not keybind_config:
        warn(f"No keybind_config defined for {game_name} \u2014 skipping keybind check")
        return

    kb_path = keybind_config["path"]
    key_field = keybind_config["key_field"]

    if not os.path.isfile(kb_path):
        warn(f"{game_name} keyboard config not found at {kb_path}")
        return

    with open(kb_path, encoding="utf-8") as f:
        kb = json.load(f)
    inputs = kb.get(key_field, {})

    bindings = config.get("bindings", {})
    for action_id, binding in bindings.items():
        lmu_action = binding["lmu_action"]
        expected_scan = binding["scan"]

        if lmu_action in inputs:
            if inputs[lmu_action] == expected_scan:
                ok(f"{lmu_action}: scan {expected_scan}")
            else:
                warn(f"{lmu_action}: scan {inputs[lmu_action]} (expected {expected_scan})")
        else:
            err(f"{lmu_action}: NOT BOUND in {game_name} \u2014 run setup-keybinds.py --game {config['id']}")


def main():
    parser = argparse.ArgumentParser(description="Stream Deck Preflight Checks")
    parser.add_argument("--game", type=str, default=None,
                        help="Game ID (e.g. lmu). Auto-detects if not specified.")
    args = parser.parse_args()

    game_id = args.game
    if not game_id:
        game_id = detect_game()
    if not game_id:
        print("ERROR: No game configs found in tools/games/")
        sys.exit(1)

    config = load_game_config(game_id)
    game_name = config["name"]

    print(f"=== Stream Deck Preflight Checks [{game_name}] ===")

    check_manifest_actions(config)
    check_icon_pack_sync(config)
    check_profile_bindings(config)
    check_hotkeys_in_source(config)
    check_installed_freshness(config)
    check_game_keybinds(config)

    print("\n" + "=" * 50)
    if errors:
        print(f"FAILED: {errors} error(s), {warnings} warning(s)")
        print("Fix errors before deploying.")
        sys.exit(1)
    elif warnings:
        print(f"PASSED with {warnings} warning(s)")
        print(f"Run 'bash tools/deploy.sh {config['id']}' to fix stale installs.")
    else:
        print("ALL CHECKS PASSED")

    sys.exit(0)


if __name__ == "__main__":
    main()
