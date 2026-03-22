import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.mfd-down" })
export class MfdDown extends HotkeyAction {
    readonly defaultHotkey = "Down";
    readonly actionName = "MFD Down";
}
