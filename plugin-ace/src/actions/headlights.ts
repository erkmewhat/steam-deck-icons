import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.headlights" })
export class Headlights extends HotkeyAction {
    readonly defaultHotkey = "L";
    readonly actionName = "Headlights";
}
