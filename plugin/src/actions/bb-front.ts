import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.bb-front" })
export class BbFront extends HotkeyAction {
    readonly defaultHotkey = "B";
    readonly actionName = "Brake Bias Front";
    readonly iconFile = "bb-front";
}
