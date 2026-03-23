import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.horn" })
export class Horn extends HotkeyAction {
    readonly defaultHotkey = "H";
    readonly actionName = "Horn";
    readonly iconFile = "horn";
}
