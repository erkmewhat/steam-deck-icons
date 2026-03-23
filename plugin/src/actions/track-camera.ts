import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.track-camera" })
export class TrackCamera extends HotkeyAction {
    readonly defaultHotkey = "F1";
    readonly actionName = "Track Camera";
    readonly iconFile = "track-camera";
}
