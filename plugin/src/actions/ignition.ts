import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.ignition" })
export class Ignition extends HotkeyAction {
    readonly defaultHotkey = "N";
    readonly actionName = "Ignition";
    readonly iconFile = "ignition";
    readonly isToggle = true;
}
