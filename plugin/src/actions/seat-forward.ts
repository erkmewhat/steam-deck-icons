import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.seat-forward" })
export class SeatForward extends HotkeyAction {
    readonly defaultHotkey = "Num8";
    readonly actionName = "Seat Forward";
    readonly iconFile = "seat-forward";
}
