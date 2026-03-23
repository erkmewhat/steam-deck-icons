import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.brake-bias-forward" })
export class BrakeBiasForward extends HotkeyAction {
    readonly defaultHotkey = "X";
    readonly actionName = "Brake Bias Forward";
    readonly iconFile = "brake-bias-fwd";
}
