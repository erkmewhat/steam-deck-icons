import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.look-right" })
export class LookRight extends HotkeyAction {
    readonly defaultHotkey = "Q";
    readonly actionName = "Look Right";
    readonly iconFile = "look-right";
}
