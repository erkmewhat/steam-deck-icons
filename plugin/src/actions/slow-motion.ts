import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.slow-motion" })
export class SlowMotion extends HotkeyAction {
    readonly defaultHotkey = "F11";
    readonly actionName = "Slow Motion";
    readonly iconFile = "slow-motion";
}
