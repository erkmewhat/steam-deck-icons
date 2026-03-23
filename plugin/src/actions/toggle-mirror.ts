import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.toggle-mirror" })
export class ToggleMirror extends HotkeyAction {
    readonly defaultHotkey = "3";
    readonly actionName = "Toggle Mirror";
    readonly iconFile = "toggle-mirror";
}
