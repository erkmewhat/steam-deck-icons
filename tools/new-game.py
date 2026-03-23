"""
Scaffold a new game for the Stream Deck sim racing project.

Creates:
  1. Game config: tools/games/{game-id}.json
  2. Plugin directory: plugin/{plugin-id}/
  3. Icon pack directory: {icon-pack-id}/
  4. Profile generator: tools/generate-profile-{game-id}.py
  5. TypeScript action files for each action
  6. SVG icon stubs for each action
  7. Plugin manifest with all actions

Usage:
  python tools/new-game.py
  python tools/new-game.py --config path/to/config.json  (non-interactive)

The script will interactively prompt for game details and actions,
or accept a pre-built config JSON.
"""

import argparse
import json
import os
import sys
import uuid as uuid_lib
import shutil

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES_DIR = os.path.join(ROOT, "tools", "games")

# Scan code lookup for key name -> DirectInput scan code
KEY_TO_SCAN = {
    "A": 30, "B": 48, "C": 46, "D": 32, "E": 18, "F": 33,
    "G": 34, "H": 35, "I": 23, "J": 36, "K": 37, "L": 38,
    "M": 50, "N": 49, "O": 24, "P": 25, "Q": 16, "R": 19,
    "S": 31, "T": 20, "U": 22, "V": 47, "W": 17, "X": 45,
    "Y": 21, "Z": 44,
    "0": 11, "1": 2, "2": 3, "3": 4, "4": 5, "5": 6,
    "6": 7, "7": 8, "8": 9, "9": 10,
    "F1": 59, "F2": 60, "F3": 61, "F4": 62, "F5": 63,
    "F6": 64, "F7": 65, "F8": 66, "F9": 67, "F10": 68,
    "F11": 87, "F12": 88,
    "Up": 200, "Down": 208, "Left": 203, "Right": 205,
    "Enter": 28, "Space": 57, "Tab": 15, "Backspace": 14,
    "Esc": 1, "Delete": 211, "Insert": 210,
    "Home": 199, "End": 207, "PageUp": 201, "PageDown": 209,
    "RShift": 54, "LShift": 42, "RCtrl": 157, "LCtrl": 29,
    "RAlt": 184, "LAlt": 56,
    "Num0": 82, "Num1": 79, "Num2": 80, "Num3": 81,
    "Num4": 75, "Num5": 76, "Num6": 77, "Num7": 71,
    "Num8": 72, "Num9": 73, "NumAdd": 78, "NumSub": 74,
    "NumMul": 55, "NumDiv": 181, "NumDec": 83, "NumEnter": 156,
    ";": 39, "'": 40, ",": 51, ".": 52, "/": 53,
    "[": 26, "]": 27, "-": 12, "=": 13,
}

# Stream Deck device models
DEVICES = {
    "standard": {"model": "20GBA9901", "cols": 5, "rows": 3, "buttons": 15},
    "mini":     {"model": "20GBA9902", "cols": 3, "rows": 2, "buttons": 6},
    "xl":       {"model": "20GBA9903", "cols": 8, "rows": 4, "buttons": 32},
    "mk2":      {"model": "20GBA9906", "cols": 5, "rows": 3, "buttons": 15},
    "plus":     {"model": "20GBA9907", "cols": 4, "rows": 2, "buttons": 8},
}


def prompt(msg, default=None):
    """Prompt user for input with optional default."""
    if default:
        val = input(f"  {msg} [{default}]: ").strip()
        return val if val else default
    while True:
        val = input(f"  {msg}: ").strip()
        if val:
            return val
        print("    (required)")


def slugify(name):
    """Convert a name to a URL-safe slug."""
    return name.lower().replace(" ", "-").replace("_", "-")


