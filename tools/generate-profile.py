"""
Generate a Stream Deck profile for LMU Sim Racing.

Creates the full profile directory structure with:
- Main page: Car Systems + Camera + navigation folders
- MFD page: D-pad layout for pit menu / MFD navigation
- Performance page: Brake bias, TC, ABS, Motor Map adjustments
- Camera page: Camera views + seat adjustments + FOV/zoom
- HUD page: HUD toggles, replay, screenshot, restart, launch control

Grid: 5 columns x 3 rows, coordinates are (col, row) zero-indexed.
"""

import base64
import hashlib
import json
import os
import shutil
import subprocess
import uuid

# ── Profile / page UUIDs ──────────────────────────────────────────────
# NOTE: UUIDs MUST be lowercase — Stream Deck uses lowercase internally
# and will strip folder actions whose ProfileUUID doesn't match.
PROFILE_UUID   = "ebaab49c-eff9-4a7f-9c43-ffce95c09427"
MAIN_PAGE      = "c8b1a5b1-c375-469c-b4c1-7ba9b2426cb1"
MFD_PAGE       = "c68f250f-93f5-41f9-b888-d9dd28d9df3e"
PERF_PAGE      = "3aa706b4-3603-4898-b84a-e320a619c8f7"
CAMERA_PAGE    = "a1f2b3c4-d5e6-4789-abcd-100000000001"
HUD_PAGE       = "a1f2b3c4-d5e6-4789-abcd-100000000002"
LOOK_PAGE      = "a1f2b3c4-d5e6-4789-abcd-100000000003"
TELEMETRY_PAGE = "a1f2b3c4-d5e6-4789-abcd-200000000001"

DEVICE_MODEL = "20GBA9901"
DEVICE_UUID  = "@(1)[4057/128/A00SA3272JF6DK]"

# ── Stream Deck hotkey format helpers ─────────────────────────────────
EMPTY_SLOT = {"KeyCmd": False, "KeyCtrl": False, "KeyModifiers": 0,
              "KeyOption": False, "KeyShift": False,
              "NativeCode": 146, "QTKeyCode": 33554431, "VKeyCode": -1}

# Windows VKey codes
VKEYS = {
    "I": 73, "L": 76, "H": 72, "E": 69, "B": 66, "S": 83, "D": 68,
    "G": 71, "P": 80, "N": 78, "M": 77, "T": 84, "X": 88, "V": 86,
    "O": 79, "K": 75, "U": 85, "J": 74, "Q": 81, "W": 87,
    "R": 82, "Y": 89,
    "Up": 38, "Down": 40, "Left": 37, "Right": 39,
    "Enter": 13, "RShift": 161, "RCtrl": 163,
    "Home": 36, "End": 35, "Insert": 45, "Delete": 46,
    "PageUp": 33, "PageDown": 34,
    "F1": 112, "F2": 113, "F3": 114, "F4": 115, "F5": 116,
    "F6": 117, "F7": 118, "F8": 119, "F9": 120, "F10": 121,
    "F11": 122, "F12": 123,
    "Num0": 96, "Num1": 97, "Num2": 98, "Num3": 99,
    "Num4": 100, "Num5": 101, "Num6": 102, "Num7": 103,
    "Num8": 104, "Num9": 105,
    "NumAdd": 107, "NumSub": 109,
    "NumMul": 106, "NumDiv": 111,
    "NumDec": 110, "NumEnter": 13,
    ";": 186, "'": 222, "/": 191, "Space": 32,
    "\\": 220, "3": 51, "5": 53, "6": 54,
}

# Qt key codes for special keys (letters use ASCII = same as VKey)
QT_KEYS = {
    "Up": 16777235, "Down": 16777237, "Left": 16777234, "Right": 16777236,
    "Enter": 16777220, "RShift": 16777248, "RCtrl": 16777249,
    "Home": 16777232, "End": 16777233, "Insert": 16777222, "Delete": 16777223,
    "PageUp": 16777238, "PageDown": 16777239,
    "F1": 16777264, "F2": 16777265, "F3": 16777266, "F4": 16777267,
    "F5": 16777268, "F6": 16777269, "F7": 16777270, "F8": 16777271,
    "F9": 16777272, "F10": 16777273, "F11": 16777274, "F12": 16777275,
    "Num0": 48, "Num1": 49, "Num2": 50, "Num3": 51, "Num4": 52,
    "Num5": 53, "Num6": 54, "Num7": 55, "Num8": 56, "Num9": 57,
    "NumAdd": 43, "NumSub": 45, "NumMul": 42, "NumDiv": 47,
    "NumDec": 46, "NumEnter": 16777221,
    ";": 59, "'": 39, "/": 47, "Space": 32,
    "\\": 92,
}

