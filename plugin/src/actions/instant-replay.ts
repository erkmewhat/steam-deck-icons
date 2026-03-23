import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.instant-replay" })
export class InstantReplay extends HotkeyAction {
    readonly defaultHotkey = "R";
    readonly actionName = "Instant Replay";
    readonly iconFile = "instant-replay";
}
