import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.wipers" })
export class Wipers extends HotkeyAction {
    readonly defaultHotkey = "P";
    readonly actionName = "Wipers";
    readonly iconFile = "wipers";
}
