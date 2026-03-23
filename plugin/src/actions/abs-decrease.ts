import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.abs-decrease" })
export class AbsDecrease extends HotkeyAction {
    readonly defaultHotkey = "K";
    readonly actionName = "ABS Decrease";
    readonly iconFile = "abs-decrease";
}
