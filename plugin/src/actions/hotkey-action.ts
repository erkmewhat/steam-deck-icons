import { SingletonAction, type KeyDownEvent, type WillAppearEvent } from "@elgato/streamdeck";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { sendKey } from "./send-key";

/**
 * Settings stored per-action instance, allowing users to customize the hotkey.
 */
export type HotkeySettings = {
    hotkey?: string;
};

/**
 * Base class for LMU hotkey actions. Each action sends a configurable
 * keyboard shortcut when the Stream Deck key is pressed, and sets its
 * icon via the SDK on appear.
 */
export abstract class HotkeyAction extends SingletonAction<HotkeySettings> {
    abstract readonly defaultHotkey: string;
    abstract readonly actionName: string;
    abstract readonly iconFile: string;

    override async onWillAppear(ev: WillAppearEvent<HotkeySettings>): Promise<void> {
        try {
            const __dirname = dirname(fileURLToPath(import.meta.url));
            const svgPath = join(__dirname, "..", "imgs", "actions", `${this.iconFile}.svg`);
            const svgContent = readFileSync(svgPath, "utf-8");
            const base64 = Buffer.from(svgContent).toString("base64");
            await ev.action.setImage(`data:image/svg+xml;base64,${base64}`);
        } catch {
            // Fall back to manifest icon if file read fails
        }
    }

    override async onKeyDown(ev: KeyDownEvent<HotkeySettings>): Promise<void> {
        const hotkey = ev.payload.settings.hotkey || this.defaultHotkey;
        sendKey(hotkey);
        await ev.action.showOk();
    }
}
