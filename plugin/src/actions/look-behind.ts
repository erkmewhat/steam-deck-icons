import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.look-behind" })
export class LookBehind extends HotkeyAction {
    readonly defaultHotkey = "B";
    readonly actionName = "Look Behind";
}
