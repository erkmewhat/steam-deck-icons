import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.pit-limiter" })
export class PitLimiter extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Pit Limiter";
}
