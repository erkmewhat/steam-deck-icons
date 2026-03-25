import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderLapDelta } from "../telemetry/svg-renderer.js";

@action({ UUID: "com.simracing.lmu.lap-delta" })
export class LapDelta extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderLapDelta(state.lapDelta);
    }
}
