import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.zoom-out" })
export class ZoomOut extends HotkeyAction {
    readonly defaultHotkey = "Num1";
    readonly actionName = "Zoom Out";
    readonly iconFile = "zoom-out";
}
