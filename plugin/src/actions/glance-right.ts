import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.glance-right" })
export class GlanceRight extends HotkeyAction {
    readonly defaultHotkey = "W";
    readonly actionName = "Glance Right";
    readonly iconFile = "glance-right";
}
