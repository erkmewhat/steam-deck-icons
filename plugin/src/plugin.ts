import streamDeck from "@elgato/streamdeck";

import { PitLimiter } from "./actions/pit-limiter";
import { Headlights } from "./actions/headlights";
import { HeadlightFlash } from "./actions/headlight-flash";
import { Wipers } from "./actions/wipers";
import { Ignition } from "./actions/ignition";
import { Starter } from "./actions/starter";
import { RequestPitstop } from "./actions/request-pitstop";
import { AiTakeover } from "./actions/ai-takeover";
import { MfdNext } from "./actions/mfd-next";
import { MfdUp } from "./actions/mfd-up";
import { MfdDown } from "./actions/mfd-down";
import { MfdIncrease } from "./actions/mfd-increase";
import { MfdDecrease } from "./actions/mfd-decrease";
import { BrakeBiasForward } from "./actions/brake-bias-fwd";
import { BrakeBiasBackward } from "./actions/brake-bias-bwd";
import { TcIncrease } from "./actions/tc-increase";
import { TcDecrease } from "./actions/tc-decrease";
import { AbsIncrease } from "./actions/abs-increase";
import { AbsDecrease } from "./actions/abs-decrease";
import { MotorMapUp } from "./actions/motor-map-up";
import { MotorMapDown } from "./actions/motor-map-down";
import { LookLeft } from "./actions/look-left";
import { LookRight } from "./actions/look-right";
import { LookBehind } from "./actions/look-behind";

// Telemetry display actions
import { telemetryManager } from "./telemetry/telemetry-manager";
import { FuelDisplay } from "./actions/fuel-display";
import { FuelCalc } from "./actions/fuel-calc";
import { TireFL } from "./actions/tire-fl";
import { TireFR } from "./actions/tire-fr";
import { TireRL } from "./actions/tire-rl";
import { TireRR } from "./actions/tire-rr";
import { FlagDisplay } from "./actions/flag-display";
import { PositionDisplay } from "./actions/position-display";
import { LapDelta } from "./actions/lap-delta";
import { BatteryDisplay } from "./actions/battery-display";
import { PitStateDisplay } from "./actions/pit-state-display";
import { RpmSeg1 } from "./actions/rpm-seg1";
import { RpmSeg2 } from "./actions/rpm-seg2";
import { RpmSeg3 } from "./actions/rpm-seg3";
import { RpmSeg4 } from "./actions/rpm-seg4";
import { RpmSeg5 } from "./actions/rpm-seg5";

// streamDeck.logger.setLevel("TRACE");

streamDeck.logger.info("=== LMU Plugin starting, registering actions ===");

// Log ALL incoming events for debugging
streamDeck.actions.onWillAppear((ev: any) => {
    streamDeck.logger.info(`=== GLOBAL willAppear: ${ev.action.manifestId} ===`);
});

streamDeck.actions.onKeyDown((ev: any) => {
    streamDeck.logger.info(`=== GLOBAL keyDown: ${ev.action.manifestId} ===`);
});

// Car Systems
streamDeck.actions.registerAction(new PitLimiter());
const hl = new Headlights();
streamDeck.logger.info(`Headlights manifestId: ${(hl as any).manifestId}`);
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
streamDeck.actions.registerAction(new RpmSeg1());
streamDeck.actions.registerAction(new RpmSeg2());
streamDeck.actions.registerAction(new RpmSeg3());
streamDeck.actions.registerAction(new RpmSeg4());
streamDeck.actions.registerAction(new RpmSeg5());

// Start telemetry polling (connects to rF2 shared memory when LMU is running)
telemetryManager.start();
streamDeck.logger.info("=== Telemetry manager started ===");

streamDeck.connect();
