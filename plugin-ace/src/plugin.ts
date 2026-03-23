import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { PitLimiter } from "./actions/pit-limiter";
import { Headlights } from "./actions/headlights";
import { HeadlightFlash } from "./actions/headlight-flash";
import { RainLights } from "./actions/rain-lights";
import { Wipers } from "./actions/wipers";
import { Ignition } from "./actions/ignition";
import { Starter } from "./actions/starter";
import { HazardLights } from "./actions/hazard-lights";
import { Horn } from "./actions/horn";
import { LookLeft } from "./actions/look-left";
import { LookRight } from "./actions/look-right";
import { LookBehind } from "./actions/look-behind";
import { DisplayPage } from "./actions/display-page";
import { DisplayDevice } from "./actions/display-device";
import { TcIncrease } from "./actions/tc-increase";
import { TcDecrease } from "./actions/tc-decrease";
import { AbsIncrease } from "./actions/abs-increase";
import { AbsDecrease } from "./actions/abs-decrease";
import { EngineMapUp } from "./actions/engine-map-up";
import { EngineMapDown } from "./actions/engine-map-down";
import { BrakeBiasFwd } from "./actions/brake-bias-fwd";
import { BrakeBiasBwd } from "./actions/brake-bias-bwd";

streamDeck.logger.setLevel(LogLevel.DEBUG);

// Car Systems
streamDeck.actions.registerAction(new PitLimiter());
streamDeck.actions.registerAction(new Headlights());
streamDeck.actions.registerAction(new HeadlightFlash());
streamDeck.actions.registerAction(new RainLights());
streamDeck.actions.registerAction(new Wipers());
streamDeck.actions.registerAction(new Ignition());
streamDeck.actions.registerAction(new Starter());
streamDeck.actions.registerAction(new HazardLights());
streamDeck.actions.registerAction(new Horn());

// Camera
streamDeck.actions.registerAction(new LookLeft());
streamDeck.actions.registerAction(new LookRight());
streamDeck.actions.registerAction(new LookBehind());

// Display
streamDeck.actions.registerAction(new DisplayPage());
streamDeck.actions.registerAction(new DisplayDevice());

// Performance Adjustments
streamDeck.actions.registerAction(new TcIncrease());
streamDeck.actions.registerAction(new TcDecrease());
streamDeck.actions.registerAction(new AbsIncrease());
streamDeck.actions.registerAction(new AbsDecrease());
streamDeck.actions.registerAction(new EngineMapUp());
streamDeck.actions.registerAction(new EngineMapDown());
streamDeck.actions.registerAction(new BrakeBiasFwd());
streamDeck.actions.registerAction(new BrakeBiasBwd());

streamDeck.connect();
