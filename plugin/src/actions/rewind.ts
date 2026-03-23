import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.rewind" })
export class Rewind extends HotkeyAction {
    readonly defaultHotkey = "F2";
    readonly actionName = "Rewind";
    readonly iconFile = "rewind";
}
