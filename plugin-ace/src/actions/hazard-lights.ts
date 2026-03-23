import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.hazard-lights" })
export class HazardLights extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Hazard Lights";
}
