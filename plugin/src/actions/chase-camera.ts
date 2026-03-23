import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.chase-camera" })
export class ChaseCamera extends HotkeyAction {
    readonly defaultHotkey = "F3";
    readonly actionName = "Chase Camera";
    readonly iconFile = "chase-camera";
}
