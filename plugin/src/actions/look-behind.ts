import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.look-behind" })
export class LookBehind extends HotkeyAction {
    readonly defaultHotkey = "W";
    readonly actionName = "Look Behind";
    readonly iconFile = "look-behind";
}
