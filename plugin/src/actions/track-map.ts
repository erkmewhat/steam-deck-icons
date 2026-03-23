import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.track-map" })
export class TrackMap extends HotkeyAction {
    readonly defaultHotkey = "5";
    readonly actionName = "Track Map";
    readonly iconFile = "track-map";
}
