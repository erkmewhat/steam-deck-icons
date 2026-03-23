"""
Generate a Stream Deck profile for Assetto Corsa EVO.
4-page layout: Car Systems, Adjustments, Camera & Display, Race & Replay.

Grid: 5 columns x 3 rows, coordinates are (col, row) zero-indexed.
"""

import hashlib
import json
import os
import shutil
import subprocess
import uuid

# NOTE: UUIDs MUST be lowercase — Stream Deck uses lowercase internally
PROFILE_UUID = "d7e4f2a8-91b3-4c6d-a5e7-8f2b1c3d4e5a"
DEVICE_MODEL = "20GBA9901"
DEVICE_UUID = "@(1)[4057/128/A00SA3272JF6DK]"

MAIN_PAGE    = "b9c8d7e6-f5a4-4321-8765-1a2b3c4d5e6f"
ADJUST_PAGE  = "e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b"
CAMERA_PAGE  = "a1b2c3d4-e5f6-4789-abcd-ef0123456789"
RACE_PAGE    = "f1e2d3c4-b5a6-4978-8765-432109876543"

# Load bindings from game config
_config_path = os.path.join(os.path.dirname(__file__), "games", "ace.json")
with open(_config_path, encoding="utf-8") as _f:
    _config = json.load(_f)
BINDINGS = {}
for slug, b in _config["bindings"].items():
    BINDINGS[slug] = {"key": b["key"], "title": b["game_action"], "game_action": b["game_action"]}


# Collects (svg_path, png_filename) per page UUID for deferred PNG conversion.
_page_icons = {}
_current_page = None

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ICON_PACK_DIR = os.path.join(SCRIPT_DIR, "..", "com.simracing.ace-icons.sdIconPack", "icons")


def _generate_image_key(action_id):
    """Generate a short hash-based filename like Stream Deck uses."""
    h = hashlib.sha256(action_id.encode()).hexdigest()[:26].upper()
    return f"{h}.png"


def set_current_page(page_uuid):
    """Set which page is currently being built (icons register to this page)."""
    global _current_page
    _current_page = page_uuid
    if page_uuid not in _page_icons:
        _page_icons[page_uuid] = []


def icon_to_image_ref(action_id):
    """Find the SVG for action_id and return an Images/HASH.png reference.

    Registers the icon for PNG conversion into the current page's Images/ dir.
    """
    path = os.path.join(ICON_PACK_DIR, f"{action_id}.svg")
    if os.path.isfile(path):
        png_name = _generate_image_key(action_id)
        if _current_page:
            _page_icons[_current_page].append((os.path.abspath(path), png_name))
        return f"Images/{png_name}"
    return ""


def convert_all_page_icons(profiles_dir):
    """Convert all registered SVGs to 72x72 PNGs in each page's Images/ dir."""
    converter = os.path.join(SCRIPT_DIR, "svg-to-png.js")
    total = 0

    for page_uuid, icons in _page_icons.items():
        if not icons:
            continue
        images_dir = os.path.join(profiles_dir, page_uuid, "Images")
        os.makedirs(images_dir, exist_ok=True)
        seen = set()
        for svg_path, png_name in icons:
            if png_name in seen:
                continue
            seen.add(png_name)
            png_path = os.path.join(images_dir, png_name)
            subprocess.run(
                ["node", converter, svg_path, png_path, "72"],
                check=True, capture_output=True
            )
        total += len(seen)
    print(f"  Converted {total} icons to 72x72 PNG across {len(_page_icons)} pages")


# Windows scan codes, VKey codes, Qt key codes for hotkey actions
VKEYS = {
    "A": 65, "B": 66, "C": 67, "D": 68, "E": 69, "F": 70, "G": 71, "H": 72,
    "I": 73, "J": 74, "K": 75, "L": 76, "M": 77, "N": 78, "O": 79, "P": 80,
    "Q": 81, "R": 82, "S": 83, "T": 84, "U": 85, "V": 86, "W": 87, "X": 88,
    "Y": 89, "Z": 90, "F12": 123, "F5": 116, "F9": 120,
    "Up": 38, "Down": 40, "Left": 37, "Right": 39,
}
SCAN_CODES = {
    "A": 30, "B": 48, "C": 46, "D": 32, "E": 18, "F": 33, "G": 34, "H": 35,
    "I": 23, "J": 36, "K": 37, "L": 38, "M": 50, "N": 49, "O": 24, "P": 25,
    "Q": 16, "R": 19, "S": 31, "T": 20, "U": 22, "V": 47, "W": 17, "X": 45,
    "Y": 21, "Z": 44, "F12": 88, "F5": 63, "F9": 67,
    "Up": 328, "Down": 336, "Left": 331, "Right": 333,
}
QT_KEYS = {
    "Up": 16777235, "Down": 16777237, "Left": 16777234, "Right": 16777236,
    "F12": 16777275, "F5": 16777268, "F9": 16777272,
}
EMPTY_SLOT = {"KeyCmd": False, "KeyCtrl": False, "KeyModifiers": 0,
              "KeyOption": False, "KeyShift": False,
              "NativeCode": 146, "QTKeyCode": 33554431, "VKeyCode": -1}


