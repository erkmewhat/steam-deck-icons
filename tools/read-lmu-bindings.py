#!/usr/bin/env python3
"""
read-lmu-bindings.py — Read and display LMU (Le Mans Ultimate) key/wheel bindings.

Parses keyboard.json and direct input.json from the LMU UserData folder and
displays a formatted table of all bindings grouped by category. Highlights
actions relevant to the Stream Deck plugin that lack keyboard bindings.
"""

import json
import os
import sys
import argparse
from pathlib import Path

# ---------------------------------------------------------------------------
# DirectInput scan-code -> human-readable key name
# ---------------------------------------------------------------------------
SCANCODE_MAP = {
    1: "Esc", 2: "1", 3: "2", 4: "3", 5: "4", 6: "5", 7: "6", 8: "7",
    9: "8", 10: "9", 11: "0", 12: "-", 13: "=", 14: "Backspace", 15: "Tab",
    16: "Q", 17: "W", 18: "E", 19: "R", 20: "T", 21: "Y", 22: "U", 23: "I",
    24: "O", 25: "P", 26: "[", 27: "]", 28: "Enter", 29: "Left Ctrl",
    30: "A", 31: "S", 32: "D", 33: "F", 34: "G", 35: "H", 36: "J", 37: "K",
    38: "L", 39: ";", 40: "'", 41: "`", 42: "Left Shift", 43: "\\", 44: "Z",
    45: "X", 46: "C", 47: "V", 48: "B", 49: "N", 50: "M", 51: ",", 52: ".",
    53: "/", 54: "Right Shift", 55: "Numpad *", 56: "Left Alt", 57: "Space",
    58: "Caps Lock",
    59: "F1", 60: "F2", 61: "F3", 62: "F4", 63: "F5", 64: "F6", 65: "F7",
    66: "F8", 67: "F9", 68: "F10",
    69: "Num Lock", 70: "Scroll Lock",
    71: "Numpad 7", 72: "Numpad 8", 73: "Numpad 9", 74: "Numpad -",
    75: "Numpad 4", 76: "Numpad 5", 77: "Numpad 6", 78: "Numpad +",
    79: "Numpad 1", 80: "Numpad 2", 81: "Numpad 3", 82: "Numpad 0",
    83: "Numpad .",
    87: "F11", 88: "F12",
    156: "Numpad Enter", 157: "Right Ctrl",
    181: "Numpad /", 183: "Print Screen", 184: "Right Alt",
    197: "Pause",
    199: "Home", 200: "Up Arrow", 201: "Page Up",
    203: "Left Arrow", 205: "Right Arrow",
    207: "End", 208: "Down Arrow", 209: "Page Down",
    210: "Insert", 211: "Delete",
}

# ---------------------------------------------------------------------------
# Categories — ordered list of (category_name, [action_names])
# ---------------------------------------------------------------------------
CATEGORIES = [
    ("Car Systems", [
        "Speed Limiter",
        "Headlights",
        "Headlights Pulse",
        "Wipers",
        "Ignition",
        "Launch Control",
    ]),
    ("MFD / Pit Menu", [
        "Driver Overlay Next MFD",
        "Driver Overlay Previous MFD",
        "Pit Menu Up",
        "Pit Menu Down",
        "Pit Menu Inc",
        "Pit Menu Dec",
        "Driver Overlay Toggle HUD",
        "Driver Overlay Cycle Track Map",
    ]),
    ("Performance", [
        "Bias Forward",
        "Bias Rearward",
        "Traction Control Up",
        "Traction Control Down",
        "Antilock Brake System Up",
        "Antilock Brake System Down",
        "Increment Motor Map",
        "Decrement Motor Map",
    ]),
    ("Camera", [
        "Look Left",
        "Look Right",
        "Look Behind",
        "Driving Cameras",
        "Onboard Cameras",
        "Swingman Camera",
        "Spectator Cameras",
        "Tracking Cameras",
    ]),
]