def collect_actions_interactive():
    """Interactively collect action definitions grouped by category."""
    print("\n--- Define Actions ---")
    print("  Actions are grouped by category (e.g. Car Systems, MFD, Performance).")
    print("  For each action, provide a name, ID slug, and keyboard key.")
    print("  Type 'done' when finished with a category, 'quit' when all categories done.\n")

    categories = {}
    while True:
        cat_name = input("  Category name (or 'quit'): ").strip()
        if cat_name.lower() == "quit":
            break
        if not cat_name:
            continue

        actions = []
        while True:
            action_name = input(f"    Action name in '{cat_name}' (or 'done'): ").strip()
            if action_name.lower() == "done":
                break
            if not action_name:
                continue

            action_slug = slugify(action_name)
            action_slug = input(f"      Action ID [{action_slug}]: ").strip() or action_slug
            key = input(f"      Keyboard key (e.g. L, Up, RShift): ").strip()
            game_action = input(f"      Game action name [{action_name}]: ").strip() or action_name
            has_default = input(f"      Has default keybind in game? [n]: ").strip().lower()
            has_default = has_default in ("y", "yes", "true")

            scan = KEY_TO_SCAN.get(key, 0)
            if not scan and key:
                print(f"      ⚠ Unknown key '{key}' — scan code set to 0, update manually")

            actions.append({
                "name": action_name,
                "slug": action_slug,
                "key": key,
                "scan": scan,
                "game_action": game_action,
                "has_default": has_default,
            })
            print(f"      ✓ Added: {action_name} ({action_slug}) = {key}")

        if actions:
            categories[cat_name] = actions
            print(f"  ✓ Category '{cat_name}': {len(actions)} actions\n")

    return categories


def build_config(game_id, game_name, author, plugin_uuid, categories,
                 device_type, device_uuid, keybind_path, keybind_field):
    """Build the game config JSON structure."""
    plugin_id = f"com.simracing.{game_id}.sdPlugin"
    icon_pack_id = f"com.simracing.{game_id}-icons.sdIconPack"
    profile_uuid = str(uuid_lib.uuid4()).upper()

    device_info = DEVICES.get(device_type, DEVICES["standard"])

    config = {
        "id": game_id,
        "name": game_name,
        "author": author,
        "plugin_id": plugin_id,
        "plugin_uuid": plugin_uuid,
        "icon_pack_id": icon_pack_id,
        "profile_uuid": profile_uuid,
        "device": {
            "model": device_info["model"],
            "uuid": device_uuid,
            "type": device_type,
            "cols": device_info["cols"],
            "rows": device_info["rows"],
        },
        "categories": {},
        "bindings": {},
    }

    if keybind_path:
        config["keybind_config"] = {
            "path": keybind_path,
            "format": "scan_code",
            "key_field": keybind_field or "Input",
        }

    for cat_name, actions in categories.items():
        config["categories"][cat_name] = [a["slug"] for a in actions]
        for a in actions:
            config["bindings"][a["slug"]] = {
                "key": a["key"],
                "scan": a["scan"],
                "game_action": a["game_action"],
                "has_default": a["has_default"],
                "category": cat_name,
            }

    return config


def generate_svg_icon(action_name, slug, color="#4a90d9"):
    """Generate a simple SVG icon for an action."""
    # Abbreviate: take first letter of each word, max 3 chars
    words = action_name.replace("-", " ").replace("_", " ").split()
    abbrev = "".join(w[0].upper() for w in words[:3])

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144" width="144" height="144">
  <rect width="144" height="144" rx="12" fill="#1a1a2e"/>
  <text x="72" y="82" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="44" font-weight="bold" fill="{color}">{abbrev}</text>
  <text x="72" y="128" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="11" font-weight="bold" fill="white" opacity="0.8">{action_name.upper()}</text>
</svg>'''


def generate_ts_action(action_name, slug, plugin_uuid, key):
    """Generate a TypeScript action file."""
    class_name = "".join(w.capitalize() for w in slug.replace("-", " ").split())
    return f'''import {{ action }} from "@elgato/streamdeck";
import {{ HotkeyAction }} from "./hotkey-action";

