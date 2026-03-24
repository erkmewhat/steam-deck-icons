import { action } from "@elgato/streamdeck";
import { CycleAction } from "./cycle-action";

@action({ UUID: "com.simracing.lmu.wipers" })
export class Wipers extends CycleAction {
    readonly defaultHotkey = "P";
    readonly actionName = "Wipers";
    readonly cycleStates = [
        { image: "imgs/actions/wipers", title: "WIPERS\nOFF" },
        { image: "imgs/actions/wipers-auto", title: "AUTO\nWIPERS" },
        { image: "imgs/actions/wipers-slow", title: "SLOW\nWIPERS" },
        { image: "imgs/actions/wipers-on", title: "FAST\nWIPERS" },
    ];
}