# Actions the Stream Deck plugin cares about (these NEED keyboard bindings)
STREAM_DECK_ACTIONS = {
    "Speed Limiter",
    "Headlights",
    "Headlights Pulse",
    "Wipers",
    "Ignition",
    "Launch Control",
    "Driver Overlay Next MFD",
    "Driver Overlay Previous MFD",
    "Pit Menu Up",
    "Pit Menu Down",
    "Pit Menu Inc",
    "Pit Menu Dec",
    "Driver Overlay Toggle HUD",
    "Driver Overlay Cycle Track Map",
    "Bias Forward",
    "Bias Rearward",
    "Traction Control Up",
    "Traction Control Down",
    "Antilock Brake System Up",
    "Antilock Brake System Down",
    "Increment Motor Map",
    "Decrement Motor Map",
    "Toggle AI Control",
    "Toggle Mirror",
    "Driving Cameras",
    "Onboard Cameras",
    "Swingman Camera",
    "Spectator Cameras",
    "Tracking Cameras",
}

DEFAULT_LMU_PATH = Path(
    r"C:\Program Files (x86)\Steam\steamapps\common\Le Mans Ultimate"
    r"\UserData\player"
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def resolve_scancode(code):
    """Return human-readable key name for a DirectInput scan code."""
    if code == 0:
        return None
    return SCANCODE_MAP.get(code, f"Scan {code}")


def short_device_name(device_str):
    """Extract a friendly device name from the LMU device identifier."""
    # Format: "FANATEC Wheel:FSDeviceWheelDD-6129E0E91B9A705E"
    if not device_str:
        return device_str
    name = device_str.split(":")[0]
    return name


def format_wheel_binding(binding):
    """Format a wheel/controller binding dict to a readable string."""
    if binding is None:
        return None
    if isinstance(binding, dict):
        device = short_device_name(binding.get("device", ""))
        btn_id = binding.get("id", "?")
        return f"{device} btn {btn_id}"
    return str(binding)


def load_json(filepath):
    """Load a JSON file, returning None if it doesn't exist."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as e:
        print(f"  Warning: could not parse {filepath}: {e}", file=sys.stderr)
        return None


def binding_status(kb, wh):
    """Return a status string describing which bindings exist."""
    has_kb = kb is not None
    has_wh = wh is not None
    if has_kb and has_wh:
        return "KB + Wheel"
    elif has_kb:
        return "KB only"
    elif has_wh:
        return "Wheel only"
    else:
        return "UNBOUND"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Display LMU keybindings in a formatted table."
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=None,
        help="Custom path to LMU UserData/player folder "
             "(default: auto-detect Steam install)",
    )
    args = parser.parse_args()

    # Resolve player data path
    if args.path:
        player_dir = Path(args.path)
    else:
        player_dir = DEFAULT_LMU_PATH

    if not player_dir.is_dir():
        print(f"ERROR: LMU player data folder not found at:\n  {player_dir}")
        print("Pass the correct path as a CLI argument.")
        sys.exit(1)

    print(f"Reading bindings from: {player_dir}\n")

    # Load config files
    kb_data = load_json(player_dir / "keyboard.json")
    di_data = load_json(player_dir / "direct input.json")
    cc_data = load_json(player_dir / "current controls.json")

    if kb_data is None:
        print("WARNING: keyboard.json not found — keyboard column will be empty.")
    if di_data is None:
        print("WARNING: direct input.json not found — wheel column will be empty.")

    # Extract the Input dictionaries
    kb_inputs = kb_data.get("Input", {}) if kb_data else {}
    di_inputs = di_data.get("Input", {}) if di_data else {}
    di_alt_inputs = di_data.get("Alternative Input", {}) if di_data else {}

    # Build unified action set
    all_actions = set(kb_inputs.keys()) | set(di_inputs.keys()) | set(di_alt_inputs.keys())

    # Categorise actions
    categorised = set()
    for _, actions in CATEGORIES:
        categorised.update(actions)

    # Build "Other" category from remaining actions (skip axis-like controls)
    skip_actions = {
        "Brake", "Throttle", "Steer Left", "Steer Right", "Clutch In",
        "Shift Up", "Shift Down", "Alternate Esc", "Pause",
    }
    other_actions = sorted(all_actions - categorised - skip_actions)
    categories_with_other = CATEGORIES + [("Other", other_actions)]

    # Column widths
    col_action = 35
    col_kb = 18
    col_wheel = 30
    col_alt = 30
    col_status = 14

    sep = "-" * (col_action + col_kb + col_wheel + col_alt + col_status + 12)

    def print_row(action, kb, wheel, alt, status):
        print(
            f"  {action:<{col_action}}"
            f" {kb or '':<{col_kb}}"
            f" {wheel or '':<{col_wheel}}"
            f" {alt or '':<{col_alt}}"
            f" {status:<{col_status}}"
        )

    # Print table
    for cat_name, cat_actions in categories_with_other:
        # Check if any action in this category actually exists
        existing = [a for a in cat_actions if a in all_actions or a in categorised]
        if not existing and cat_name != "Other":
            # Still show the category with all its expected actions
            existing = cat_actions

        print(sep)
        print(f"  {cat_name.upper()}")
        print(sep)
        print_row("Action", "Keyboard", "Wheel", "Wheel Alt", "Status")
        print_row("-" * col_action, "-" * col_kb, "-" * col_wheel, "-" * col_alt, "-" * col_status)

        for action in cat_actions:
            # Keyboard binding
            raw_kb = kb_inputs.get(action)
            kb_str = resolve_scancode(raw_kb) if isinstance(raw_kb, int) else None

            # Wheel binding (primary)
            raw_wh = di_inputs.get(action)
            wh_str = format_wheel_binding(raw_wh)

            # Wheel binding (alternative)
            raw_alt = di_alt_inputs.get(action)
            alt_str = format_wheel_binding(raw_alt)

            status = binding_status(kb_str, wh_str or alt_str)
            print_row(action, kb_str, wh_str, alt_str, status)

        print()

    # ---------------------------------------------------------------------------
    # Stream Deck warnings
    # ---------------------------------------------------------------------------
    print("=" * 80)
    print("  STREAM DECK PLUGIN — KEYBOARD BINDING CHECK")
    print("=" * 80)
    print()
    print("  The Stream Deck plugin sends keystrokes to LMU. Actions listed below")
    print("  are relevant to the plugin but have NO keyboard binding in LMU.")
    print("  You must add a keyboard binding in LMU for these to work with Stream Deck.")
    print()

    missing = []
    for action in sorted(STREAM_DECK_ACTIONS):
        raw_kb = kb_inputs.get(action)
        kb_str = resolve_scancode(raw_kb) if isinstance(raw_kb, int) else None
        if kb_str is None:
            wh_str = format_wheel_binding(di_inputs.get(action))
            alt_str = format_wheel_binding(di_alt_inputs.get(action))
            note = ""
            if wh_str or alt_str:
                note = f"  (has wheel binding: {wh_str or alt_str})"
            missing.append((action, note))

    if missing:
        for action, note in missing:
            print(f"  [!] {action}{note}")
        print(f"\n  Total: {len(missing)} action(s) missing keyboard bindings.\n")
    else:
        print("  All Stream Deck actions have keyboard bindings. You're all set!\n")

    # ---------------------------------------------------------------------------
    # Summary stats
    # ---------------------------------------------------------------------------
    total_kb = sum(
        1 for v in kb_inputs.values()
        if isinstance(v, int) and resolve_scancode(v) is not None
    )
    total_wh = len(di_inputs)
    total_alt = len(di_alt_inputs)
    print(f"  Summary: {total_kb} keyboard bindings, {total_wh} wheel bindings, "
          f"{total_alt} alternative wheel bindings")


if __name__ == "__main__":
    main()
