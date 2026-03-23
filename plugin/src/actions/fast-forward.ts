import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.fast-forward" })
export class FastForward extends HotkeyAction {
    readonly defaultHotkey = "F12";
    readonly actionName = "Fast Forward";
    readonly iconFile = "fast-forward";
}
