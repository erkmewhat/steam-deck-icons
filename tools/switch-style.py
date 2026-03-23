"""
Switch the active icon style for a game's Stream Deck icons.

Copies icons from a style directory to the active actions directory,
then runs sync-icons to update the icon pack and profile.

Usage:
  python tools/switch-style.py --game ace --style neon
  python tools/switch-style.py --game ace --style glass
  python tools/switch-style.py --game ace --style carbon
  python tools/switch-style.py --game ace --list    (show available styles)

Styles are stored in: plugin/{plugin-id}/imgs/styles/{style-name}/
Active icons live in: plugin/{plugin-id}/imgs/actions/
"""

import argparse
import json
import os
import shutil
import sys
import subprocess

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    parser = argparse.ArgumentParser(description="Switch Stream Deck icon style")
    parser.add_argument("--game", type=str, required=True)
    parser.add_argument("--style", type=str, help="Style name (neon, glass, carbon)")
    parser.add_argument("--list", action="store_true", help="List available styles")
    parser.add_argument("--deploy", action="store_true", help="Auto-deploy after switching")
    args = parser.parse_args()

    config_path = os.path.join(ROOT, "tools", "games", f"{args.game}.json")
    with open(config_path, encoding="utf-8") as f:
        config = json.load(f)

    plugin_id = config["plugin_id"]
    styles_dir = os.path.join(ROOT, "plugin", plugin_id, "imgs", "styles")
    actions_dir = os.path.join(ROOT, "plugin", plugin_id, "imgs", "actions")

    # List available styles
    available = []
    if os.path.isdir(styles_dir):
        for d in sorted(os.listdir(styles_dir)):
            style_path = os.path.join(styles_dir, d)
            if os.path.isdir(style_path):
                count = len([f for f in os.listdir(style_path) if f.endswith(".svg")])
                available.append((d, count))

    if args.list or not args.style:
        print(f"Available styles for {config['name']}:")
        for name, count in available:
            print(f"  {name}: {count} icons")
        if not available:
            print("  (none — create styles in plugin/{plugin-id}/imgs/styles/)")
        # Show current
        current_file = os.path.join(styles_dir, ".current")
        if os.path.isfile(current_file):
            with open(current_file) as f:
                print(f"\nCurrent style: {f.read().strip()}")
        return

    style_name = args.style
    style_path = os.path.join(styles_dir, style_name)

    if not os.path.isdir(style_path):
        print(f"ERROR: Style '{style_name}' not found at {style_path}")
        print(f"Available: {[n for n, _ in available]}")
        sys.exit(1)

    style_icons = [f for f in os.listdir(style_path) if f.endswith(".svg")]
    if not style_icons:
        print(f"ERROR: No SVG files in {style_path}")
        sys.exit(1)

    # Copy style icons to actions directory
    copied = 0
    for svg in style_icons:
        src = os.path.join(style_path, svg)
        dst = os.path.join(actions_dir, svg)
        shutil.copy2(src, dst)
        copied += 1

    # Save current style
    current_file = os.path.join(styles_dir, ".current")
    with open(current_file, "w") as f:
        f.write(style_name)

    print(f"Switched to '{style_name}' style: {copied} icons copied")

    if args.deploy:
        print("\nRunning deploy...")
        subprocess.run(["bash", os.path.join(ROOT, "tools", "deploy.sh"), args.game],
                       cwd=ROOT)
    else:
        print(f"\nRun to apply: bash tools/deploy.sh {args.game}")


if __name__ == "__main__":
    main()
