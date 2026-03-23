import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.tracking-camera" })
export class TrackingCamera extends HotkeyAction {
    readonly defaultHotkey = "Delete";
    readonly actionName = "Tracking Camera";
    readonly iconFile = "tracking-camera";
}
