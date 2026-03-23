import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.drs" })
export class Drs extends HotkeyAction {
    readonly defaultHotkey = "J";
    readonly actionName = "DRS";
    readonly iconFile = "drs";
}
