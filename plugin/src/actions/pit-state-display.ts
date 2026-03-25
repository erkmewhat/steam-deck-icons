import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderPitState } from "../telemetry/svg-renderer.js";

@action({ UUID: "com.simracing.lmu.pit-state" })
export class PitStateDisplay extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderPitState(state.pitState, state.inPits);
    }
}
