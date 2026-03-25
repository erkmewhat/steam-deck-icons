/**
 * Base class for telemetry display actions.
 * Handles lifecycle, throttling, and change detection for setImage().
 *
 * Subclasses implement render(state) to produce an SVG string.
 * The base class handles:
 * - Registering/unregistering with the telemetry manager
 * - Throttling setImage calls (hard limit: 10/sec across all actions)
 * - Deduplication: skipping setImage if SVG hasn't changed
 */
import { SingletonAction } from "@elgato/streamdeck";
import { telemetryManager } from "../telemetry/telemetry-manager.js";
import { renderNoData } from "../telemetry/svg-renderer.js";
import { svgToPngDataUri } from "../telemetry/svg-to-png.js";
/** Tracks all active telemetry actions for round-robin rendering. */
const activeActions = [];
let renderTimer = null;
let roundRobinIndex = 0;
/**
 * Render loop: fires every 500ms, updates up to 4 actions per tick.
 * 4 actions / 500ms = 8 setImage calls/sec max — safely under the 10/sec SDK limit.
 * Actions are served round-robin so all get equal update time.
 */
function ensureRenderLoop() {
    if (renderTimer)
        return;
    renderTimer = setInterval(() => {
        if (activeActions.length === 0)
            return;
        let budget = 4;
        let checked = 0;
        while (budget > 0 && checked < activeActions.length) {
            const idx = roundRobinIndex % activeActions.length;
            roundRobinIndex++;
            checked++;
            const action = activeActions[idx];
            if (action.needsRender) {
                action.flush();
                budget--;
            }
        }
    }, 500);
}
function stopRenderLoop() {
    if (renderTimer && activeActions.length === 0) {
        clearInterval(renderTimer);
        renderTimer = null;
        roundRobinIndex = 0;
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
        this.lastSvg = svg;
        // Subscribe to updates — listener just stages the SVG, render loop flushes it
        this.listener = (state) => {
            this.pendingSvg = state.available ? this.render(state) : renderNoData();
        };
        telemetryManager.subscribe(this.listener);
        activeActions.push(this);
        ensureRenderLoop();
    }
    async onWillDisappear(ev) {
        if (this.listener) {
            telemetryManager.unsubscribe(this.listener);
            this.listener = null;
        }
        const idx = activeActions.indexOf(this);
        if (idx >= 0)
            activeActions.splice(idx, 1);
        this.actionRef = null;
        stopRenderLoop();
    }
    /** Called by the render loop when budget allows. */
    flush() {
        if (this.pendingSvg && this.pendingSvg !== this.lastSvg) {
            this.setImageSafe(this.pendingSvg);
            this.lastSvg = this.pendingSvg;
        }
    }
    async setImageSafe(svg) {
        if (!this.actionRef)
            return;
        try {
            // SVG data URIs don't work reliably on SD — render to PNG first
            const pngUri = svgToPngDataUri(svg);
            await this.actionRef.setImage(pngUri);
        }
        catch {
            // Swallow errors (action may have disappeared or render failed)
        }
    }
}
