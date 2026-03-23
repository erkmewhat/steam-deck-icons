import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.brake-bias-bwd" })
export class BrakeBiasBwd extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Brake Bias Rear";
}
