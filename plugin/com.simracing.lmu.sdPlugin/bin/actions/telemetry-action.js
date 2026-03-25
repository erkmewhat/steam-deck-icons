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
import { SingletonAction } from "@elgato/streamdeck";
import { telemetryManager } from "../telemetry/telemetry-manager.js";
import { renderNoData } from "../telemetry/svg-renderer.js";
/** Tracks all active telemetry actions for global rate limiting. */
const activeActions = new Set();
let renderTimer = null;
/** Start the shared render loop if not already running. */
function ensureRenderLoop() {
    if (renderTimer)
        return;
    // 200ms interval = 5 ticks/sec. With max ~8 updates per tick, stays under 10/sec.
    renderTimer = setInterval(() => {
        let budget = 8; // max setImage calls per tick
        for (const action of activeActions) {
            if (budget <= 0)
                break;
            if (action.needsRender) {
                action.flush();
                budget--;
            }
        }
    }, 200);
}
function stopRenderLoop() {
    if (renderTimer && activeActions.size === 0) {
        clearInterval(renderTimer);
        renderTimer = null;
    }
}
export class TelemetryActionBase extends SingletonAction {
    lastSvg = "";
    pendingSvg = "";
    actionRef = null;
    listener = null;
    /** Whether this action has a new SVG waiting to be flushed. */
    get needsRender() {
        return this.pendingSvg !== "" && this.pendingSvg !== this.lastSvg;
    }
    async onWillAppear(ev) {
        this.actionRef = ev.action;
        // Show initial state
        const svg = telemetryManager.state.available
            ? this.render(telemetryManager.state)
            : renderNoData();
        await this.setImageSafe(svg);
        // Subscribe to updates
        this.listener = (state) => {
            this.pendingSvg = state.available ? this.render(state) : renderNoData();
        };
        telemetryManager.subscribe(this.listener);
        activeActions.add(this);
        ensureRenderLoop();
    }
    async onWillDisappear(ev) {
        if (this.listener) {
            telemetryManager.unsubscribe(this.listener);
            this.listener = null;
        }
        activeActions.delete(this);
        this.actionRef = null;
        stopRenderLoop();
    }
    /** Called by the render loop when budget allows. */
    async flush() {
        if (this.pendingSvg && this.pendingSvg !== this.lastSvg) {
            await this.setImageSafe(this.pendingSvg);
            this.lastSvg = this.pendingSvg;
        }
    }
    async setImageSafe(svg) {
        if (!this.actionRef)
            return;
        try {
            await this.actionRef.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
        }
        catch {
            // Swallow errors (action may have disappeared)
        }
    }
}
