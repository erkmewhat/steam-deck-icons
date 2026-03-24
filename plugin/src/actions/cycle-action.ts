import { SingletonAction, type KeyDownEvent, type WillAppearEvent } from "@elgato/streamdeck";
import { sendKey } from "./send-key";

export type CycleSettings = {
    hotkey?: string;
};

/**
 * A state definition for one position in the cycle.
 */
export interface CycleState {
    /** Image path relative to plugin dir (e.g. "imgs/actions/wipers") */
    image: string;
    /** Title text shown on the button */
    title: string;
}

/**
 * Base class for actions that cycle through N states on each press.
 * Works around the SD 2-state manifest limit by using setImage + setTitle.
 */
export abstract class CycleAction extends SingletonAction<CycleSettings> {
    abstract readonly defaultHotkey: string;
    abstract readonly actionName: string;
    abstract readonly cycleStates: CycleState[];

    private stateIndices = new Map<string, number>();

    override async onWillAppear(ev: WillAppearEvent<CycleSettings>): Promise<void> {
        this.stateIndices.set(ev.action.id, 0);
        const state = this.cycleStates[0];
        await ev.action.setImage(state.image);
        await ev.action.setTitle(state.title);
    }

    override async onKeyDown(ev: KeyDownEvent<CycleSettings>): Promise<void> {
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
