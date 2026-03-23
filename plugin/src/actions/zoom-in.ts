import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.zoom-in" })
export class ZoomIn extends HotkeyAction {
    readonly defaultHotkey = "Num3";
    readonly actionName = "Zoom In";
    readonly iconFile = "zoom-in";
}
