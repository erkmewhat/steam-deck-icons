import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.spectator-camera" })
export class SpectatorCamera extends HotkeyAction {
    readonly defaultHotkey = "PageDown";
    readonly actionName = "Spectator Camera";
    readonly iconFile = "spectator-camera";
}
