import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.mfd-increase" })
export class MfdIncrease extends HotkeyAction {
    readonly defaultHotkey = "Right";
    readonly actionName = "MFD Increase";
}
