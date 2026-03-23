import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.screenshot" })
export class Screenshot extends HotkeyAction {
    readonly defaultHotkey = "F12";
    readonly actionName = "Screenshot";
    readonly iconFile = "screenshot";
}
