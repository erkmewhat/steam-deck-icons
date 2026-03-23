import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.virtual-mirror" })
export class VirtualMirror extends HotkeyAction {
    readonly defaultHotkey = "F8";
    readonly actionName = "Virtual Mirror";
    readonly iconFile = "virtual-mirror";
}
