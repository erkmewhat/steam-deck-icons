import { SingletonAction } from "@elgato/streamdeck";
import { sendKey } from "./send-key.js";
/**
 * Base class for actions that cycle through N states on each press.
 * Works around the SD 2-state manifest limit by using setImage + setTitle.
 */
export class CycleAction extends SingletonAction {
    stateIndices = new Map();
    async onWillAppear(ev) {
        this.stateIndices.set(ev.action.id, 0);
        const state = this.cycleStates[0];
        await ev.action.setImage(state.image);
        await ev.action.setTitle(state.title);
    }
    async onKeyDown(ev) {
        const hotkey = ev.payload.settings.hotkey || this.defaultHotkey;
        sendKey(hotkey);
        const current = this.stateIndices.get(ev.action.id) || 0;
        const next = (current + 1) % this.cycleStates.length;
        this.stateIndices.set(ev.action.id, next);
        const state = this.cycleStates[next];
        await ev.action.setImage(state.image);
        await ev.action.setTitle(state.title);
    }
}
