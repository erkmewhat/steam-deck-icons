import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.restart-race" })
export class RestartRace extends HotkeyAction {
    readonly defaultHotkey = "Y";
    readonly actionName = "Restart Race";
    readonly iconFile = "restart-race";
}
