import { action } from "@elgato/streamdeck";
import { TelemetryActionBase } from "./telemetry-action.js";
import type { TelemetryState } from "../telemetry/telemetry-manager.js";
import { renderFuelCalc } from "../telemetry/svg-renderer.js";

@action({ UUID: "com.simracing.lmu.fuel-calc" })
export class FuelCalc extends TelemetryActionBase {
    render(state: TelemetryState): string {
        return renderFuelCalc(state.lapsOfFuel, state.fuelPerLap * 10, state.fuelPerLap);
    }
}
