import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.motor-map-down" })
export class MotorMapDown extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Motor Map Down";
}
