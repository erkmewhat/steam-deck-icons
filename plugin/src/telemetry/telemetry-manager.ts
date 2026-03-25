/**
 * Central telemetry polling and state management.
 * Reads rF2 shared memory at 5Hz, caches parsed values, computes derived data,
 * and notifies registered actions when values change.
 */
import { RF2SharedMemory } from "./rf2-shared-memory.js";
import {
    VEHICLE_TELEMETRY as VT, VEHICLE_SCORING as VS, SCORING_INFO as SI,
    WHEEL, RF2_WHEEL_SIZE, RF2_GAME_PHASE,
    TELEMETRY_BUFFER as TB, RF2_VEHICLE_TELEMETRY_SIZE,
    telemetryOffset, scoringInfoOffset, vehicleScoringOffset, wheelOffset,
} from "./rf2-offsets.js";

/** Flat telemetry state object — all values an action might need. */
export interface TelemetryState {
    available: boolean;

    // Fuel
    fuel: number;              // liters
    fuelCapacity: number;      // liters
    fuelPerLap: number;        // derived: rolling average L/lap
    lapsOfFuel: number;        // derived: fuel / fuelPerLap

    // Tires (FL, FR, RL, RR)
    tirePressures: [number, number, number, number];   // kPa
    tireTemps: [number, number, number, number];       // Celsius (avg surface)
    tireWear: [number, number, number, number];        // 0.0-1.0

    // Car state
    gear: number;
    rpm: number;
    maxRpm: number;
    ignition: number;          // 0=off, 1=ign, 2=ign+starter
    pitLimiter: boolean;
    headlights: boolean;

    // Hybrid
    battery: number;           // 0.0-1.0, -1 if not available

    // Session / scoring
    flag: string;              // "green", "yellow", "blue", "red", "white", "checkered", "none"
    position: number;          // 1-based
    gap: number;               // seconds behind car ahead
    bestLap: number;           // seconds
    lastLap: number;           // seconds
    estimatedLap: number;      // seconds
    lapDelta: number;          // derived: estimated - best (negative = faster)
    pitState: number;          // 0-4
    inPits: boolean;
    totalLaps: number;
}

type Listener = (state: TelemetryState) => void;

/** Convert rF2 flag byte to string. */
function flagToString(
    flagByte: number,
    yellowState: number,
    gamePhase: number,
    sectorFlags: [number, number, number],
): string {
    // Game phase 8 = session over (checkered)
    if (gamePhase === 8) return "checkered";

    // Game phase 6 = full course yellow
    if (gamePhase === RF2_GAME_PHASE.FULL_COURSE_YELLOW) return "yellow";

    // Any non-zero yellowFlagState means some form of yellow is active
    // 1=pending, 2=pit closed, 3=pit lead lap, 4=pit open, 5=last lap, 6=resume, 7=race halt
    if (yellowState > 0) return "yellow";

    // Local sector yellows — any sector showing yellow
    if (sectorFlags[0] > 0 || sectorFlags[1] > 0 || sectorFlags[2] > 0) return "yellow";

    // Per-vehicle flags (from rF2PrimaryFlag enum)
    if (flagByte === 6) return "blue";

    // rF2 doesn't define a yellow primary flag — yellows come from the above checks
    return "green";
}

/** Kelvin to Celsius. */
function kToC(kelvin: number): number {
    return kelvin - 273.15;
}

export class TelemetryManager {
    private shm = new RF2SharedMemory();
    private pollTimer: ReturnType<typeof setInterval> | null = null;
    private listeners = new Set<Listener>();
    private fuelSamples: number[] = [];
    private lastLapFuel = -1;

    state: TelemetryState = this.defaultState();

