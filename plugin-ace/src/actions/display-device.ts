import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.display-device" })
export class DisplayDevice extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Display Device";
}
