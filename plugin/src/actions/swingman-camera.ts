import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.swingman-camera" })
export class SwingmanCamera extends HotkeyAction {
    readonly defaultHotkey = "PageUp";
    readonly actionName = "Swingman Camera";
    readonly iconFile = "swingman-camera";
}
