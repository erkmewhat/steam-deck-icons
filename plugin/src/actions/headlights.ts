import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.headlights" })
export class Headlights extends HotkeyAction {
    readonly defaultHotkey = "H";
    readonly actionName = "Headlights";
    readonly iconFile = "headlights";
    readonly isToggle = true;
}
