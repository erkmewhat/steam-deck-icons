import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.free-camera" })
export class FreeCamera extends HotkeyAction {
    readonly defaultHotkey = "F5";
    readonly actionName = "Free Camera";
    readonly iconFile = "free-camera";
}
