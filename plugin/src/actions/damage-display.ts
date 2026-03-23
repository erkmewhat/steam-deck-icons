import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.damage-display" })
export class DamageDisplay extends HotkeyAction {
    readonly defaultHotkey = "F9";
    readonly actionName = "Damage Display";
    readonly iconFile = "damage-display";
}
