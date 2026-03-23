import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.prev-mfd" })
export class PrevMfd extends HotkeyAction {
    readonly defaultHotkey = "RCtrl";
    readonly actionName = "Previous MFD";
    readonly iconFile = "prev-mfd";
}
