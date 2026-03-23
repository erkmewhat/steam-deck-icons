import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.look-right" })
export class LookRight extends HotkeyAction {
    readonly defaultHotkey = "W";
    readonly actionName = "Look Right";
}
