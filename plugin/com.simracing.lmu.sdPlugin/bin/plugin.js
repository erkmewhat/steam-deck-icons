import streamDeck from "@elgato/streamdeck";
import { PitLimiter } from "./actions/pit-limiter.js";
import { Headlights } from "./actions/headlights.js";
import { HeadlightFlash } from "./actions/headlight-flash.js";
import { Wipers } from "./actions/wipers.js";
import { Ignition } from "./actions/ignition.js";
import { Starter } from "./actions/starter.js";
import { RequestPitstop } from "./actions/request-pitstop.js";
import { AiTakeover } from "./actions/ai-takeover.js";
import { MfdNext } from "./actions/mfd-next.js";
import { MfdUp } from "./actions/mfd-up.js";
import { MfdDown } from "./actions/mfd-down.js";
import { MfdIncrease } from "./actions/mfd-increase.js";
import { MfdDecrease } from "./actions/mfd-decrease.js";
import { BrakeBiasForward } from "./actions/brake-bias-fwd.js";
import { BrakeBiasBackward } from "./actions/brake-bias-bwd.js";
import { TcIncrease } from "./actions/tc-increase.js";
import { TcDecrease } from "./actions/tc-decrease.js";
import { AbsIncrease } from "./actions/abs-increase.js";
import { AbsDecrease } from "./actions/abs-decrease.js";
import { MotorMapUp } from "./actions/motor-map-up.js";
import { MotorMapDown } from "./actions/motor-map-down.js";
import { LookLeft } from "./actions/look-left.js";
import { LookRight } from "./actions/look-right.js";
import { LookBehind } from "./actions/look-behind.js";
// Telemetry display actions
import { telemetryManager } from "./telemetry/telemetry-manager.js";
import { FuelDisplay } from "./actions/fuel-display.js";
import { FuelCalc } from "./actions/fuel-calc.js";
import { TireFL } from "./actions/tire-fl.js";
import { TireFR } from "./actions/tire-fr.js";
import { TireRL } from "./actions/tire-rl.js";
import { TireRR } from "./actions/tire-rr.js";
import { FlagDisplay } from "./actions/flag-display.js";
import { PositionDisplay } from "./actions/position-display.js";
import { LapDelta } from "./actions/lap-delta.js";
import { BatteryDisplay } from "./actions/battery-display.js";
import { PitStateDisplay } from "./actions/pit-state-display.js";
import { GearDisplay } from "./actions/gear-display.js";
// streamDeck.logger.setLevel("TRACE");
streamDeck.logger.info("=== LMU Plugin starting, registering actions ===");
// Log ALL incoming events for debugging
streamDeck.actions.onWillAppear((ev) => {
    streamDeck.logger.info(`=== GLOBAL willAppear: ${ev.action.manifestId} ===`);
});
streamDeck.actions.onKeyDown((ev) => {
    streamDeck.logger.info(`=== GLOBAL keyDown: ${ev.action.manifestId} ===`);
});
// Car Systems
streamDeck.actions.registerAction(new PitLimiter());
const hl = new Headlights();
streamDeck.logger.info(`Headlights manifestId: ${hl.manifestId}`);
streamDeck.actions.registerAction(hl);
streamDeck.actions.registerAction(new HeadlightFlash());
streamDeck.actions.registerAction(new Wipers());
streamDeck.actions.registerAction(new Ignition());
streamDeck.actions.registerAction(new Starter());
streamDeck.actions.registerAction(new RequestPitstop());
streamDeck.actions.registerAction(new AiTakeover());
// MFD Navigation
streamDeck.actions.registerAction(new MfdNext());
streamDeck.actions.registerAction(new MfdUp());
streamDeck.actions.registerAction(new MfdDown());
streamDeck.actions.registerAction(new MfdIncrease());
streamDeck.actions.registerAction(new MfdDecrease());
// Performance Adjustments
streamDeck.actions.registerAction(new BrakeBiasForward());
streamDeck.actions.registerAction(new BrakeBiasBackward());
streamDeck.actions.registerAction(new TcIncrease());
streamDeck.actions.registerAction(new TcDecrease());
streamDeck.actions.registerAction(new AbsIncrease());
streamDeck.actions.registerAction(new AbsDecrease());
streamDeck.actions.registerAction(new MotorMapUp());
streamDeck.actions.registerAction(new MotorMapDown());
// Camera
streamDeck.actions.registerAction(new LookLeft());
streamDeck.actions.registerAction(new LookRight());
streamDeck.actions.registerAction(new LookBehind());
// Telemetry displays
streamDeck.actions.registerAction(new FuelDisplay());
streamDeck.actions.registerAction(new FuelCalc());
streamDeck.actions.registerAction(new TireFL());
streamDeck.actions.registerAction(new TireFR());
streamDeck.actions.registerAction(new TireRL());
streamDeck.actions.registerAction(new TireRR());
streamDeck.actions.registerAction(new FlagDisplay());
streamDeck.actions.registerAction(new PositionDisplay());
streamDeck.actions.registerAction(new LapDelta());
streamDeck.actions.registerAction(new BatteryDisplay());
streamDeck.actions.registerAction(new PitStateDisplay());
streamDeck.actions.registerAction(new GearDisplay());
// Start telemetry polling (connects to rF2 shared memory when LMU is running)
telemetryManager.start();
streamDeck.logger.info("=== Telemetry manager started ===");
streamDeck.connect();