# Windows scan codes (NativeCode in Stream Deck)
SCAN_CODES = {
    "I": 23, "L": 38, "H": 35, "E": 18, "B": 48, "S": 31, "D": 32,
    "G": 34, "P": 25, "N": 49, "M": 50, "T": 20, "X": 45, "V": 47,
    "O": 24, "K": 37, "U": 22, "J": 36, "Q": 16, "W": 17,
    "R": 19, "Y": 21,
    "Up": 328, "Down": 336, "Left": 331, "Right": 333,
    "Enter": 28, "RShift": 54, "RCtrl": 285,
    "Home": 327, "End": 335, "Insert": 338, "Delete": 339,
    "PageUp": 329, "PageDown": 337,
    "F1": 59, "F2": 60, "F3": 61, "F4": 62, "F5": 63,
    "F6": 64, "F7": 65, "F8": 66, "F9": 67, "F10": 68,
    "F11": 87, "F12": 88,
    "Num0": 82, "Num1": 79, "Num2": 80, "Num3": 81,
    "Num4": 75, "Num5": 76, "Num6": 77, "Num7": 71,
    "Num8": 72, "Num9": 73,
    "NumAdd": 78, "NumSub": 74, "NumMul": 55, "NumDiv": 309,
    "NumDec": 83, "NumEnter": 284,
    ";": 39, "'": 40, "/": 53, "Space": 57,
    "\\": 43, "3": 4, "5": 6, "6": 7,
}


def make_hotkey_slot(key, ctrl=False, shift=False, alt=False, win=False):
    """Create a single hotkey slot for Stream Deck."""
    mods = 0
    if win:   mods |= 8
    if shift: mods |= 1
    if ctrl:  mods |= 2
    if alt:   mods |= 4
    vk = VKEYS.get(key, ord(key) if len(key) == 1 else 0)
    qt = QT_KEYS.get(key, ord(key) if len(key) == 1 else 0)
    sc = SCAN_CODES.get(key, 0)
    return {
        "KeyCmd": win, "KeyCtrl": ctrl, "KeyShift": shift, "KeyOption": alt,
        "KeyModifiers": mods,
        "NativeCode": sc, "QTKeyCode": qt, "VKeyCode": vk
    }


def make_hotkey_settings(key, ctrl=False, shift=False, alt=False):
    """Create hotkey settings with one key + 3 empty slots."""
    return {
        "Coalesce": True,
        "Hotkeys": [
            make_hotkey_slot(key, ctrl=ctrl, shift=shift, alt=alt),
            EMPTY_SLOT.copy(), EMPTY_SLOT.copy(), EMPTY_SLOT.copy()
        ]
    }


# Collects (svg_path, png_filename) per page UUID for deferred PNG conversion.
# Key = page UUID, Value = list of (svg_abs_path, png_filename) tuples.
_page_icons = {}
_current_page = None

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ICON_PACK_DIR = os.path.join(SCRIPT_DIR, "..", "com.simracing.lmu-icons.sdIconPack", "icons")
ICON_ALIAS = {
    "brake-bias-forward": "brake-bias-fwd",
    "brake-bias-backward": "brake-bias-bwd",
}


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
    Returns empty string if no SVG found.
    """
    resolved = ICON_ALIAS.get(action_id, action_id)
    candidates = [
        os.path.join(ICON_PACK_DIR, f"{resolved}.svg"),
        os.path.join(ICON_PACK_DIR, f"{action_id}.svg"),
    ]

    for p in candidates:
        if os.path.isfile(p):
            png_name = _generate_image_key(resolved)
            if _current_page:
                _page_icons[_current_page].append((os.path.abspath(p), png_name))
            return f"Images/{png_name}"
    return ""


def convert_all_page_icons(profiles_dir):
    """Convert all registered SVGs to 72x72 PNGs in each page's Images/ dir."""
    converter = os.path.join(SCRIPT_DIR, "svg-to-png.js")
    total = 0

    for page_uuid, icons in _page_icons.items():
        if not icons:
            continue
        images_dir = os.path.join(profiles_dir, page_uuid.upper(), "Images")
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


