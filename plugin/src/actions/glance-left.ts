import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.glance-left" })
export class GlanceLeft extends HotkeyAction {
    readonly defaultHotkey = "Q";
    readonly actionName = "Glance Left";
    readonly iconFile = "glance-left";
}
