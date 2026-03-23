import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.onboard-cameras" })
export class OnboardCameras extends HotkeyAction {
    readonly defaultHotkey = "Home";
    readonly actionName = "Onboard Cameras";
    readonly iconFile = "onboard-cameras";
}
