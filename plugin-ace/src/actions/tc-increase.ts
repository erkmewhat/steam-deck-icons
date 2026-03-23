import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.tc-increase" })
export class TcIncrease extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "TC Increase";
}
