import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.driving-cameras" })
export class DrivingCameras extends HotkeyAction {
    readonly defaultHotkey = "Insert";
    readonly actionName = "Driving Cameras";
    readonly iconFile = "driving-cameras";
}
