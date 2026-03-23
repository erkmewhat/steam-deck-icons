import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.mfd-decrease" })
export class MfdDecrease extends HotkeyAction {
    readonly defaultHotkey = "Left";
    readonly actionName = "MFD Decrease";
    readonly iconFile = "mfd-decrease";
}
