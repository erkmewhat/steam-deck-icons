import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.engine-map-up" })
export class EngineMapUp extends HotkeyAction {
    readonly defaultHotkey = "E";
    readonly actionName = "Engine Map Increase";
    readonly iconFile = "engine-map-up";
}
