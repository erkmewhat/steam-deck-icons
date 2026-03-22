import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.look-left" })
export class LookLeft extends HotkeyAction {
    readonly defaultHotkey = "S";
    readonly actionName = "Look Left";
}
