import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.abs-increase" })
export class AbsIncrease extends HotkeyAction {
    readonly defaultHotkey = "O";
    readonly actionName = "ABS Increase";
    readonly iconFile = "abs-increase";
}
