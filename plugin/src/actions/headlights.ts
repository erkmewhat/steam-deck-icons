import { action } from "@elgato/streamdeck";
import { CycleAction } from "./cycle-action";

@action({ UUID: "com.simracing.lmu.headlights" })
export class Headlights extends CycleAction {
    readonly defaultHotkey = "H";
    readonly actionName = "Headlights";
    readonly cycleStates = [
        { image: "imgs/actions/headlights", title: "LIGHTS\nOFF" },
        { image: "imgs/actions/headlights-auto", title: "AUTO\nLIGHTS" },
        { image: "imgs/actions/headlights-on", title: "LIGHTS\nON" },
    ];
}
