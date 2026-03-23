import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.abs-increase" })
export class AbsIncrease extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "ABS Increase";
}
