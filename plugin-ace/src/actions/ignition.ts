import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.ignition" })
export class Ignition extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Ignition";
}
