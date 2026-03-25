import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderBattery, renderBatteryNA } from "../telemetry/svg-renderer.js";

@action({ UUID: "com.simracing.lmu.battery-display" })
export class BatteryDisplay extends TelemetryActionBase {
    render(state: TelemetryState): string {
        if (state.battery < 0) return renderBatteryNA();
        return renderBattery(state.battery);
    }
}
