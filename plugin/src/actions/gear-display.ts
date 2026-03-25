import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderGear } from "../telemetry/svg-renderer.js";

@action({ UUID: "com.simracing.lmu.gear-display" })
export class GearDisplay extends TelemetryActionBase {
    render(state: TelemetryState): string {
        const pct = state.maxRpm > 0 ? state.rpm / state.maxRpm : 0;
        return renderGear(state.gear, pct);
    }
}
