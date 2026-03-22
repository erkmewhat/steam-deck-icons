import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.motor-map-up" })
export class MotorMapUp extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Motor Map Up";
}
