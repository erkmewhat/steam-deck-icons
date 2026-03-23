import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.seat-down" })
export class SeatDown extends HotkeyAction {
    readonly defaultHotkey = "Num6";
    readonly actionName = "Seat Down";
    readonly iconFile = "seat-down";
}
