import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.pit-limiter" })
export class PitLimiter extends HotkeyAction {
    readonly defaultHotkey = "L";
    readonly actionName = "Pit Limiter";
    readonly iconFile = "pit-limiter";
    readonly isToggle = true;
}
