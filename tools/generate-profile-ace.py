"""
Generate a Stream Deck profile for Assetto Corsa EVO.
4-page layout: Car Systems, Adjustments, Camera & Display, Race & Replay.

Grid: 5 columns x 3 rows, coordinates are (col, row) zero-indexed.
"""

import base64
import json
import os
import shutil
import uuid

PROFILE_UUID = "D7E4F2A8-91B3-4C6D-A5E7-8F2B1C3D4E5A"
DEVICE_MODEL = "20GBA9901"
DEVICE_UUID = "@(1)[4057/128/A00SA3272JF6DK]"
PLUGIN_UUID = "com.simracing.ace"

MAIN_PAGE    = "B9C8D7E6-F5A4-4321-8765-1A2B3C4D5E6F"
ADJUST_PAGE  = "E3F4A5B6-C7D8-4E9F-0A1B-2C3D4E5F6A7B"
CAMERA_PAGE  = "A1B2C3D4-E5F6-4789-ABCD-EF0123456789"
RACE_PAGE    = "F1E2D3C4-B5A6-4978-8765-432109876543"

# Load bindings from game config
_config_path = os.path.join(os.path.dirname(__file__), "games", "ace.json")
with open(_config_path, encoding="utf-8") as _f:
    _config = json.load(_f)
BINDINGS = {}
for slug, b in _config["bindings"].items():
    BINDINGS[slug] = {"key": b["key"], "title": b["game_action"], "game_action": b["game_action"]}


def icon_to_base64(action_id):
    """Read icon SVG and return base64 data URI."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icon_pack = os.path.join(script_dir, "..", "com.simracing.ace-icons.sdIconPack", "icons")
    path = os.path.join(icon_pack, f"{action_id}.svg")
    if os.path.isfile(path):
        with open(path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("ascii")
        return f"data:image/svg+xml;base64,{encoded}"
    return ""


def make_plugin_action(title, action_uuid, hotkey="", font_size=10):
    image = icon_to_base64(action_uuid)
    show_title = not bool(image)
    return {
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": title,
        "Plugin": {"Name": "Assetto Corsa EVO", "UUID": PLUGIN_UUID, "Version": "1.0"},
        "Resources": None,
        "Settings": {"hotkey": hotkey} if hotkey else {},
        "State": 0,
        "States": [{
            "FontFamily": "", "FontSize": font_size, "FontStyle": "Bold",
            "FontUnderline": False, "Image": image, "OutlineThickness": 2,
            "ShowTitle": show_title, "Title": title if show_title else "",
            "TitleAlignment": "bottom", "TitleColor": "#FFFFFF"
        }],
        "UUID": f"{PLUGIN_UUID}.{action_uuid}"
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
        "States": [{
            "FontFamily": "", "FontSize": 11, "FontStyle": "Bold",
            "FontUnderline": False, "Image": "", "OutlineThickness": 2,
            "ShowTitle": True, "Title": title, "TitleAlignment": "middle",
            "TitleColor": title_color
        }],
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
        "States": [{
            "FontFamily": "", "FontSize": 12, "FontStyle": "Bold",
            "FontUnderline": False, "Image": "", "OutlineThickness": 2,
            "ShowTitle": True, "Title": "\u2190 Back", "TitleAlignment": "middle",
            "TitleColor": "#FF6B6B"
        }],
        "UUID": "com.elgato.streamdeck.profile.backtoparent"
    }


def make_page(actions_dict, name=""):
    return {"Controllers": [{"Actions": actions_dict, "Type": "Keypad"}], "Icon": "", "Name": name}


def _a(slug):
    b = BINDINGS[slug]
    return make_plugin_action(b["title"], slug, hotkey=b["key"])


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

    pages = [
        (MAIN_PAGE, build_main_page()),
        (ADJUST_PAGE, build_adjust_page()),
        (CAMERA_PAGE, build_camera_page()),
        (RACE_PAGE, build_race_page()),
    ]
    for page_uuid, page_data in pages:
        with open(os.path.join(profiles_dir, page_uuid, "manifest.json"), "w") as f:
            json.dump(page_data, f, indent=2)

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
