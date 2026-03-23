import { SingletonAction, type KeyDownEvent, type WillAppearEvent } from "@elgato/streamdeck";
import { sendKey } from "./send-key";

/**
 * Settings stored per-action instance, allowing users to customize the hotkey.
 */
export type HotkeySettings = {
    hotkey?: string;
};

/**
 * Base class for LMU hotkey actions. Each action sends a configurable
 * keyboard shortcut when the Stream Deck key is pressed.
 *
 * Toggle actions (isToggle = true) use manifest-defined States[0] (off)
 * and States[1] (on). SD renders the correct icon per state automatically.
 * We call setState() to flip between them on key press.
 * Manifest must set DisableAutomaticStates: true for toggle actions so
 * we control the state change (SD won't auto-toggle on press).
 */
export abstract class HotkeyAction extends SingletonAction<HotkeySettings> {
    abstract readonly defaultHotkey: string;
    abstract readonly actionName: string;
    abstract readonly iconFile: string;

    /** Override to true for actions that toggle on/off (headlights, ignition, etc.) */
    readonly isToggle: boolean = false;

    /** Per-action-context toggle state: false = state 0 (off), true = state 1 (on) */
    private toggleStates = new Map<string, boolean>();

    override async onWillAppear(ev: WillAppearEvent<HotkeySettings>): Promise<void> {
        // Initialize to off state
        this.toggleStates.set(ev.action.id, false);
    }

    override async onKeyDown(ev: KeyDownEvent<HotkeySettings>): Promise<void> {
        const hotkey = ev.payload.settings.hotkey || this.defaultHotkey;
        sendKey(hotkey);

        if (this.isToggle) {
            const currentState = this.toggleStates.get(ev.action.id) || false;
            const newState = !currentState;
            this.toggleStates.set(ev.action.id, newState);
            await ev.action.setState(newState ? 1 : 0);
        } else {
            await ev.action.showOk();
        }
    }
}
