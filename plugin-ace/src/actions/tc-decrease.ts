import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.tc-decrease" })
export class TcDecrease extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "TC Decrease";
}
