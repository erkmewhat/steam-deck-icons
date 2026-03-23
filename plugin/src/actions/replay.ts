import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.replay" })
export class Replay extends HotkeyAction {
    readonly defaultHotkey = ";";
    readonly actionName = "Start Replay";
    readonly iconFile = "replay";
}
