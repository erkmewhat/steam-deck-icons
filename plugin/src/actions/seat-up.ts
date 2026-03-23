import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.seat-up" })
export class SeatUp extends HotkeyAction {
    readonly defaultHotkey = "Num4";
    readonly actionName = "Seat Up";
    readonly iconFile = "seat-up";
}
