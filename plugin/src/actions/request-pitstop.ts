import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.request-pitstop" })
export class RequestPitstop extends HotkeyAction {
    readonly defaultHotkey = "E";
    readonly actionName = "Request Pit Stop";
    readonly iconFile = "request-pitstop";
}
