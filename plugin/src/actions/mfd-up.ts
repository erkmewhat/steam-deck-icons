import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.mfd-up" })
export class MfdUp extends HotkeyAction {
    readonly defaultHotkey = "Up";
    readonly actionName = "MFD Up";
    readonly iconFile = "mfd-up";
}