    private defaultState(): TelemetryState {
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
    start(intervalMs: number = 200): void {
        this.shm.connect();
        this.shm.startAutoReconnect(5000);

        this.pollTimer = setInterval(() => this.poll(), intervalMs);
    }

    /** Stop polling and disconnect. */
    stop(): void {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        this.shm.disconnect();
    }

    /** Register a listener for state changes. */
    subscribe(listener: Listener): void {
        this.listeners.add(listener);
    }

    /** Unregister a listener. */
    unsubscribe(listener: Listener): void {
        this.listeners.delete(listener);
    }

    /** Single poll tick — read shared memory, parse, compute derived, notify. */
    private poll(): void {
        const telView = this.shm.readTelemetry();
        const scrView = this.shm.readScoring();

        // If both buffers are unavailable, check if the mapping itself is gone
        if (!telView && !scrView) {
            if (!this.shm.isAvailable) {
                // LMU truly not running — show NO DATA
                if (this.state.available) {
                    this.state = this.defaultState();
                    this.notify();
                }
            }
            // Otherwise it's just a torn frame — keep previous state, skip this tick
            return;
        }

        // If only telemetry is torn but scoring is fine (or vice versa),
        // still skip — we need consistent data
        if (!telView) return;

        const prev = this.state;
        const s: TelemetryState = { ...this.defaultState(), available: true };

        // ── Find player vehicle in scoring (by mIsPlayer flag) ────────
        let playerScoringIdx = -1;
        let playerID = -1;
        if (scrView) {
            const numVehicles = scrView.getInt32(scoringInfoOffset(SI.mNumVehicles), true);
            const count = Math.min(numVehicles, 128);
            for (let i = 0; i < count; i++) {
                const isPlayer = scrView.getUint8(vehicleScoringOffset(i, VS.mIsPlayer));
                if (isPlayer) {
                    playerScoringIdx = i;
                    playerID = scrView.getInt32(vehicleScoringOffset(i, VS.mID), true);
                    break;
                }
            }
        }

        // ── Find player vehicle in telemetry (by matching mID) ──────
        // Vehicle order differs between buffers — must match by ID.
        let vi = 0;
        if (playerID >= 0) {
            const numTelVehicles = telView.getInt32(TB.NUM_VEHICLES, true);
            const count = Math.min(numTelVehicles, 128);
            for (let i = 0; i < count; i++) {
                const id = telView.getInt32(telemetryOffset(i, VT.mID), true);
                if (id === playerID) {
                    vi = i;
                    break;
                }
            }
        }

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
        if (s.battery === 0 && s.fuelCapacity > 0) s.battery = -1;

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

        // ── Parse scoring buffer (using found player index) ─────────
        if (scrView && playerScoringIdx >= 0) {
            const pi = playerScoringIdx;
            const gamePhase = scrView.getUint8(scoringInfoOffset(SI.mGamePhase));
            const yellowState = scrView.getInt8(scoringInfoOffset(SI.mYellowFlagState));
            const sectorFlags: [number, number, number] = [
                scrView.getInt8(scoringInfoOffset(SI.mSectorFlag)),
                scrView.getInt8(scoringInfoOffset(SI.mSectorFlag) + 1),
                scrView.getInt8(scoringInfoOffset(SI.mSectorFlag) + 2),
            ];

            s.position = scrView.getUint8(vehicleScoringOffset(pi, VS.mPlace));
            s.totalLaps = scrView.getInt16(vehicleScoringOffset(pi, VS.mTotalLaps), true);
            s.bestLap = scrView.getFloat64(vehicleScoringOffset(pi, VS.mBestLapTime), true);
            s.lastLap = scrView.getFloat64(vehicleScoringOffset(pi, VS.mLastLapTime), true);
            s.estimatedLap = scrView.getFloat64(vehicleScoringOffset(pi, VS.mEstimatedLapTime), true);
            s.pitState = scrView.getUint8(vehicleScoringOffset(pi, VS.mPitState));
            s.inPits = scrView.getUint8(vehicleScoringOffset(pi, VS.mInPits)) !== 0;
            s.gap = scrView.getFloat64(vehicleScoringOffset(pi, VS.mTimeBehindNext), true);

            const flagByte = scrView.getUint8(vehicleScoringOffset(pi, VS.mFlag));
            s.flag = flagToString(flagByte, yellowState, gamePhase, sectorFlags);

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
                    if (this.fuelSamples.length > 10) this.fuelSamples.shift();
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

    private notify(): void {
        for (const listener of this.listeners) {
            try {
                listener(this.state);
            } catch {
                // Don't let one bad listener break the loop
            }
        }
    }
}

/** Singleton telemetry manager instance. */
export const telemetryManager = new TelemetryManager();