def make_hotkey_action(title, key, icon_id=""):
    """Create a built-in hotkey action with icon from icon pack."""
    image = icon_to_image_ref(icon_id) if icon_id else ""
    vk = VKEYS.get(key, ord(key) if len(key) == 1 else 0)
    sc = SCAN_CODES.get(key, 0)
    qt = QT_KEYS.get(key, ord(key) if len(key) == 1 else 0)
    return {
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": "Hotkey",
        "Resources": None,
        "Settings": {
            "Coalesce": True,
            "Hotkeys": [
                {"KeyCmd": False, "KeyCtrl": False, "KeyModifiers": 0,
                 "KeyOption": False, "KeyShift": False,
                 "NativeCode": sc, "QTKeyCode": qt, "VKeyCode": vk},
                EMPTY_SLOT.copy(), EMPTY_SLOT.copy(), EMPTY_SLOT.copy()
            ]
        },
        "State": 0,
        "States": [{"Image": image}] if image else [{}],
        "UUID": "com.elgato.streamdeck.system.hotkey"
    }


def make_folder_button(title, target_page_uuid, title_color="#00BFFF"):
    return {
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": "Create Folder",
        "Plugin": {"Name": "Create Folder", "UUID": "com.elgato.streamdeck.profile.openchild", "Version": "1.0"},
        "Resources": None,
        "Settings": {"ProfileUUID": target_page_uuid},
        "State": 0,
        "States": [{}],
        "UUID": "com.elgato.streamdeck.profile.openchild"
    }


def make_back_button():
    return {
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": "Parent Folder",
        "Plugin": {"Name": "Parent Folder", "UUID": "com.elgato.streamdeck.profile.backtoparent", "Version": "1.0"},
        "Resources": None,
        "Settings": {},
        "State": 0,
        "States": [{}],
        "UUID": "com.elgato.streamdeck.profile.backtoparent"
    }


def make_page(actions_dict, name=""):
    return {"Controllers": [{"Actions": actions_dict, "Type": "Keypad"}], "Icon": "", "Name": name}


def _a(slug):
    b = BINDINGS[slug]
    return make_hotkey_action(b["title"], b["key"], icon_id=slug)


def build_main_page():
    """
    Page 1: Car Systems (11 actions + 3 nav folders)
    (0,0) Headlights  (1,0) Flash       (2,0) Rain Light  (3,0) Wipers+     (4,0) → Adjust
    (0,1) Ignition    (1,1) Starter     (2,1) Pit Limit   (3,1) Wipers-     (4,1) → Camera
    (0,2) Horn        (1,2) DRS         (2,2) KERS        (3,2)             (4,2) → Race
    """
    return make_page({
        "0,0": _a("headlights"),    "1,0": _a("flash-lights"),  "2,0": _a("rain-lights"),
        "3,0": _a("wipers-up"),     "4,0": make_folder_button("Adjust\n\u25b6", ADJUST_PAGE, "#FFD700"),
        "0,1": _a("ignition"),      "1,1": _a("starter"),       "2,1": _a("pit-limiter"),
        "3,1": _a("wipers-down"),   "4,1": make_folder_button("Camera\n\u25b6", CAMERA_PAGE, "#4a9eff"),
        "0,2": _a("horn"),          "1,2": _a("drs"),           "2,2": _a("kers"),
                                     "4,2": make_folder_button("Race\n\u25b6", RACE_PAGE, "#e20613"),
    }, "ACE Car Systems")


def build_adjust_page():
    """
    Page 2: Adjustments (8 actions + back)
    (0,0) BB Front   (1,0) TC+         (2,0) ABS+        (3,0) Engine+     (4,0)
    (0,1) BB Rear    (1,1) TC-         (2,1) ABS-        (3,1) Engine-     (4,1)
    (0,2) ← Back     (1,2)             (2,2)             (3,2)             (4,2)
    """
    return make_page({
        "0,0": _a("bb-front"),      "1,0": _a("tc-increase"),   "2,0": _a("abs-increase"),
        "3,0": _a("engine-map-up"),
        "0,1": _a("bb-rear"),       "1,1": _a("tc-decrease"),   "2,1": _a("abs-decrease"),
        "3,1": _a("engine-map-down"),
        "0,2": make_back_button(),
    }, "ACE Adjustments")


