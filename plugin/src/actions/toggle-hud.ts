import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.toggle-hud" })
export class ToggleHud extends HotkeyAction {
    readonly defaultHotkey = "6";
    readonly actionName = "Toggle HUD";
    readonly iconFile = "toggle-hud";
}
