import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.wipers-down" })
export class WipersDown extends HotkeyAction {
    readonly defaultHotkey = "O";
    readonly actionName = "Wiper Cycle Down";
    readonly iconFile = "wipers-down";
}
