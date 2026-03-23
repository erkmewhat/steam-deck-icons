import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.tc-increase" })
export class TcIncrease extends HotkeyAction {
    readonly defaultHotkey = "T";
    readonly actionName = "TC Increase";
    readonly iconFile = "tc-increase";
}
