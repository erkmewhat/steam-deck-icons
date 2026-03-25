import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderSingleTire } from "../telemetry/svg-renderer.js";

const OPT_MIN = 145;
const OPT_MAX = 165;

@action({ UUID: "com.simracing.lmu.tire-rl" })
export class TireRL extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderSingleTire("RL", state.tirePressures[2], state.tireTemps[2], state.tireWear[2], OPT_MIN, OPT_MAX);
    }
}
