import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.pit-request" })
export class PitRequest extends HotkeyAction {
    readonly defaultHotkey = "M";
    readonly actionName = "Pit Request";
    readonly iconFile = "pit-request";
}
