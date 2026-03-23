import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.restart-session" })
export class RestartSession extends HotkeyAction {
    readonly defaultHotkey = "`";
    readonly actionName = "Restart Session";
    readonly iconFile = "restart-session";
}
