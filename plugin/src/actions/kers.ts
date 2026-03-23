import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.kers" })
export class Kers extends HotkeyAction {
    readonly defaultHotkey = "Y";
    readonly actionName = "KERS";
    readonly iconFile = "kers";
}
