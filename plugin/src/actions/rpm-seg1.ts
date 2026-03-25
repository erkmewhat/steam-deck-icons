import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderRpmSegment } from "../telemetry/svg-renderer.js";

@action({ UUID: "com.simracing.lmu.rpm-seg1" })
export class RpmSeg1 extends TelemetryActionBase {
    render(state: TelemetryState): string {
        const pct = state.maxRpm > 0 ? state.rpm / state.maxRpm : 0;
        return renderRpmSegment(0, pct);
    }
}
