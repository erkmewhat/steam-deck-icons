import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.brake-bias-backward" })
export class BrakeBiasBackward extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Brake Bias Backward";
}
