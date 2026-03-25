import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderPosition } from "../telemetry/svg-renderer.js";

@action({ UUID: "com.simracing.lmu.position-display" })
export class PositionDisplay extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderPosition(state.position, state.gap);
    }
}