# Actions that toggle on/off — use plugin UUID so setState() works.
# All others use built-in hotkey UUID.
TOGGLE_ACTIONS = {
    "headlights", "ignition", "pit-limiter", "wipers", "starter",
    "request-pitstop", "ai-takeover", "launch-control",
}
# Note: headlights and wipers are CycleActions (multi-state) but still use
# plugin UUID in the profile so the plugin receives button events.

PLUGIN_UUID = "com.simracing.lmu"


def make_hotkey_action(title, key, ctrl=False, shift=False, alt=False,
                       font_size=10, title_color="#FFFFFF", icon_id=""):
    """Create a built-in hotkey action button with icon from icon pack."""
    image = icon_to_image_ref(icon_id) if icon_id else ""
    return {
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": "Hotkey",
        "Resources": None,
        "Settings": make_hotkey_settings(key, ctrl=ctrl, shift=shift, alt=alt),
        "State": 0,
        "States": [{"Image": image}] if image else [{}],
        "UUID": "com.elgato.streamdeck.system.hotkey"
    }


def make_plugin_toggle_action(title, action_id, hotkey="", icon_id=""):
    """Create a plugin action with 2 states for on/off toggle.

    Uses the custom plugin UUID so the plugin's setState() controls the icon.
    The manifest defines the off/on images; the plugin toggles between them.
    """
    image = icon_to_image_ref(icon_id) if icon_id else ""
    return {
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": title,
        "Plugin": {"Name": "LMU Sim Racing", "UUID": PLUGIN_UUID, "Version": "1.0.0.0"},
        "Resources": None,
        "Settings": {"hotkey": hotkey},
        "State": 0,
        "States": [{"Image": image}],
        "UUID": f"{PLUGIN_UUID}.{action_id}"
    }


def make_plugin_telemetry_action(title, action_id, icon_id=""):
    """Create a telemetry display action (plugin-rendered, no hotkey).

    These actions use the custom plugin UUID so the plugin can call setImage()
    to render live telemetry data via dynamic SVG.
    """
    image = icon_to_image_ref(icon_id) if icon_id else ""
    return {
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": title,
        "Plugin": {"Name": "LMU Sim Racing", "UUID": PLUGIN_UUID, "Version": "1.0.0.0"},
        "Resources": None,
        "Settings": {},
        "State": 0,
        "States": [{"Image": image}] if image else [{}],
        "UUID": f"{PLUGIN_UUID}.{action_id}"
    }


def make_action(action_id):
    """Create the right action type based on whether it's a toggle or not."""
    b = BINDINGS[action_id]
    icon = b.get("icon", action_id)
    if action_id in TOGGLE_ACTIONS:
        return make_plugin_toggle_action(b["title"], action_id, hotkey=b["key"], icon_id=icon)
    else:
        return make_hotkey_action(b["title"], b["key"], icon_id=icon)


def make_folder_button(title, target_page_uuid, title_color="#00BFFF", icon_id=""):
    """Create a folder navigation button (opens child page)."""
    image = icon_to_image_ref(icon_id) if icon_id else ""
    return {
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": "Create Folder",
        "Plugin": {"Name": "Create Folder", "UUID": "com.elgato.streamdeck.profile.openchild", "Version": "1.0"},
        "Resources": None,
        "Settings": {"ProfileUUID": target_page_uuid},
        "State": 0,
        "States": [{"Image": image}] if image else [{}],
        "UUID": "com.elgato.streamdeck.profile.openchild"
    }


def make_back_button():
    """Create a back-to-parent navigation button."""
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
    """Create a page manifest with actions at given coordinates."""
    return {
        "Controllers": [{
            "Actions": actions_dict,
            "Type": "Keypad"
        }],
        "Icon": "",
        "Name": name
    }


# ── Keyboard binding map ──────────────────────────────────────────────
# These are the LMU keyboard.json bindings (scan codes → key names)
# Plus SUGGESTED bindings for actions that only exist on wheel.
#
# Actions with existing keyboard bindings:
#   Toggle AI Control = I
#   Driver Overlay Next MFD = Right Shift
#   Pit Menu Up/Down/Inc/Dec = Arrow keys
#
# Actions with NO keyboard binding (need to be added in LMU):
#   We suggest Numpad keys and Ctrl+combos for these.
#
# The Stream Deck profile will use these keys. The user needs to
# match them in LMU's keyboard settings.

