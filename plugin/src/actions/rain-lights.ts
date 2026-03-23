import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.rain-lights" })
export class RainLights extends HotkeyAction {
    readonly defaultHotkey = "R";
    readonly actionName = "Rain Lights";
    readonly iconFile = "rain-lights";
}
