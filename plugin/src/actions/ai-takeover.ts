import { action } from "@elgato/streamdeck";
import { HotkeyAction } from "./hotkey-action";

@action({ UUID: "com.simracing.lmu.ai-takeover" })
export class AiTakeover extends HotkeyAction {
    readonly defaultHotkey = "I";
    readonly actionName = "AI Takeover";
    readonly iconFile = "ai-takeover";
}