BINDINGS = {
    # ─── Car Systems (Main Page) ───
    # LMU has NO default keyboard bindings for these car system actions.
    # Assignments use unused keys that don't conflict with LMU defaults.
    "pit-limiter":     {"key": "L",  "title": "Pit\nLimiter",    "needs_lmu_bind": True,  "lmu_action": "Speed Limiter"},
    "headlights":      {"key": "H",  "title": "Head\nLights",    "needs_lmu_bind": True,  "lmu_action": "Headlights"},
    "headlight-flash": {"key": "G",  "title": "Flash",           "needs_lmu_bind": True,  "lmu_action": "Headlights Pulse", "icon": "headlight-flash-on"},
    "wipers":          {"key": "P",  "title": "Wipers",          "needs_lmu_bind": True,  "lmu_action": "Wipers"},
    "ignition":        {"key": "N",  "title": "Ignition",        "needs_lmu_bind": True,  "lmu_action": "Ignition"},
    "starter":         {"key": "M",  "title": "Starter",         "needs_lmu_bind": True,  "lmu_action": "Starter"},
    "request-pitstop": {"key": "E",  "title": "Req\nPit",        "needs_lmu_bind": True,  "lmu_action": "Request Pit Stop"},
    "ai-takeover":     {"key": "I",  "title": "AI\nTakeover",    "needs_lmu_bind": False, "lmu_action": "Toggle AI Control"},

    # ─── MFD / Pit Menu (all have LMU defaults) ───
    "mfd-next":     {"key": "RShift", "title": "MFD\nNext",    "needs_lmu_bind": False, "lmu_action": "Driver Overlay Next MFD"},
    "mfd-up":       {"key": "Up",     "title": "\u25b2",            "needs_lmu_bind": False, "lmu_action": "Pit Menu Up"},
    "mfd-down":     {"key": "Down",   "title": "\u25bc",            "needs_lmu_bind": False, "lmu_action": "Pit Menu Down"},
    "mfd-increase": {"key": "Right",  "title": "\u25b6",            "needs_lmu_bind": False, "lmu_action": "Pit Menu Inc"},
    "mfd-decrease": {"key": "Left",   "title": "\u25c0",            "needs_lmu_bind": False, "lmu_action": "Pit Menu Dec"},

    # ─── Performance (none have LMU defaults) ───
    "brake-bias-forward": {"key": "X",  "title": "BB\nFwd",      "needs_lmu_bind": True, "lmu_action": "Bias Forward"},
    "brake-bias-backward": {"key": "V",  "title": "BB\nBwd",      "needs_lmu_bind": True, "lmu_action": "Bias Rearward"},
    "tc-increase":    {"key": "T",  "title": "TC\n+",         "needs_lmu_bind": True, "lmu_action": "Traction Control Up"},
    "tc-decrease":    {"key": "B",  "title": "TC\n\u2212",         "needs_lmu_bind": True, "lmu_action": "Traction Control Down"},
    "abs-increase":   {"key": "O",  "title": "ABS\n+",        "needs_lmu_bind": True, "lmu_action": "Antilock Brake System Up"},
    "abs-decrease":   {"key": "K",  "title": "ABS\n\u2212",        "needs_lmu_bind": True, "lmu_action": "Antilock Brake System Down"},
    "motor-map-up":   {"key": "U",  "title": "Motor\n+",      "needs_lmu_bind": True, "lmu_action": "Increment Motor Map"},
    "motor-map-down": {"key": "J",  "title": "Motor\n\u2212",      "needs_lmu_bind": True, "lmu_action": "Decrement Motor Map"},

    # ─── Camera / Look (none have LMU defaults) ───
    "look-left":   {"key": "D", "title": "Look\nLeft",   "needs_lmu_bind": True, "lmu_action": "Look Left"},
    "look-right":  {"key": "Q", "title": "Look\nRight",  "needs_lmu_bind": True, "lmu_action": "Look Right"},
    "look-behind": {"key": "W", "title": "Look\nBehind", "needs_lmu_bind": True, "lmu_action": "Look Behind"},

    # ─── Camera Controls (Camera Page) ───
    "driving-cameras":  {"key": "Insert",   "title": "Cockpit",     "needs_lmu_bind": False, "lmu_action": "Driving Cameras"},
    "onboard-cameras":  {"key": "Home",     "title": "Onboard",     "needs_lmu_bind": False, "lmu_action": "Onboard Cameras"},
    "swingman-camera":  {"key": "PageUp",   "title": "TV Cam",      "needs_lmu_bind": False, "lmu_action": "Swingman Camera"},
    "spectator-camera": {"key": "PageDown", "title": "Spectate",    "needs_lmu_bind": False, "lmu_action": "Spectator Cameras"},
    "tracking-camera":  {"key": "Delete",   "title": "Tracking",    "needs_lmu_bind": False, "lmu_action": "Tracking Cameras"},

    # ─── Seat Adjustments (Camera Page) ───
    "seat-forward":  {"key": "Num8", "title": "Seat\nFwd",  "needs_lmu_bind": False, "lmu_action": "Adjust Seat Fore"},
    "seat-back":     {"key": "Num2", "title": "Seat\nBack", "needs_lmu_bind": False, "lmu_action": "Adjust Seat Aft"},
    "seat-up":       {"key": "Num4", "title": "Seat\nUp",   "needs_lmu_bind": False, "lmu_action": "Adjust Seat Up"},
    "seat-down":     {"key": "Num6", "title": "Seat\nDown", "needs_lmu_bind": False, "lmu_action": "Adjust Seat Down"},
    "fov-increase":  {"key": "Num9", "title": "FOV +",      "needs_lmu_bind": False, "lmu_action": "Increase Vertical FOV"},
    "fov-decrease":  {"key": "Num7", "title": "FOV -",      "needs_lmu_bind": False, "lmu_action": "Decrease Vertical FOV"},
    "zoom-in":       {"key": "Num3", "title": "Zoom\nIn",   "needs_lmu_bind": False, "lmu_action": "Camera Zoom In"},
    "zoom-out":      {"key": "Num1", "title": "Zoom\nOut",  "needs_lmu_bind": False, "lmu_action": "Camera Zoom Out"},

    # ─── HUD / Display (HUD Page) ───
    "toggle-hud":    {"key": "6",     "title": "HUD",        "needs_lmu_bind": False, "lmu_action": "Driver Overlay Toggle HUD"},
    "prev-mfd":      {"key": "RCtrl", "title": "MFD\nPrev",  "needs_lmu_bind": False, "lmu_action": "Driver Overlay Previous MFD"},
    "toggle-mirror": {"key": "3",     "title": "Mirror",     "needs_lmu_bind": False, "lmu_action": "Toggle Mirror"},
    "track-map":     {"key": "5",     "title": "Track\nMap", "needs_lmu_bind": False, "lmu_action": "Driver Overlay Cycle Track Map"},

    # ─── Other (HUD Page) ───
    "instant-replay": {"key": "R",    "title": "Replay",      "needs_lmu_bind": False, "lmu_action": "Instant Replay"},
    "screenshot":     {"key": "F12",  "title": "Screenshot",  "needs_lmu_bind": False, "lmu_action": "Screenshot"},
    "restart-race":   {"key": "Y",    "title": "Restart",     "needs_lmu_bind": False, "lmu_action": "Restart Race"},
    "launch-control": {"key": "\\",   "title": "Launch\nCtrl","needs_lmu_bind": False, "lmu_action": "Launch Control"},
}


