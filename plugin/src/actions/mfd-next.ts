import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.mfd-next" })
export class MfdNext extends HotkeyAction {
    readonly defaultHotkey = "RShift";
    readonly actionName = "MFD Next Page";
    readonly iconFile = "mfd-next";
}