@action({{ UUID: "{plugin_uuid}.{slug}" }})
export class {class_name} extends HotkeyAction {{
    readonly defaultHotkey = "{key}";
    readonly actionName = "{action_name}";
    readonly iconFile = "{slug}";
}}
'''


def generate_manifest(config):
    """Generate the plugin manifest.json."""
    plugin_uuid = config["plugin_uuid"]
    actions = []

    for slug, binding in config["bindings"].items():
        action_name = binding["game_action"]
        actions.append({
            "UUID": f"{plugin_uuid}.{slug}",
            "Name": action_name,
            "Icon": f"imgs/actions/{slug}",
            "Tooltip": f"{action_name} (Key: {binding['key']})",
            "PropertyInspectorPath": "ui/pi.html",
            "Controllers": ["Keypad"],
            "States": [{
                "Image": f"imgs/actions/{slug}",
                "Name": action_name,
                "ShowTitle": True,
                "TitleAlignment": "bottom",
                "TitleColor": "#FFFFFF"
            }]
        })

    return {
        "$schema": "https://schemas.elgato.com/streamdeck/plugins/manifest.json",
        "Name": config["name"],
        "Version": "1.0.0.0",
        "Author": config["author"],
        "Description": f"Stream Deck hotkey actions for {config['name']}.",
        "Icon": "imgs/plugin-icon",
        "UUID": plugin_uuid,
        "SDKVersion": 2,
        "CodePath": "bin/plugin.js",
        "Category": config["name"],
        "CategoryIcon": "imgs/category-icon",
        "PropertyInspectorPath": "ui/pi.html",
        "Nodejs": {"Version": "20", "Debug": "enabled"},
        "Software": {"MinimumVersion": "6.7"},
        "OS": [{"Platform": "windows", "MinimumVersion": "10"}],
        "Actions": actions,
    }


def generate_plugin_entry(config):
    """Generate the main plugin.ts entry point."""
    plugin_uuid = config["plugin_uuid"]
    imports = []
    registers = []

    for slug in config["bindings"]:
        class_name = "".join(w.capitalize() for w in slug.replace("-", " ").split())
        file_name = slug
        imports.append(f'import {{ {class_name} }} from "./actions/{file_name}";')
        registers.append(f'streamDeck.actions.registerAction(new {class_name}());')

    return f'''import streamDeck, {{ LogLevel }} from "@elgato/streamdeck";
{chr(10).join(imports)}

streamDeck.logger.setLevel(LogLevel.DEBUG);

{chr(10).join(registers)}

streamDeck.connect();
'''


def generate_icon_pack_manifest(config):
    """Generate icon pack manifest.json."""
    return {
        "Name": f"{config['name']} Icons",
        "Version": "1.0.0",
        "Description": f"Icon pack for {config['name']} Stream Deck actions.",
        "Author": config["author"],
        "Icon": "icon.svg",
        "URL": "https://github.com/charlescostello/steam-deck-icons"
    }


def generate_profile_script(config):
    """Generate a game-specific profile generator script."""
    game_id = config["id"]
    game_name = config["name"]
    profile_uuid = config["profile_uuid"]
    device = config["device"]
    plugin_uuid = config["plugin_uuid"]

    # Build BINDINGS dict source
    bindings_lines = []
    for slug, b in config["bindings"].items():
        title_parts = b["game_action"].split()
        title = "\\n".join(title_parts[:2]) if len(title_parts) > 1 else title_parts[0]
        bindings_lines.append(
            f'    "{slug}": {{"key": "{b["key"]}", "title": "{title}", '
            f'"game_action": "{b["game_action"]}", '
            f'"has_default": {"True" if b["has_default"] else "False"}}},')

    # Build page layouts based on categories
    categories = config.get("categories", {})
    cat_list = list(categories.items())

    return f'''"""
Generate a Stream Deck profile for {game_name}.
Auto-generated by new-game.py — customize the page layouts below.

Grid: {device["cols"]} columns x {device["rows"]} rows, coordinates are (col, row) zero-indexed.
"""

import json
import os
import shutil
import uuid

PROFILE_UUID = "{profile_uuid}"
DEVICE_MODEL = "{device["model"]}"
DEVICE_UUID = "{device["uuid"]}"
PLUGIN_UUID = "{plugin_uuid}"

BINDINGS = {{
{chr(10).join(bindings_lines)}
}}


def make_plugin_action(title, action_uuid, hotkey="", font_size=10):
    """Create a plugin action button."""
    return {{
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": title,
        "Plugin": {{
            "Name": "{game_name}",
            "UUID": PLUGIN_UUID,
            "Version": "1.0"
        }},
        "Resources": None,
        "Settings": {{"hotkey": hotkey}} if hotkey else {{}},
        "State": 0,
        "States": [{{
            "FontFamily": "",
            "FontSize": font_size,
            "FontStyle": "Bold",
            "FontUnderline": False,
            "Image": "",
            "OutlineThickness": 2,
            "ShowTitle": True,
            "Title": title,
            "TitleAlignment": "bottom",
            "TitleColor": "#FFFFFF"
        }}],
        "UUID": f"{{PLUGIN_UUID}}.{{action_uuid}}"
    }}


