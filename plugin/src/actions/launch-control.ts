import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.launch-control" })
export class LaunchControl extends HotkeyAction {
    readonly defaultHotkey = "\\";
    readonly actionName = "Launch Control";
    readonly iconFile = "launch-control";
}
