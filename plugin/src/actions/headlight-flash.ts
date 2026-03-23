import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.headlight-flash" })
export class HeadlightFlash extends HotkeyAction {
    readonly defaultHotkey = "G";
    readonly actionName = "Headlight Flash";
    readonly iconFile = "headlight-flash";
    readonly isToggle = true;
}
