import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.starter" })
export class Starter extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Starter";
}
