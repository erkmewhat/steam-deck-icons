import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.display-page" })
export class DisplayPage extends HotkeyAction {
    readonly defaultHotkey = "";
    readonly actionName = "Display Page";
}
