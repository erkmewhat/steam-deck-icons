import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.wipers" })
export class Wipers extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Wipers";
}
