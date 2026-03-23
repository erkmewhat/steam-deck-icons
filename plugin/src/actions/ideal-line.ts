import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.ideal-line" })
export class IdealLine extends HotkeyAction {
    readonly defaultHotkey = "F10";
    readonly actionName = "Ideal Racing Line";
    readonly iconFile = "ideal-line";
}
