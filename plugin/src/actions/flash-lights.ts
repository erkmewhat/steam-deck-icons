import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.flash-lights" })
export class FlashLights extends HotkeyAction {
    readonly defaultHotkey = "F";
    readonly actionName = "Flashing Lights";
    readonly iconFile = "flash-lights";
}
