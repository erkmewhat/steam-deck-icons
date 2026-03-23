import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.wipers-up" })
export class WipersUp extends HotkeyAction {
    readonly defaultHotkey = "P";
    readonly actionName = "Wiper Cycle Up";
    readonly iconFile = "wipers-up";
}
