import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderTirePressure } from "../telemetry/svg-renderer.js";

// Default optimal pressure range for LMU prototypes (kPa)
// ~138-165 kPa = ~20-24 PSI — typical for GT/prototype tires
const OPT_MIN_KPA = 145;
const OPT_MAX_KPA = 165;

@action({ UUID: "com.simracing.lmu.tire-pressure" })
export class TirePressure extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderTirePressure(state.tirePressures, OPT_MIN_KPA, OPT_MAX_KPA);
    }
}
