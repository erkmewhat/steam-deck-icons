import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderFuelGauge } from "../telemetry/svg-renderer.js";

@action({ UUID: "com.simracing.lmu.fuel-display" })
export class FuelDisplay extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderFuelGauge(state.fuel, state.fuelCapacity, state.lapsOfFuel);
    }
}
