import { SingletonAction } from "@elgato/streamdeck";
/**
 * Base class for LMU hotkey actions. Each action sends a configurable
 * keyboard shortcut when the Stream Deck key is pressed.
 */
export class HotkeyAction extends SingletonAction {
    async onKeyDown(ev) {
        const hotkey = ev.payload.settings.hotkey || this.defaultHotkey;
        await ev.action.showOk();
    }
}
