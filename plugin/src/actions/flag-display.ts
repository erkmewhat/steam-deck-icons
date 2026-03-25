import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderFlag } from "../telemetry/svg-renderer.js";

@action({ UUID: "com.simracing.lmu.flag-display" })
export class FlagDisplay extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderFlag(state.flag);
    }
}
