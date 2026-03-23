import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.engine-map-down" })
export class EngineMapDown extends HotkeyAction {
    readonly defaultHotkey = "D";
    readonly actionName = "Engine Map Decrease";
    readonly iconFile = "engine-map-down";
}
