import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.engine-map-up" })
export class EngineMapUp extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Engine Map Up";
}
