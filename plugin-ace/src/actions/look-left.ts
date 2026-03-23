import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.look-left" })
export class LookLeft extends HotkeyAction {
    readonly defaultHotkey = "Q";
    readonly actionName = "Look Left";
}
