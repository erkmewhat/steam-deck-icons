/**
 * Central telemetry polling and state management.
 * Reads rF2 shared memory at 5Hz, caches parsed values, computes derived data,
 * and notifies registered actions when values change.
 */
import { RF2SharedMemory } from "./rf2-shared-memory.js";
import { VEHICLE_TELEMETRY as VT, VEHICLE_SCORING as VS, SCORING_INFO as SI, WHEEL, telemetryOffset, scoringInfoOffset, vehicleScoringOffset, wheelOffset, } from "./rf2-offsets.js";
/** Convert rF2 flag byte to string. */
function flagToString(flagByte, yellowState, gamePhase) {
    // Game phase 8 = session over (checkered)
    if (gamePhase === 8)
        return "checkered";
    // Yellow flag states
    if (yellowState >= 3)
        return "yellow"; // full course yellow/caution
    // Per-vehicle flags
    switch (flagByte) {
        case 6: return "blue";
        case 4: return "yellow";
        case 1: return "red";
        default: break;
    }
    return "green";
}
/** Kelvin to Celsius. */
function kToC(kelvin) {
    return kelvin - 273.15;
}
export class TelemetryManager {
    shm = new RF2SharedMemory();
    pollTimer = null;
    listeners = new Set();
    fuelSamples = [];
    lastLapFuel = -1;
    state = this.defaultState();
    defaultState() {
        return {
            available: false,
            fuel: 0, fuelCapacity: 0, fuelPerLap: 0, lapsOfFuel: 0,
            tirePressures: [0, 0, 0, 0],
            tireTemps: [0, 0, 0, 0],
            tireWear: [0, 0, 0, 0],
            gear: 0, rpm: 0, maxRpm: 0,
            ignition: 0, pitLimiter: false, headlights: false,
            battery: -1,
            flag: "none", position: 0, gap: 0,
            bestLap: 0, lastLap: 0, estimatedLap: 0, lapDelta: 0,
            pitState: 0, inPits: false, totalLaps: 0,
        };
    }
    /** Start polling at the given interval (default 200ms = 5Hz). */
    start(intervalMs = 200) {
        this.shm.connect();
        this.shm.startAutoReconnect(5000);
        this.pollTimer = setInterval(() => this.poll(), intervalMs);
    }
    /** Stop polling and disconnect. */
    stop() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        this.shm.disconnect();
    }
    /** Register a listener for state changes. */
    subscribe(listener) {
        this.listeners.add(listener);
    }
    /** Unregister a listener. */
    unsubscribe(listener) {
        this.listeners.delete(listener);
    }
    /** Single poll tick — read shared memory, parse, compute derived, notify. */
    poll() {
        const telView = this.shm.readTelemetry();
        const scrView = this.shm.readScoring();
        if (!telView) {
            if (this.state.available) {
                this.state = this.defaultState();
                this.notify();
            }
            return;
        }
        const prev = this.state;
        const s = { ...this.defaultState(), available: true };
        // ── Parse telemetry buffer ──────────────────────────────────
        // Player vehicle is at index 0 in the vehicles array.
        const vi = 0; // vehicle index
        s.fuel = telView.getFloat64(telemetryOffset(vi, VT.mFuel), true);
        s.fuelCapacity = telView.getFloat64(telemetryOffset(vi, VT.mFuelCapacity), true);
        s.gear = telView.getInt32(telemetryOffset(vi, VT.mGear), true);
        s.rpm = telView.getFloat64(telemetryOffset(vi, VT.mEngineRPM), true);
        s.maxRpm = telView.getFloat64(telemetryOffset(vi, VT.mEngineMaxRPM), true);
        s.ignition = telView.getUint8(telemetryOffset(vi, VT.mIgnitionStarter));
        s.pitLimiter = telView.getUint8(telemetryOffset(vi, VT.mSpeedLimiter)) !== 0;
        s.headlights = telView.getUint8(telemetryOffset(vi, VT.mHeadlights)) !== 0;
        s.battery = telView.getFloat64(telemetryOffset(vi, VT.mBatteryChargeFraction), true);
        // If battery is exactly 0 and fuel capacity > 0, likely not a hybrid car
        if (s.battery === 0 && s.fuelCapacity > 0)
            s.battery = -1;
        // Wheels: FL=0, FR=1, RL=2, RR=3
        for (let i = 0; i < 4; i++) {
            s.tirePressures[i] = telView.getFloat64(wheelOffset(vi, i, WHEEL.mPressure), true);
            // Average the 3 surface temp readings (left/center/right), convert K→C
            const tempBase = wheelOffset(vi, i, WHEEL.mTemperature);
            const tL = telView.getFloat64(tempBase, true);
            const tC = telView.getFloat64(tempBase + 8, true);
            const tR = telView.getFloat64(tempBase + 16, true);
            s.tireTemps[i] = kToC((tL + tC + tR) / 3);
            s.tireWear[i] = telView.getFloat64(wheelOffset(vi, i, WHEEL.mWear), true);
        }
        // ── Parse scoring buffer ────────────────────────────────────
        if (scrView) {
            const gamePhase = scrView.getUint8(scoringInfoOffset(SI.mGamePhase));
            const yellowState = scrView.getInt8(scoringInfoOffset(SI.mYellowFlagState));
            // Player vehicle scoring (first vehicle in the array, index 0)
            s.position = scrView.getUint8(vehicleScoringOffset(vi, VS.mPlace));
            s.totalLaps = scrView.getInt16(vehicleScoringOffset(vi, VS.mTotalLaps), true);
            s.bestLap = scrView.getFloat64(vehicleScoringOffset(vi, VS.mBestLapTime), true);
            s.lastLap = scrView.getFloat64(vehicleScoringOffset(vi, VS.mLastLapTime), true);
            s.estimatedLap = scrView.getFloat64(vehicleScoringOffset(vi, VS.mEstimatedLapTime), true);
            s.pitState = scrView.getUint8(vehicleScoringOffset(vi, VS.mPitState));
            s.inPits = scrView.getUint8(vehicleScoringOffset(vi, VS.mInPits)) !== 0;
            s.gap = scrView.getFloat64(vehicleScoringOffset(vi, VS.mTimeBehindNext), true);
            const flagByte = scrView.getUint8(vehicleScoringOffset(vi, VS.mFlag));
            s.flag = flagToString(flagByte, yellowState, gamePhase);
            // Lap delta: estimated current lap - best lap (negative = faster)
            if (s.bestLap > 0 && s.estimatedLap > 0) {
                s.lapDelta = s.estimatedLap - s.bestLap;
            }
        }
        // ── Compute fuel per lap (rolling average) ──────────────────
        // Track fuel at start of each lap; when lap completes, record consumption
        if (s.totalLaps > prev.totalLaps && prev.available && s.totalLaps > 0) {
            if (this.lastLapFuel > 0) {
                const consumed = this.lastLapFuel - s.fuel;
                if (consumed > 0 && consumed < s.fuelCapacity) {
                    this.fuelSamples.push(consumed);
                    // Keep last 10 laps for rolling average
                    if (this.fuelSamples.length > 10)
                        this.fuelSamples.shift();
                }
            }
            this.lastLapFuel = s.fuel;
        }
        if (this.fuelSamples.length > 0) {
            s.fuelPerLap = this.fuelSamples.reduce((a, b) => a + b, 0) / this.fuelSamples.length;
            s.lapsOfFuel = s.fuelPerLap > 0 ? s.fuel / s.fuelPerLap : 999;
        }
        this.state = s;
        this.notify();
    }
    notify() {
        for (const listener of this.listeners) {
            try {
                listener(this.state);
            }
            catch {
                // Don't let one bad listener break the loop
            }
        }
    }
}
/** Singleton telemetry manager instance. */
export const telemetryManager = new TelemetryManager();
