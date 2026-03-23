"""
Add keyboard bindings to a sim racing game for all Stream Deck actions.

Loads the binding configuration from tools/games/{game-id}.json and applies
the required keyboard bindings to the game's keyboard config file.

Usage: python tools/setup-keybinds.py [--game lmu]
"""

import argparse
import json
import os
import shutil
import sys

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES_DIR = os.path.join(ROOT, "tools", "games")

# Key name -> DirectInput scan code mapping
KEY_TO_SCAN = {
    "A": 30, "B": 48, "C": 46, "D": 32, "E": 18, "F": 33,
    "G": 34, "H": 35, "I": 23, "J": 36, "K": 37, "L": 38,
    "M": 50, "N": 49, "O": 24, "P": 25, "Q": 16, "R": 19,
    "S": 31, "T": 20, "U": 22, "V": 47, "W": 17, "X": 45,
    "Y": 21, "Z": 44,
    "Up": 200, "Down": 208, "Left": 203, "Right": 205,
    "RShift": 54, "LShift": 42, "RCtrl": 157, "LCtrl": 29,
}


def load_game_config(game_id):
    """Load game config from tools/games/{game_id}.json."""
    config_path = os.path.join(GAMES_DIR, f"{game_id}.json")
    if not os.path.isfile(config_path):
        print(f"ERROR: No game config found at {config_path}")
        available = [f.replace(".json", "") for f in os.listdir(GAMES_DIR) if f.endswith(".json")]
        print(f"Available games: {available}")
        sys.exit(1)
    with open(config_path, encoding="utf-8") as f:
        return json.load(f)


def detect_game():
    """Return first available game ID, defaulting to lmu."""
    if os.path.isfile(os.path.join(GAMES_DIR, "lmu.json")):
        return "lmu"
    available = [f.replace(".json", "") for f in os.listdir(GAMES_DIR) if f.endswith(".json")]
    return available[0] if available else None


def main():
    parser = argparse.ArgumentParser(description="Setup game keyboard bindings for Stream Deck actions")
    parser.add_argument("--game", type=str, default=None,
                        help="Game ID (e.g. lmu). Defaults to lmu.")
    args = parser.parse_args()

    game_id = args.game or detect_game()
    if not game_id:
        print("ERROR: No game configs found in tools/games/")
        sys.exit(1)

    config = load_game_config(game_id)
    game_name = config["name"]
    keybind_config = config.get("keybind_config")

    if not keybind_config:
        print(f"ERROR: No keybind_config defined for {game_name}")
        sys.exit(1)

    kb_path = keybind_config["path"]
    key_field = keybind_config["key_field"]
    bindings = config.get("bindings", {})

    if not os.path.isfile(kb_path):
        print(f"ERROR: keyboard config not found at {kb_path}")
        print(f"Make sure {game_name} is installed.")
        sys.exit(1)

    # Read current keyboard config
    with open(kb_path, encoding="utf-8") as f:
        kb_config = json.load(f)

    inputs = kb_config.get(key_field, {})

    # Backup
    backup_path = kb_path + ".backup"
    if not os.path.exists(backup_path):
        shutil.copy2(kb_path, backup_path)
        print(f"Backup saved to: {backup_path}")

    # Add missing bindings
    added = 0
    skipped = 0
    already = 0

    print()
    print(f"{'Action':<35} {'Key':<10} {'Scan':<8} {'Status'}")
    print("-" * 70)

    for action_id, binding in bindings.items():
        lmu_action = binding["lmu_action"]
        key = binding["key"]
        scan = binding["scan"]

        if lmu_action in inputs:
            current_scan = inputs[lmu_action]
            if current_scan == scan:
                print(f"{lmu_action:<35} {key:<10} {scan:<8} already set")
                already += 1
            else:
                current_key = next((k for k, v in KEY_TO_SCAN.items() if v == current_scan), f"scan:{current_scan}")
                print(f"{lmu_action:<35} {key:<10} {scan:<8} SKIPPED (currently: {current_key})")
                skipped += 1
        else:
            inputs[lmu_action] = scan
            print(f"{lmu_action:<35} {key:<10} {scan:<8} ADDED")
            added += 1

    # Write updated config
    kb_config[key_field] = dict(sorted(inputs.items()))
    with open(kb_path, "w", encoding="utf-8") as f:
        json.dump(kb_config, f, indent=2, ensure_ascii=False)

    print()
    print(f"Done: {added} added, {already} already set, {skipped} skipped (different key)")
    print(f"Updated: {kb_path}")

    if added > 0:
        print()
        print(f"IMPORTANT: Restart {game_name} for the new keyboard bindings to take effect.")
        print(f"You can verify in {game_name}: Settings > Controls > Keyboard")


if __name__ == "__main__":
    main()
