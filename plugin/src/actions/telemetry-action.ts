/**
 * Base class for telemetry display actions.
 * Handles lifecycle, throttling, and change detection for setImage().
 *
 * Subclasses implement render(state) to produce an SVG string.
 * The base class handles:
 * - Registering/unregistering with the telemetry manager
 * - Throttling setImage calls (respecting 10/sec global limit)
 * - Deduplication: skipping setImage if SVG hasn't changed
 */
import { SingletonAction, type WillAppearEvent, type WillDisappearEvent } from "@elgato/streamdeck";
import { telemetryManager, type TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderNoData } from "../telemetry/svg-renderer.js";

/** Tracks all active telemetry actions for global rate limiting. */
const activeActions = new Set<TelemetryActionBase>();
let renderTimer: ReturnType<typeof setInterval> | null = null;

/** Start the shared render loop if not already running. */
function ensureRenderLoop(): void {
    if (renderTimer) return;
    // 200ms interval = 5 ticks/sec. With max ~8 updates per tick, stays under 10/sec.
    renderTimer = setInterval(() => {
        let budget = 8; // max setImage calls per tick
        for (const action of activeActions) {
            if (budget <= 0) break;
            if (action.needsRender) {
                action.flush();
                budget--;
            }
        }
    }, 200);
}

function stopRenderLoop(): void {
    if (renderTimer && activeActions.size === 0) {
        clearInterval(renderTimer);
        renderTimer = null;
    }
}

export type TelemetrySettings = Record<string, never>;

export abstract class TelemetryActionBase extends SingletonAction<TelemetrySettings> {
    private lastSvg = "";
    private pendingSvg = "";
    private actionRef: any = null;
    private listener: ((state: TelemetryState) => void) | null = null;

    /** Whether this action has a new SVG waiting to be flushed. */
    get needsRender(): boolean {
        return this.pendingSvg !== "" && this.pendingSvg !== this.lastSvg;
    }

    /** Subclasses produce an SVG string from telemetry state. */
    abstract render(state: TelemetryState): string;

    override async onWillAppear(ev: WillAppearEvent<TelemetrySettings>): Promise<void> {
        this.actionRef = ev.action;

        // Show initial state
        const svg = telemetryManager.state.available
            ? this.render(telemetryManager.state)
            : renderNoData();
        await this.setImageSafe(svg);

        // Subscribe to updates
        this.listener = (state: TelemetryState) => {
            this.pendingSvg = state.available ? this.render(state) : renderNoData();
        };
        telemetryManager.subscribe(this.listener);

        activeActions.add(this);
        ensureRenderLoop();
    }

    override async onWillDisappear(ev: WillDisappearEvent<TelemetrySettings>): Promise<void> {
        if (this.listener) {
            telemetryManager.unsubscribe(this.listener);
            this.listener = null;
        }
        activeActions.delete(this);
        this.actionRef = null;
        stopRenderLoop();
    }

    /** Called by the render loop when budget allows. */
    async flush(): Promise<void> {
        if (this.pendingSvg && this.pendingSvg !== this.lastSvg) {
            await this.setImageSafe(this.pendingSvg);
            this.lastSvg = this.pendingSvg;
        }
    }

    private async setImageSafe(svg: string): Promise<void> {
        if (!this.actionRef) return;
        try {
            await this.actionRef.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
        } catch {
            // Swallow errors (action may have disappeared)
        }
    }
}
