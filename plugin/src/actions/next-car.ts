import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.next-car" })
export class NextCar extends HotkeyAction {
    readonly defaultHotkey = "X";
    readonly actionName = "Next Car";
    readonly iconFile = "next-car";
}
