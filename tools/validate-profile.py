"""
Validate that all profile action UUIDs match the plugin manifest.
Run after generate-profile.py to catch mismatches before deploying.

Usage: python tools/validate-profile.py
"""

import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

PROFILE_DIR = os.path.join(os.path.dirname(__file__), "..", "profile",
    "EBAAB49C-EFF9-4A7F-9C43-FFCE95C09427.sdProfile")
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..",
    "plugin", "com.simracing.lmu.sdPlugin", "manifest.json")


def main():
    # Load manifest action UUIDs
    with open(MANIFEST_PATH, encoding="utf-8") as f:
        manifest = json.load(f)
    valid_uuids = {a["UUID"] for a in manifest["Actions"]}

    # Built-in SD action UUIDs (navigation, hotkey, etc.)
    builtin_prefixes = ("com.elgato.streamdeck.",)

    errors = 0
    checked = 0
    pages_dir = os.path.join(PROFILE_DIR, "Profiles")

    for page_dir in sorted(os.listdir(pages_dir)):
        manifest_path = os.path.join(pages_dir, page_dir, "manifest.json")
        if not os.path.isfile(manifest_path):
            continue

        with open(manifest_path, encoding="utf-8") as f:
            page = json.load(f)

        controllers = page.get("Controllers", [])
        if not controllers:
            continue

        actions = controllers[0].get("Actions", {})
        page_name = page.get("Name", page_dir)

        for coord, action in sorted(actions.items()):
            uuid = action.get("UUID", "")
            title = action["States"][0].get("Title", "?").replace("\n", " ")
            checked += 1

            # Skip built-in actions
            if any(uuid.startswith(p) for p in builtin_prefixes):
                continue

            if uuid not in valid_uuids:
                print(f"  ERROR: {page_name} [{coord}] '{title}' -> {uuid}")
                print(f"         UUID not found in plugin manifest!")
                errors += 1
            else:
                # Also check hotkey is set
                hotkey = action.get("Settings", {}).get("hotkey", "")
                status = f"hotkey={hotkey}" if hotkey else "NO HOTKEY"
                print(f"  OK:    {page_name} [{coord}] '{title}' -> {uuid} ({status})")

    print()
    if errors:
        print(f"FAILED: {errors} UUID mismatch(es) found in {checked} buttons")
        sys.exit(1)
    else:
        print(f"PASSED: All {checked} buttons validated against manifest")


if __name__ == "__main__":
    main()
