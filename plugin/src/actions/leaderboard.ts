import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.ace.leaderboard" })
export class Leaderboard extends HotkeyAction {
    readonly defaultHotkey = "F7";
    readonly actionName = "Leaderboard";
    readonly iconFile = "leaderboard";
}
