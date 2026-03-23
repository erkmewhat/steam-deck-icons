import { SingletonAction } from "@elgato/streamdeck";
import { sendKey } from "./send-key.js";
/**
 * Base class for LMU hotkey actions.
 * Toggle actions use setState(0/1) to swap between manifest-defined states.
 */
export class HotkeyAction extends SingletonAction {
    isToggle = false;
    toggleStates = new Map();
    async onWillAppear(ev) {
        this.toggleStates.set(ev.action.id, false);
    }
    async onKeyDown(ev) {
        const hotkey = ev.payload.settings.hotkey || this.defaultHotkey;
        sendKey(hotkey);
        if (this.isToggle) {
            const wasOn = this.toggleStates.get(ev.action.id) || false;
            const nowOn = !wasOn;
            this.toggleStates.set(ev.action.id, nowOn);
            await ev.action.setState(nowOn ? 1 : 0);
        }
        else {
            await ev.action.showOk();
        }
    }
}
