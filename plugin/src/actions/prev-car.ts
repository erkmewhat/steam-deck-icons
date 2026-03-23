import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.prev-car" })
export class PrevCar extends HotkeyAction {
    readonly defaultHotkey = "Z";
    readonly actionName = "Previous Car";
    readonly iconFile = "prev-car";
}