def build_main_page():
    """
    Main page layout (col, row):
    (0,0) Pit Limiter   (1,0) Headlights   (2,0) Flash         (3,0) Wipers        (4,0) Launch Ctrl
    (0,1) Ignition      (1,1) Starter       (2,1) Req Pit       (3,1) AI Takeover   (4,1) [empty]
    (0,2) → MFD         (1,2) → Adjust      (2,2) → Camera      (3,2) → Look        (4,2) → HUD

    Row 2 = navigation bar to all sub-pages.
    """
    actions = {}

    # Row 0: Car systems
    row0 = [
        ("0,0", "pit-limiter"),
        ("1,0", "headlights"),
        ("2,0", "headlight-flash"),
        ("3,0", "wipers"),
        ("4,0", "launch-control"),
    ]
    for coord, action_id in row0:
        b = BINDINGS[action_id]
        actions[coord] = make_action(action_id)

    # Row 1: Engine & pit
    row1 = [
        ("0,1", "ignition"),
        ("1,1", "starter"),
        ("2,1", "request-pitstop"),
        ("3,1", "ai-takeover"),
    ]
    for coord, action_id in row1:
        b = BINDINGS[action_id]
        actions[coord] = make_action(action_id)

    # Row 1 col 4: Telemetry nav (was empty)
    actions["4,1"] = make_folder_button("Telem\n▶", TELEMETRY_PAGE, title_color="#00cc66", icon_id="nav-telemetry")

    # Row 2: Navigation bar — one folder per sub-page (with nav icons)
    actions["0,2"] = make_folder_button("MFD\n▶", MFD_PAGE, title_color="#00BFFF", icon_id="nav-mfd")
    actions["1,2"] = make_folder_button("Adjust\n▶", PERF_PAGE, title_color="#FFD700", icon_id="nav-adjust")
    actions["2,2"] = make_folder_button("Camera\n▶", CAMERA_PAGE, title_color="#00B4D8", icon_id="nav-camera")
    actions["3,2"] = make_folder_button("Look\n▶", LOOK_PAGE, title_color="#00B4D8", icon_id="nav-look")
    actions["4,2"] = make_folder_button("HUD\n▶", HUD_PAGE, title_color="#4a9eff", icon_id="nav-hud")

    return make_page(actions, "LMU Main")


