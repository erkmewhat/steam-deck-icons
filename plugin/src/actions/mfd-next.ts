import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.mfd-next" })
export class MfdNext extends HotkeyAction {
    readonly defaultHotkey = "Enter";
    readonly actionName = "MFD Next Page";
}
