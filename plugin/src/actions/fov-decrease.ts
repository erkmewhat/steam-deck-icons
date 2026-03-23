import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.fov-decrease" })
export class FovDecrease extends HotkeyAction {
    readonly defaultHotkey = "Num7";
    readonly actionName = "FOV Decrease";
    readonly iconFile = "fov-decrease";
}
