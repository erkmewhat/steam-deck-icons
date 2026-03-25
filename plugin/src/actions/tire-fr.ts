import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderSingleTire } from "../telemetry/svg-renderer.js";

const OPT_MIN = 145;
const OPT_MAX = 165;

@action({ UUID: "com.simracing.lmu.tire-fr" })
export class TireFR extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderSingleTire("FR", state.tirePressures[1], state.tireTemps[1], state.tireWear[1], OPT_MIN, OPT_MAX);
    }
}