def make_folder_button(title, target_page_uuid, title_color="#00BFFF"):
    return {{
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": "Create Folder",
        "Plugin": {{
            "Name": "Create Folder",
            "UUID": "com.elgato.streamdeck.profile.openchild",
            "Version": "1.0"
        }},
        "Resources": None,
        "Settings": {{"ProfileUUID": target_page_uuid}},
        "State": 0,
        "States": [{{
            "FontFamily": "", "FontSize": 11, "FontStyle": "Bold",
            "FontUnderline": False, "Image": "", "OutlineThickness": 2,
            "ShowTitle": True, "Title": title, "TitleAlignment": "middle",
            "TitleColor": title_color
        }}],
        "UUID": "com.elgato.streamdeck.profile.openchild"
    }}


def make_back_button():
    return {{
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": "Parent Folder",
        "Plugin": {{
            "Name": "Parent Folder",
            "UUID": "com.elgato.streamdeck.profile.backtoparent",
            "Version": "1.0"
        }},
        "Resources": None,
        "Settings": {{}},
        "State": 0,
        "States": [{{
            "FontFamily": "", "FontSize": 12, "FontStyle": "Bold",
            "FontUnderline": False, "Image": "", "OutlineThickness": 2,
            "ShowTitle": True, "Title": "\\u2190 Back", "TitleAlignment": "middle",
            "TitleColor": "#FF6B6B"
        }}],
        "UUID": "com.elgato.streamdeck.profile.backtoparent"
    }}


def make_page(actions_dict, name=""):
    return {{
        "Controllers": [{{"Actions": actions_dict, "Type": "Keypad"}}],
        "Icon": "", "Name": name
    }}


def build_main_page():
    """Build main page — customize this layout for {game_name}."""
    actions = {{}}
    col, row = 0, 0
    max_cols = {device["cols"]}
    max_rows = {device["rows"]}

    for slug, b in BINDINGS.items():
        if col >= max_cols:
            col = 0
            row += 1
        if row >= max_rows:
            break
        actions[f"{{col}},{{row}}"] = make_plugin_action(
            b["title"], slug, hotkey=b["key"])
        col += 1

    return make_page(actions, "{game_name}")