def build_camera_page():
    """
    Page 3: Camera & Display (11 actions + back)
    (0,0) Glance L   (1,0) Look Back   (2,0) Glance R    (3,0) Free Cam    (4,0) Track Cam
    (0,1) Chase Cam  (1,1) V.Mirror    (2,1) HUD         (3,1) Leaderboard (4,1) Damage
    (0,2) ← Back     (1,2) Ideal Line  (2,2)             (3,2)             (4,2)
    """
    return make_page({
        "0,0": _a("glance-left"),   "1,0": _a("look-behind"),   "2,0": _a("glance-right"),
        "3,0": _a("free-camera"),   "4,0": _a("track-camera"),
        "0,1": _a("chase-camera"),  "1,1": _a("virtual-mirror"),"2,1": _a("hud-toggle"),
        "3,1": _a("leaderboard"),   "4,1": _a("damage-display"),
        "0,2": make_back_button(),  "1,2": _a("ideal-line"),
    }, "ACE Camera & Display")


def build_race_page():
    """
    Page 4: Race & Replay (11 actions + back)
    (0,0) AI Drive   (1,0) Pit Req     (2,0) Restart     (3,0) Pause       (4,0) Screenshot
    (0,1) Replay     (1,1) Slow Mo     (2,1) Fast Fwd    (3,1) Rewind      (4,1)
    (0,2) ← Back     (1,2) Next Car    (2,2) Prev Car    (3,2)             (4,2)
    """
    return make_page({
        "0,0": _a("ai-takeover"),   "1,0": _a("pit-request"),   "2,0": _a("restart-session"),
        "3,0": _a("pause"),         "4,0": _a("screenshot"),
        "0,1": _a("replay"),        "1,1": _a("slow-motion"),   "2,1": _a("fast-forward"),
        "3,1": _a("rewind"),
        "0,2": make_back_button(),  "1,2": _a("next-car"),      "2,2": _a("prev-car"),
    }, "ACE Race & Replay")


def write_profile(output_dir):
    profile_dir = os.path.join(output_dir, f"{PROFILE_UUID}.sdProfile")
    if os.path.exists(profile_dir):
        shutil.rmtree(profile_dir)

    profiles_dir = os.path.join(profile_dir, "Profiles")
    for page_uuid in [MAIN_PAGE, ADJUST_PAGE, CAMERA_PAGE, RACE_PAGE]:
        os.makedirs(os.path.join(profiles_dir, page_uuid), exist_ok=True)

    manifest = {
        "Version": "3.0",
        "Name": "ACE Sim Racing",
        "Device": {"Model": DEVICE_MODEL, "UUID": DEVICE_UUID},
        "Pages": {"Default": MAIN_PAGE, "Current": MAIN_PAGE, "Pages": [MAIN_PAGE]}
    }

    with open(os.path.join(profile_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    # Build each page (set_current_page registers icons per page)
    pages = [
        (MAIN_PAGE,   build_main_page),
        (ADJUST_PAGE, build_adjust_page),
        (CAMERA_PAGE, build_camera_page),
        (RACE_PAGE,   build_race_page),
    ]
    for page_uuid, builder in pages:
        set_current_page(page_uuid)
        page_data = builder()
        with open(os.path.join(profiles_dir, page_uuid, "manifest.json"), "w") as f:
            json.dump(page_data, f, indent=2)

    # Convert SVGs to 72x72 PNGs in each page's Images/ subdirectory
    convert_all_page_icons(profiles_dir)

    print(f"Profile generated at: {profile_dir}")
    print(f"  Main page:   {MAIN_PAGE}")
    print(f"  Adjust page: {ADJUST_PAGE}")
    print(f"  Camera page: {CAMERA_PAGE}")
    print(f"  Race page:   {RACE_PAGE}")
    return profile_dir


def install_profile(profile_dir):
    sd_profiles = os.path.join(os.environ["APPDATA"], "Elgato", "StreamDeck", "ProfilesV3")
    dest = os.path.join(sd_profiles, os.path.basename(profile_dir))
    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.copytree(profile_dir, dest)
    print(f"Installed to: {dest}")


if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "profile")
    os.makedirs(output_dir, exist_ok=True)
    profile_dir = write_profile(output_dir)
    install_profile(profile_dir)