def build_mfd_page():
    """
    MFD page layout (D-pad):
    (0,0)               (1,0)               (2,0) MFD Up        (3,0)               (4,0)
    (0,1)               (1,1) MFD Dec       (2,1) MFD Next      (3,1) MFD Inc       (4,1)
    (0,2) <- Back        (1,2)               (2,2) MFD Down      (3,2)               (4,2)
    """
    actions = {}

    mfd = [
        ("2,0", "mfd-up"),
        ("1,1", "mfd-decrease"),
        ("2,1", "mfd-next"),
        ("3,1", "mfd-increase"),
        ("2,2", "mfd-down"),
    ]
    for coord, action_id in mfd:
        b = BINDINGS[action_id]
        actions[coord] = make_action(action_id)

    actions["0,2"] = make_back_button()

    return make_page(actions, "MFD Controls")


def build_perf_page():
    """
    Performance page layout:
    (0,0) BB Fwd        (1,0) TC +          (2,0) ABS +         (3,0) Motor +       (4,0)
    (0,1) BB Bwd        (1,1) TC -          (2,1) ABS -         (3,1) Motor -       (4,1)
    (0,2) <- Back        (1,2)               (2,2)               (3,2)               (4,2)
    """
    actions = {}

    # Row 0: increase row
    inc = [
        ("0,0", "brake-bias-forward"),
        ("1,0", "tc-increase"),
        ("2,0", "abs-increase"),
        ("3,0", "motor-map-up"),
    ]
    for coord, action_id in inc:
        b = BINDINGS[action_id]
        actions[coord] = make_action(action_id)

    # Row 1: decrease row
    dec = [
        ("0,1", "brake-bias-backward"),
        ("1,1", "tc-decrease"),
        ("2,1", "abs-decrease"),
        ("3,1", "motor-map-down"),
    ]
    for coord, action_id in dec:
        b = BINDINGS[action_id]
        actions[coord] = make_action(action_id)

    actions["0,2"] = make_back_button()

    return make_page(actions, "Performance")


