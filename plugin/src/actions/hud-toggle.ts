import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.hud-toggle" })
export class HudToggle extends HotkeyAction {
    readonly defaultHotkey = "F4";
    readonly actionName = "Toggle HUD";
    readonly iconFile = "hud-toggle";
}