def write_profile(output_dir):
    profile_dir = os.path.join(output_dir, f"{{PROFILE_UUID}}.sdProfile")
    if os.path.exists(profile_dir):
        shutil.rmtree(profile_dir)

    main_page = str(uuid.uuid4()).upper()
    profiles_dir = os.path.join(profile_dir, "Profiles")
    os.makedirs(os.path.join(profiles_dir, main_page), exist_ok=True)

    manifest = {{
        "Version": "3.0",
        "Name": "{game_name}",
        "Device": {{"Model": DEVICE_MODEL, "UUID": DEVICE_UUID}},
        "Pages": {{"Default": main_page, "Current": main_page, "Pages": [main_page]}}
    }}

    with open(os.path.join(profile_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    with open(os.path.join(profiles_dir, main_page, "manifest.json"), "w") as f:
        json.dump(build_main_page(), f, indent=2)

    print(f"Profile generated at: {{profile_dir}}")
    return profile_dir


def install_profile(profile_dir):
    sd_profiles = os.path.join(os.environ["APPDATA"], "Elgato", "StreamDeck", "ProfilesV3")
    dest = os.path.join(sd_profiles, os.path.basename(profile_dir))
    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.copytree(profile_dir, dest)
    print(f"Installed to: {{dest}}")


if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "profile")
    os.makedirs(output_dir, exist_ok=True)
    profile_dir = write_profile(output_dir)
    install_profile(profile_dir)
'''


def scaffold_game(config):
    """Create all files for a new game."""
    game_id = config["id"]
    plugin_id = config["plugin_id"]
    plugin_uuid = config["plugin_uuid"]
    icon_pack_id = config["icon_pack_id"]

    print(f"\n=== Scaffolding: {config['name']} ({game_id}) ===\n")

    # 1. Game config
    os.makedirs(GAMES_DIR, exist_ok=True)
    config_path = os.path.join(GAMES_DIR, f"{game_id}.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=4, ensure_ascii=False)
    print(f"  ✓ Game config: {config_path}")

    # 2. Plugin directory
    sdplugin_dir = os.path.join(ROOT, "plugin", plugin_id)
    for subdir in ["bin/actions", "imgs/actions", "imgs/categories", "node_modules", "ui"]:
        os.makedirs(os.path.join(sdplugin_dir, subdir), exist_ok=True)

    # Plugin manifest
    manifest = generate_manifest(config)
    with open(os.path.join(sdplugin_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=4, ensure_ascii=False)
    print(f"  ✓ Plugin manifest: {plugin_id}/manifest.json")

    # Package.json for ESM
    pkg = {"name": plugin_uuid, "type": "module", "version": "1.0.0"}
    with open(os.path.join(sdplugin_dir, "package.json"), "w") as f:
        json.dump(pkg, f, indent=4)

    # Copy Property Inspector from LMU plugin if it exists
    lmu_pi = os.path.join(ROOT, "plugin", "com.simracing.lmu.sdPlugin", "ui", "pi.html")
    dest_pi = os.path.join(sdplugin_dir, "ui", "pi.html")
    if os.path.isfile(lmu_pi):
        shutil.copy2(lmu_pi, dest_pi)
        print(f"  ✓ Property Inspector copied from LMU")

    # Plugin icon stubs
    for icon_name in ["plugin-icon", "category-icon"]:
        icon_path = os.path.join(sdplugin_dir, "imgs", f"{icon_name}.svg")
        if not os.path.isfile(icon_path):
            abbrev = config["name"][:3].upper()
            with open(icon_path, "w") as f:
                f.write(generate_svg_icon(config["name"], icon_name, "#4a90d9"))
            print(f"  ✓ Icon: imgs/{icon_name}.svg")

    # 3. Action SVGs and TypeScript files
    actions_src = os.path.join(ROOT, "plugin", "src", "actions")
    os.makedirs(actions_src, exist_ok=True)

    # Copy shared base files if they don't exist
    for base_file in ["hotkey-action.ts", "send-key.ts"]:
        dest = os.path.join(actions_src, base_file)
        # These are shared across games, don't overwrite
        if not os.path.isfile(dest):
            print(f"  ⚠ Missing shared file: src/actions/{base_file} — copy from LMU plugin")

    cat_colors = ["#4a90d9", "#ffd700", "#ff4444", "#90ee90", "#ff6b35", "#00bfff"]
    color_idx = 0

    for cat_name, slugs in config.get("categories", {}).items():
        color = cat_colors[color_idx % len(cat_colors)]
        color_idx += 1

        for slug in slugs:
            binding = config["bindings"][slug]

            # SVG icon
            svg_path = os.path.join(sdplugin_dir, "imgs", "actions", f"{slug}.svg")
            if not os.path.isfile(svg_path):
                with open(svg_path, "w") as f:
                    f.write(generate_svg_icon(binding["game_action"], slug, color))

            # TypeScript action
            ts_path = os.path.join(actions_src, f"{slug}.ts")
            if not os.path.isfile(ts_path):
                with open(ts_path, "w") as f:
                    f.write(generate_ts_action(
                        binding["game_action"], slug, plugin_uuid, binding["key"]))

    print(f"  ✓ {len(config['bindings'])} action SVGs + TypeScript files")

    # 4. Plugin entry point
    entry_path = os.path.join(ROOT, "plugin", "src", "plugin.ts")
    # Only write if it doesn't exist or if this is the first game
    with open(entry_path, "w") as f:
        f.write(generate_plugin_entry(config))
    print(f"  ✓ Plugin entry: src/plugin.ts")

    # 5. Icon pack
    icon_pack_dir = os.path.join(ROOT, icon_pack_id)
    os.makedirs(os.path.join(icon_pack_dir, "icons"), exist_ok=True)
    os.makedirs(os.path.join(icon_pack_dir, "previews"), exist_ok=True)

    # Icon pack manifest
    pack_manifest = generate_icon_pack_manifest(config)
    with open(os.path.join(icon_pack_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(pack_manifest, f, indent=4, ensure_ascii=False)

    # Icon pack icon
    pack_icon = os.path.join(icon_pack_dir, "icon.svg")
    if not os.path.isfile(pack_icon):
        with open(pack_icon, "w") as f:
            f.write(generate_svg_icon(config["name"], "icon", "#4a90d9"))

    # Icons.json for icon pack
    icons_json = []
    for slug, binding in config["bindings"].items():
        icons_json.append({
            "path": f"icons/{slug}",
            "name": binding["game_action"],
            "tags": [cat for cat, slugs in config.get("categories", {}).items() if slug in slugs]
        })
    with open(os.path.join(icon_pack_dir, "icons.json"), "w", encoding="utf-8") as f:
        json.dump(icons_json, f, indent=4, ensure_ascii=False)

    # Sync SVGs to icon pack
    for slug in config["bindings"]:
        src = os.path.join(sdplugin_dir, "imgs", "actions", f"{slug}.svg")
        dst = os.path.join(icon_pack_dir, "icons", f"{slug}.svg")
        if os.path.isfile(src):
            shutil.copy2(src, dst)

    print(f"  ✓ Icon pack: {icon_pack_id}/")

    # 6. Profile generator
    profile_script_path = os.path.join(ROOT, "tools", f"generate-profile-{game_id}.py")
    with open(profile_script_path, "w", encoding="utf-8") as f:
        f.write(generate_profile_script(config))
    print(f"  ✓ Profile generator: tools/generate-profile-{game_id}.py")

    # 7. Set as current game
    with open(os.path.join(ROOT, ".current-game"), "w") as f:
        f.write(game_id)

    print(f"\n=== Scaffold Complete ===")
    print(f"  Game config:  tools/games/{game_id}.json")
    print(f"  Plugin:       plugin/{plugin_id}/")
    print(f"  Icon pack:    {icon_pack_id}/")
    print(f"  Profile gen:  tools/generate-profile-{game_id}.py")
    print(f"\nNext steps:")
    print(f"  1. Customize SVG icons in plugin/{plugin_id}/imgs/actions/")
    print(f"  2. Customize page layout in tools/generate-profile-{game_id}.py")
    print(f"  3. Run: bash tools/deploy.sh {game_id}")


def interactive_setup():
    """Walk through game setup interactively."""
    print("=== New Game Setup ===\n")

    game_name = prompt("Game name (e.g. Le Mans Ultimate)")
    game_id = prompt("Game ID (short, lowercase)", slugify(game_name))
    author = prompt("Author", "Charles Costello")
    plugin_uuid = prompt("Plugin UUID", f"com.simracing.{game_id}")

    print("\n--- Stream Deck Device ---")
    print("  Types: standard (5x3), mini (3x2), xl (8x4), mk2 (5x3), plus (4x2)")
    device_type = prompt("Device type", "standard")
    device_uuid = prompt("Device UUID", "@(1)[4057/128/A00SA3272JF6DK]")

    print("\n--- Game Keybind Config (optional) ---")
    keybind_path = input("  Path to game keyboard config (or blank to skip): ").strip()
    keybind_field = ""
    if keybind_path:
        keybind_field = prompt("JSON field containing bindings", "Input")

    categories = collect_actions_interactive()

    if not categories:
        print("\nNo actions defined. Exiting.")
        sys.exit(1)

    config = build_config(game_id, game_name, author, plugin_uuid,
                          categories, device_type, device_uuid,
                          keybind_path, keybind_field)

    print(f"\n  Total: {len(config['bindings'])} actions in {len(categories)} categories")
    confirm = input("\n  Scaffold this game? [Y/n]: ").strip().lower()
    if confirm in ("n", "no"):
        print("Aborted.")
        sys.exit(0)

    scaffold_game(config)


def main():
    parser = argparse.ArgumentParser(description="Scaffold a new Stream Deck game")
    parser.add_argument("--config", type=str, help="Path to pre-built config JSON (skip interactive)")
    args = parser.parse_args()

    if args.config:
        with open(args.config, encoding="utf-8") as f:
            config = json.load(f)
        # Derive fields if not present
        if "plugin_id" not in config:
            config["plugin_id"] = f"com.simracing.{config['id']}.sdPlugin"
        if "icon_pack_id" not in config:
            config["icon_pack_id"] = f"com.simracing.{config['id']}-icons.sdIconPack"
        if "profile_uuid" not in config:
            config["profile_uuid"] = str(uuid_lib.uuid4()).upper()
        if "plugin_uuid" not in config:
            config["plugin_uuid"] = f"com.simracing.{config['id']}"
        scaffold_game(config)
    else:
        interactive_setup()


if __name__ == "__main__":
    main()
