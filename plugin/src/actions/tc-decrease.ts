import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.tc-decrease" })
export class TcDecrease extends HotkeyAction {
    readonly defaultHotkey = "B";
    readonly actionName = "TC Decrease";
    readonly iconFile = "tc-decrease";
}
