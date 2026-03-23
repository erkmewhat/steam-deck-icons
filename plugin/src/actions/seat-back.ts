import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.seat-back" })
export class SeatBack extends HotkeyAction {
    readonly defaultHotkey = "Num2";
    readonly actionName = "Seat Back";
    readonly iconFile = "seat-back";
}
