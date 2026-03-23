/**
 * Windows keyboard input via SendInput API using koffi FFI.
 * Uses scan codes so DirectInput games (LMU/rFactor 2) detect the input.
 */
import koffi from "koffi";
// Windows constants
const INPUT_KEYBOARD = 1;
const KEYEVENTF_SCANCODE = 0x0008;
const KEYEVENTF_KEYUP = 0x0002;
const KEYEVENTF_EXTENDEDKEY = 0x0001;
// Define Windows structures
const KEYBDINPUT = koffi.struct("KEYBDINPUT", {
    wVk: "uint16",
    wScan: "uint16",
    dwFlags: "uint32",
    time: "uint32",
    dwExtraInfo: "uintptr",
});
const INPUT = koffi.struct("INPUT", {
    type: "uint32",
    ki: KEYBDINPUT,
    padding: "uint64",
});
// Load user32.dll
const user32 = koffi.load("user32.dll");
const SendInput = user32.func("uint32 SendInput(uint32 nInputs, INPUT *pInputs, int cbSize)");
/**
 * Map of key names to Windows VK codes and scan codes.
 */
const KEY_MAP = {
    // Letters
    A: { vk: 0x41, scan: 0x1E }, B: { vk: 0x42, scan: 0x30 },
    C: { vk: 0x43, scan: 0x2E }, D: { vk: 0x44, scan: 0x20 },
    E: { vk: 0x45, scan: 0x12 }, F: { vk: 0x46, scan: 0x21 },
    G: { vk: 0x47, scan: 0x22 }, H: { vk: 0x48, scan: 0x23 },
    I: { vk: 0x49, scan: 0x17 }, J: { vk: 0x4A, scan: 0x24 },
    K: { vk: 0x4B, scan: 0x25 }, L: { vk: 0x4C, scan: 0x26 },
    M: { vk: 0x4D, scan: 0x32 }, N: { vk: 0x4E, scan: 0x31 },
    O: { vk: 0x4F, scan: 0x18 }, P: { vk: 0x50, scan: 0x19 },
    Q: { vk: 0x51, scan: 0x10 }, R: { vk: 0x52, scan: 0x13 },
    S: { vk: 0x53, scan: 0x1F }, T: { vk: 0x54, scan: 0x14 },
    U: { vk: 0x55, scan: 0x16 }, V: { vk: 0x56, scan: 0x2F },
    W: { vk: 0x57, scan: 0x11 }, X: { vk: 0x58, scan: 0x2D },
    Y: { vk: 0x59, scan: 0x15 }, Z: { vk: 0x5A, scan: 0x2C },
    // Arrow keys (extended)
    Up: { vk: 0x26, scan: 0x48, extended: true },
    Down: { vk: 0x28, scan: 0x50, extended: true },
    Left: { vk: 0x25, scan: 0x4B, extended: true },
    Right: { vk: 0x27, scan: 0x4D, extended: true },
    // Modifier keys
    RShift: { vk: 0xA1, scan: 0x36 },
    LShift: { vk: 0xA0, scan: 0x2A },
    RCtrl: { vk: 0xA3, scan: 0x1D, extended: true },
    LCtrl: { vk: 0xA2, scan: 0x1D },
};
/**
 * Send a key press and release using Windows SendInput.
 * @param keyName - Key name from KEY_MAP (e.g. "L", "Up", "RShift")
 */
export function sendKey(keyName) {
    const key = KEY_MAP[keyName];
    if (!key)
        return;
    const baseFlags = KEYEVENTF_SCANCODE | (key.extended ? KEYEVENTF_EXTENDEDKEY : 0);
    const inputs = [
        // Key down
        {
            type: INPUT_KEYBOARD,
            ki: { wVk: key.vk, wScan: key.scan, dwFlags: baseFlags, time: 0, dwExtraInfo: 0 },
            padding: 0,
        },
        // Key up
        {
            type: INPUT_KEYBOARD,
            ki: { wVk: key.vk, wScan: key.scan, dwFlags: baseFlags | KEYEVENTF_KEYUP, time: 0, dwExtraInfo: 0 },
            padding: 0,
        },
    ];
    SendInput(2, inputs, koffi.sizeof(INPUT));
}
