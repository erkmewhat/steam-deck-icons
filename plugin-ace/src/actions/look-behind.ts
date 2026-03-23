import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.look-behind" })
export class LookBehind extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Look Behind";
}