def build_camera_page():
    """
    Camera & Seat page layout:
    (0,0) Cockpit Cam   (1,0) Onboard      (2,0) TV Cam        (3,0) Spectate      (4,0) Tracking
    (0,1) Seat Fwd      (1,1) Seat Back     (2,1) Seat Up       (3,1) Seat Down     (4,1) [empty]
    (0,2) <- Back        (1,2) FOV +         (2,2) FOV -         (3,2) Zoom In       (4,2) Zoom Out
    """
    actions = {}

    # Row 0: Camera views
    cameras = [
        ("0,0", "driving-cameras"),
        ("1,0", "onboard-cameras"),
        ("2,0", "swingman-camera"),
        ("3,0", "spectator-camera"),
        ("4,0", "tracking-camera"),
    ]
    for coord, action_id in cameras:
        b = BINDINGS[action_id]
        actions[coord] = make_action(action_id)

    # Row 1: Seat adjustments
    seats = [
        ("0,1", "seat-forward"),
        ("1,1", "seat-back"),
        ("2,1", "seat-up"),
        ("3,1", "seat-down"),
    ]
    for coord, action_id in seats:
        b = BINDINGS[action_id]
        actions[coord] = make_action(action_id)

    # Row 2: Back + FOV/Zoom
    actions["0,2"] = make_back_button()

    fov_zoom = [
        ("1,2", "fov-increase"),
        ("2,2", "fov-decrease"),
        ("3,2", "zoom-in"),
        ("4,2", "zoom-out"),
    ]
    for coord, action_id in fov_zoom:
        b = BINDINGS[action_id]
        actions[coord] = make_action(action_id)

    return make_page(actions, "Camera & Seat")


def build_look_page():
    """
    Look & Glance page layout:
    (0,0) Look Left     (1,0) Look Behind   (2,0) Look Right    (3,0)               (4,0)
    (0,1) Replay        (1,1) Screenshot     (2,1) Restart       (3,1)               (4,1)
    (0,2) ← Back        (1,2)               (2,2)               (3,2)               (4,2)
    """
    actions = {}

    # Row 0: Look directions
    look = [
        ("0,0", "look-left"),
        ("1,0", "look-behind"),
        ("2,0", "look-right"),
    ]
    for coord, action_id in look:
        b = BINDINGS[action_id]
        actions[coord] = make_action(action_id)

    # Row 1: Session utilities
    session = [
        ("0,1", "instant-replay"),
        ("1,1", "screenshot"),
        ("2,1", "restart-race"),
    ]
    for coord, action_id in session:
        b = BINDINGS[action_id]
        actions[coord] = make_action(action_id)

    actions["0,2"] = make_back_button()

    return make_page(actions, "Look & Session")


def build_hud_page():
    """
    HUD & Display page layout:
    (0,0) Toggle HUD    (1,0) MFD Prev     (2,0) MFD Next      (3,0) Mirror        (4,0) Track Map
    (0,1)               (1,1)              (2,1)               (3,1)               (4,1)
    (0,2) ← Back        (1,2)              (2,2)               (3,2)               (4,2)
    """
    actions = {}

    # Row 0: HUD/Display toggles
    hud = [
        ("0,0", "toggle-hud"),
        ("1,0", "prev-mfd"),
        ("2,0", "mfd-next"),
        ("3,0", "toggle-mirror"),
        ("4,0", "track-map"),
    ]
    for coord, action_id in hud:
        b = BINDINGS[action_id]
        actions[coord] = make_action(action_id)

    # Row 2: Back
    actions["0,2"] = make_back_button()

    return make_page(actions, "HUD & Display")


def build_telemetry_page():
    """
    Telemetry page layout (live data from rF2 shared memory):
    (0,0) RPM1         (1,0) RPM2         (2,0) RPM3         (3,0) RPM4         (4,0) RPM5
    (0,1) Flag         (1,1) Tire FL      (2,1) Tire FR      (3,1) Fuel         (4,1) Fuel Calc
    (0,2) <- Back      (1,2) Tire RL      (2,2) Tire RR      (3,2) Position     (4,2) Lap Delta

    Row 0: RPM bar — light blue → dark blue → yellow → orange → red, all flash red at 98%+
    Row 1-2: Tires in car layout (FL/FR, RL/RR), fuel, flag, position, delta
    Battery and pit state moved off this page.
    """
    actions = {}

    # Row 0: RPM bar segments
    for i in range(5):
        actions[f"{i},0"] = make_plugin_telemetry_action(f"RPM{i+1}", f"rpm-seg{i+1}")

    # Row 1: Flag + front tires + fuel
    actions["0,1"] = make_plugin_telemetry_action("Flag", "flag-display")
    actions["1,1"] = make_plugin_telemetry_action("FL", "tire-fl")
    actions["2,1"] = make_plugin_telemetry_action("FR", "tire-fr")
    actions["3,1"] = make_plugin_telemetry_action("Fuel", "fuel-display")
    actions["4,1"] = make_plugin_telemetry_action("Fuel\nCalc", "fuel-calc")

    # Row 2: Back + rear tires + position + delta
    actions["0,2"] = make_back_button()
    actions["1,2"] = make_plugin_telemetry_action("RL", "tire-rl")
    actions["2,2"] = make_plugin_telemetry_action("RR", "tire-rr")
    actions["3,2"] = make_plugin_telemetry_action("Position", "position-display")
    actions["4,2"] = make_plugin_telemetry_action("Lap\nDelta", "lap-delta")

    return make_page(actions, "Telemetry")


