import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderSingleTire } from "../telemetry/svg-renderer.js";

const OPT_MIN = 145;
const OPT_MAX = 165;

@action({ UUID: "com.simracing.lmu.tire-rr" })
export class TireRR extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderSingleTire("RR", state.tirePressures[3], state.tireTemps[3], state.tireWear[3], OPT_MIN, OPT_MAX);
    }
}
