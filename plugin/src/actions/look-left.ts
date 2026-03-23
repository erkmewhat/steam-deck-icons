import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.look-left" })
export class LookLeft extends HotkeyAction {
    readonly defaultHotkey = "D";
    readonly actionName = "Look Left";
    readonly iconFile = "look-left";
}