def write_profile(output_dir):
    """Write the complete profile directory structure."""
    # Directory names use UPPERCASE UUIDs, JSON content uses lowercase
    profile_dir = os.path.join(output_dir, f"{PROFILE_UUID.upper()}.sdProfile")

    # Clean previous
    if os.path.exists(profile_dir):
        shutil.rmtree(profile_dir)

    profiles_dir = os.path.join(profile_dir, "Profiles")

    # Create page directories (uppercase dir names)
    for page_uuid in [MAIN_PAGE, MFD_PAGE, PERF_PAGE, CAMERA_PAGE, LOOK_PAGE, HUD_PAGE, TELEMETRY_PAGE]:
        os.makedirs(os.path.join(profiles_dir, page_uuid.upper()), exist_ok=True)

    # Top-level profile manifest
    profile_manifest = {
        "Version": "3.0",
        "Name": "LMU Sim Racing",
        "Device": {
            "Model": DEVICE_MODEL,
            "UUID": DEVICE_UUID
        },
        "Pages": {
            "Default": MAIN_PAGE,
            "Current": MAIN_PAGE,
            "Pages": [MAIN_PAGE]
        }
    }

    with open(os.path.join(profile_dir, "manifest.json"), "w") as f:
        json.dump(profile_manifest, f, indent=2)

    # Build each page (set_current_page registers icons per page)
    pages = [
        (MAIN_PAGE,   build_main_page),
        (MFD_PAGE,    build_mfd_page),
        (PERF_PAGE,   build_perf_page),
        (CAMERA_PAGE, build_camera_page),
        (LOOK_PAGE,   build_look_page),
        (HUD_PAGE,    build_hud_page),
        (TELEMETRY_PAGE, build_telemetry_page),
    ]
    for page_uuid, builder in pages:
        set_current_page(page_uuid)
        page_data = builder()
        with open(os.path.join(profiles_dir, page_uuid.upper(), "manifest.json"), "w") as f:
            json.dump(page_data, f, indent=2)

    # Convert SVGs to 72x72 PNGs in each page's Images/ subdirectory
    convert_all_page_icons(profiles_dir)

    print(f"Profile generated at: {profile_dir}")
    print(f"  Main page:   {MAIN_PAGE}")
    print(f"  MFD page:    {MFD_PAGE}")
    print(f"  Perf page:   {PERF_PAGE}")
    print(f"  Camera page: {CAMERA_PAGE}")
    print(f"  Look page:   {LOOK_PAGE}")
    print(f"  HUD page:    {HUD_PAGE}")
    print(f"  Telem page:  {TELEMETRY_PAGE}")

    # Print all keybinding assignments
    print("\n" + "=" * 70)
    print("KEYBINDING ASSIGNMENTS")
    print("=" * 70)
    print(f"{'Action':<25} {'Key':<12} {'LMU Action Name':<30} {'Source'}")
    print("-" * 70)
    for action_id, b in BINDINGS.items():
        key_desc = b["key"]
        source = "LMU default" if not b["needs_lmu_bind"] else "ASSIGN IN LMU"
        lmu_name = b.get("lmu_action", "")
        print(f"{action_id:<25} {key_desc:<12} {lmu_name:<30} {source}")

    return profile_dir


def install_profile(profile_dir):
    """Copy profile to Stream Deck profiles directory."""
    sd_profiles = os.path.join(
        os.environ["APPDATA"], "Elgato", "StreamDeck", "ProfilesV3"
    )
    dest = os.path.join(sd_profiles, os.path.basename(profile_dir))

    if os.path.exists(dest):
        shutil.rmtree(dest)

    shutil.copytree(profile_dir, dest)
    print(f"\nInstalled to: {dest}")
    print("Restart Stream Deck to load the profile.")


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "profile")
    os.makedirs(output_dir, exist_ok=True)

    profile_dir = write_profile(output_dir)

    # Auto-install
    install_profile(profile_dir)
