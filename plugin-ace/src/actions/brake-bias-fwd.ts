import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.brake-bias-fwd" })
export class BrakeBiasFwd extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Brake Bias Front";
}
