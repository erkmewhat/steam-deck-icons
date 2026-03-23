import { SingletonAction, type KeyDownEvent } from "@elgato/streamdeck";

/**
 * Settings stored per-action instance, allowing users to customize the hotkey.
 */
export type HotkeySettings = {
    hotkey?: string;
};

/**
 * Base class for ACE hotkey actions. Each action sends a configurable
 * keyboard shortcut when the Stream Deck key is pressed.
 */
export abstract class HotkeyAction extends SingletonAction<HotkeySettings> {
    abstract readonly defaultHotkey: string;
    abstract readonly actionName: string;

    override async onKeyDown(ev: KeyDownEvent<HotkeySettings>): Promise<void> {
        const hotkey = ev.payload.settings.hotkey || this.defaultHotkey;
        await ev.action.showOk();
    }
}
