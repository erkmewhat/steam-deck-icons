import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.brake-bias-forward" })
export class BrakeBiasForward extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Brake Bias Forward";
}
