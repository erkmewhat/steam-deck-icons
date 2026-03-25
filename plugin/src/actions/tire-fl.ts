import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderSingleTire } from "../telemetry/svg-renderer.js";

const OPT_MIN = 145;
const OPT_MAX = 165;

@action({ UUID: "com.simracing.lmu.tire-fl" })
export class TireFL extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderSingleTire("FL", state.tirePressures[0], state.tireTemps[0], state.tireWear[0], OPT_MIN, OPT_MAX);
    }
}
