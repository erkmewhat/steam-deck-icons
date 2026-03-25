import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderTireTemp } from "../telemetry/svg-renderer.js";

@action({ UUID: "com.simracing.lmu.tire-temp" })
export class TireTemp extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderTireTemp(state.tireTemps);
    }
}
