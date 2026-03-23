import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.fov-increase" })
export class FovIncrease extends HotkeyAction {
    readonly defaultHotkey = "Num9";
    readonly actionName = "FOV Increase";
    readonly iconFile = "fov-increase";
}
