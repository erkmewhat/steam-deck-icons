import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.bb-rear" })
export class BbRear extends HotkeyAction {
    readonly defaultHotkey = "V";
    readonly actionName = "Brake Bias Rear";
    readonly iconFile = "bb-rear";
}
