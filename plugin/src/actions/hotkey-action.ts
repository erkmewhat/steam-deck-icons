import { SingletonAction, type KeyDownEvent, type WillAppearEvent } from "@elgato/streamdeck";
import { sendKey } from "./send-key";

export type HotkeySettings = {
    hotkey?: string;
};

/**
 * Base class for LMU hotkey actions.
 * Toggle actions use setState(0/1) to swap between manifest-defined states.
 */
export abstract class HotkeyAction extends SingletonAction<HotkeySettings> {
    abstract readonly defaultHotkey: string;
    abstract readonly actionName: string;
    abstract readonly iconFile: string;
    readonly isToggle: boolean = false;

    private toggleStates = new Map<string, boolean>();

    override async onWillAppear(ev: WillAppearEvent<HotkeySettings>): Promise<void> {
        this.toggleStates.set(ev.action.id, false);
    }

    override async onKeyDown(ev: KeyDownEvent<HotkeySettings>): Promise<void> {
        const hotkey = ev.payload.settings.hotkey || this.defaultHotkey;
        sendKey(hotkey);

        if (this.isToggle) {
            const wasOn = this.toggleStates.get(ev.action.id) || false;
            const nowOn = !wasOn;
            this.toggleStates.set(ev.action.id, nowOn);
            await ev.action.setState(nowOn ? 1 : 0);
        } else {
            await ev.action.showOk();
        }
    }
}
