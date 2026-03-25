/**
 * Base class for telemetry display actions.
 *
 * Features:
 * - SVG→PNG rendering via resvg-js (SVG data URIs don't work on SD)
 * - Throttled render loop (max 8 setImage/sec, under SDK 10/sec limit)
 * - Change detection (skip setImage if SVG unchanged)
 * - FLAG ALERT: yellow/blue/red flags take over ALL buttons for 4 seconds
 *   with pulsing animation, then return to normal telemetry
 */
import { SingletonAction } from "@elgato/streamdeck";
import { telemetryManager } from "../telemetry/telemetry-manager.js";
import { renderNoData, renderFlagAlert } from "../telemetry/svg-renderer.js";
import { svgToPngDataUri } from "../telemetry/svg-to-png.js";
// ── Global flag alert system ────────────────────────────────────────
const activeActions = [];
let renderTimer = null;
let roundRobinIndex = 0;
/** Alert state — when active, ALL buttons show the flag alert. */
let alertFlag = null;
let alertPulse = false;
let alertTimeout = null;
let alertPulseTimer = null;
let lastFlag = "green";
const ALERT_FLAGS = new Set(["yellow", "blue", "red"]);
const ALERT_DURATION_MS = 4000;
const ALERT_PULSE_MS = 400;
/** Check if flag changed and trigger alert takeover. */
function checkFlagAlert(state) {
    const flag = state.flag;
    if (flag === lastFlag)
        return;
    lastFlag = flag;
    if (ALERT_FLAGS.has(flag)) {
        startAlert(flag);
    }
    else {
        clearAlert();
    }
}
function startAlert(flag) {
    // Clear any existing alert
    clearAlert();
    alertFlag = flag;
    alertPulse = true;
    // Pulse effect: toggle every 400ms for visual urgency
    alertPulseTimer = setInterval(() => {
        alertPulse = !alertPulse;
        // Force all actions to re-render the alert
        for (const action of activeActions) {
            action.forceAlert(flag, alertPulse);
        }
    }, ALERT_PULSE_MS);
    // Immediately push alert to all buttons
    for (const action of activeActions) {
        action.forceAlert(flag, alertPulse);
    }
    // Auto-clear after duration — return to normal telemetry
    alertTimeout = setTimeout(() => {
        clearAlert();
    }, ALERT_DURATION_MS);
}
function clearAlert() {
    alertFlag = null;
    if (alertTimeout) {
        clearTimeout(alertTimeout);
        alertTimeout = null;
    }
    if (alertPulseTimer) {
        clearInterval(alertPulseTimer);
        alertPulseTimer = null;
    }
    // Force all actions back to their normal SVG
    for (const action of activeActions) {
        action.clearAlert();
    }
}
// ── Render loop ─────────────────────────────────────────────────────
function ensureRenderLoop() {
    if (renderTimer)
        return;
    renderTimer = setInterval(() => {
        if (activeActions.length === 0)
            return;
        // During alert, the pulse timer handles rendering — skip normal loop
        if (alertFlag)
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
    inAlert = false;
    get needsRender() {
        return this.pendingSvg !== "" && this.pendingSvg !== this.lastSvg;
    }
    /** Called by the alert system to force this button to show a flag alert. */
    forceAlert(flag, pulse) {
        this.inAlert = true;
        const svg = renderFlagAlert(flag, pulse);
        // Bypass dedup — alert must always render
        this.setImageSafe(svg);
        this.lastSvg = "";
    }
    /** Called when alert ends — resume normal rendering. */
    clearAlert() {
        this.inAlert = false;
        this.lastSvg = ""; // force next normal render to push
    }
    async onWillAppear(ev) {
        this.actionRef = ev.action;
        const svg = telemetryManager.state.available
            ? this.render(telemetryManager.state)
            : renderNoData();
        await this.setImageSafe(svg);
        this.lastSvg = svg;
        this.listener = (state) => {
            checkFlagAlert(state);
            if (!this.inAlert) {
                this.pendingSvg = state.available ? this.render(state) : renderNoData();
            }
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
    flush() {
        if (this.inAlert)
            return;
        if (this.pendingSvg && this.pendingSvg !== this.lastSvg) {
            this.setImageSafe(this.pendingSvg);
            this.lastSvg = this.pendingSvg;
        }
    }
    async setImageSafe(svg) {
        if (!this.actionRef)
            return;
        try {
            const pngUri = svgToPngDataUri(svg);
            await this.actionRef.setImage(pngUri);
        }
        catch {
            // Swallow errors
        }
    }
}
