import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.pause" })
export class Pause extends HotkeyAction {
    readonly defaultHotkey = "Esc";
    readonly actionName = "Pause";
    readonly iconFile = "pause";
}
