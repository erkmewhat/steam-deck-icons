import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderTireWear } from "../telemetry/svg-renderer.js";

@action({ UUID: "com.simracing.lmu.tire-wear" })
export class TireWearDisplay extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderTireWear(state.tireWear);
    }
}
