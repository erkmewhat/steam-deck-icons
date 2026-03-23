import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.abs-decrease" })
export class AbsDecrease extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "ABS Decrease";
}
