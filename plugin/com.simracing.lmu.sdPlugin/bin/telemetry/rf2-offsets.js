/**
 * Byte offsets for rFactor 2 / LMU shared memory structures.
 *
 * Calculated from the official C++ header:
 *   https://github.com/TheIronWolfModding/rF2SharedMemoryMapPlugin/blob/master/Include/rF2State.h
 * Cross-referenced against the C# port:
 *   https://github.com/TheIronWolfModding/rF2SharedMemoryMapPlugin/blob/master/Monitor/rF2SMMonitor/rF2SMMonitor/rF2Data.cs
 *
 * All structs use #pragma pack(push, 4):
 *   - Alignment = min(natural_alignment, 4)
 *   - double (8 bytes) aligns to 4, not 8
 *   - Windows C++ `long` = 4 bytes (int32)
 *   - bool/unsigned char = 1 byte, no alignment padding
 *
 * These offsets are for x64 builds (pointer fields are 8 bytes).
 */
// ─── Struct Sizes ──────────────────────────────────────────────────────────────
export const RF2_WHEEL_SIZE = 260;
export const RF2_VEHICLE_TELEMETRY_SIZE = 1888;
export const RF2_SCORING_INFO_SIZE = 548;
export const RF2_VEHICLE_SCORING_SIZE = 584;
export const MAX_MAPPED_VEHICLES = 128;
// ─── Buffer Layout ─────────────────────────────────────────────────────────────
//
// rF2Telemetry buffer:
//   [0]   rF2MappedBufferVersionBlockWithSize (12 bytes: 2x uint32 + 1x int32)
//   [12]  mNumVehicles (int32, 4 bytes)
//   [16]  mVehicles[128] (128 x 1888 = 241664 bytes)
//   Total: 241680 bytes
//
// rF2Scoring buffer:
//   [0]   rF2MappedBufferVersionBlockWithSize (12 bytes)
//   [12]  rF2ScoringInfo (548 bytes)
//   [560] mVehicles[128] (128 x 584 = 74752 bytes)
//   Total: 75312 bytes
//
export const BUFFER = {
    /** Offset of mVersionUpdateBegin (uint32) */
    VERSION_BEGIN: 0,
    /** Offset of mVersionUpdateEnd (uint32) */
    VERSION_END: 4,
    /** Offset of mBytesUpdatedHint (int32) — only in VersionBlockWithSize */
    BYTES_UPDATED_HINT: 8,
    /** Size of rF2MappedBufferVersionBlockWithSize */
    VERSION_BLOCK_SIZE: 12,
};
export const TELEMETRY_BUFFER = {
    /** Offset of mNumVehicles (int32) within the telemetry mapped buffer */
    NUM_VEHICLES: 12,
    /** Offset of mVehicles[0] within the telemetry mapped buffer */
    VEHICLES_START: 16,
};
export const SCORING_BUFFER = {
    /** Offset of rF2ScoringInfo within the scoring mapped buffer */
    SCORING_INFO_START: 12,
    /** Offset of mVehicles[0] within the scoring mapped buffer */
    VEHICLES_START: 12 + RF2_SCORING_INFO_SIZE, // 560
};
// ─── rF2Wheel (260 bytes) ──────────────────────────────────────────────────────
// Offsets relative to the start of an rF2Wheel struct.
export const WHEEL = {
    mSuspensionDeflection: 0, // double
    mRideHeight: 8, // double
    mSuspForce: 16, // double
    mBrakeTemp: 24, // double
    mBrakePressure: 32, // double
    mRotation: 40, // double
    mLateralPatchVel: 48, // double
    mLongitudinalPatchVel: 56, // double
    mLateralGroundVel: 64, // double
    mLongitudinalGroundVel: 72, // double
    mCamber: 80, // double
    mLateralForce: 88, // double
    mLongitudinalForce: 96, // double
    mTireLoad: 104, // double
    mGripFract: 112, // double
    mPressure: 120, // double  (kPa)
    mTemperature: 128, // double[3] (24 bytes — Kelvin, left/center/right)
    mWear: 152, // double  (0.0-1.0)
    mTerrainName: 160, // char[16]
    mSurfaceType: 176, // unsigned char
    mFlat: 177, // bool
    mDetached: 178, // bool
    mStaticUndeflectedRadius: 179, // unsigned char (cm)
    mVerticalTireDeflection: 180, // double
    mWheelYLocation: 188, // double
    mToe: 196, // double
    mTireCarcassTemperature: 204, // double (Kelvin)
    mTireInnerLayerTemperature: 212, // double[3] (24 bytes — Kelvin)
};
// ─── rF2VehicleTelemetry (1888 bytes) ──────────────────────────────────────────
// Offsets relative to the start of an rF2VehicleTelemetry struct.
export const VEHICLE_TELEMETRY = {
    // Time
    mID: 0, // long (int32)
    mDeltaTime: 4, // double
    mElapsedTime: 12, // double
    mLapNumber: 20, // long (int32)
    mLapStartET: 24, // double
    mVehicleName: 32, // char[64]
    mTrackName: 96, // char[64]
    // Position and derivatives
    mPos: 160, // rF2Vec3 (3 doubles, 24 bytes)
    mLocalVel: 184, // rF2Vec3
    mLocalAccel: 208, // rF2Vec3
    // Orientation and derivatives
    mOri: 232, // rF2Vec3[3] (72 bytes)
    mLocalRot: 304, // rF2Vec3
    mLocalRotAccel: 328, // rF2Vec3
    // Vehicle status
    mGear: 352, // long (int32) — -1=reverse, 0=neutral, 1+=forward
    mEngineRPM: 356, // double
    mEngineWaterTemp: 364, // double (Celsius)
    mEngineOilTemp: 372, // double (Celsius)
    mClutchRPM: 380, // double
    // Driver input (unfiltered)
    mUnfilteredThrottle: 388, // double (0.0-1.0)
    mUnfilteredBrake: 396, // double (0.0-1.0)
    mUnfilteredSteering: 404, // double (-1.0 to 1.0)
    mUnfilteredClutch: 412, // double (0.0-1.0)
    // Driver input (filtered)
    mFilteredThrottle: 420, // double
    mFilteredBrake: 428, // double
    mFilteredSteering: 436, // double
    mFilteredClutch: 444, // double
    // Misc
    mSteeringShaftTorque: 452, // double
    mFront3rdDeflection: 460, // double
    mRear3rdDeflection: 468, // double
    // Aerodynamics
    mFrontWingHeight: 476, // double
    mFrontRideHeight: 484, // double
    mRearRideHeight: 492, // double
    mDrag: 500, // double
    mFrontDownforce: 508, // double
    mRearDownforce: 516, // double
    // State/damage info
    mFuel: 524, // double (liters)
    mEngineMaxRPM: 532, // double (rev limit)
    mScheduledStops: 540, // unsigned char
    mOverheating: 541, // bool
    mDetached: 542, // bool
    mHeadlights: 543, // bool
    mDentSeverity: 544, // unsigned char[8]
    mLastImpactET: 552, // double
    mLastImpactMagnitude: 560, // double
    mLastImpactPos: 568, // rF2Vec3
    // Expanded
    mEngineTorque: 592, // double
    mCurrentSector: 600, // long (int32)
    mSpeedLimiter: 604, // unsigned char
    mMaxGears: 605, // unsigned char
    mFrontTireCompoundIndex: 606, // unsigned char
    mRearTireCompoundIndex: 607, // unsigned char
    mFuelCapacity: 608, // double (liters)
    mFrontFlapActivated: 616, // unsigned char
    mRearFlapActivated: 617, // unsigned char
    mRearFlapLegalStatus: 618, // unsigned char
    mIgnitionStarter: 619, // unsigned char (0=off, 1=ignition, 2=ignition+starter)
    mFrontTireCompoundName: 620, // char[18]
    mRearTireCompoundName: 638, // char[18]
    mSpeedLimiterAvailable: 656, // unsigned char
    mAntiStallActivated: 657, // unsigned char
    // mUnused[2] at 658
    mVisualSteeringWheelRange: 660, // float
    mRearBrakeBias: 664, // double
    mTurboBoostPressure: 672, // double
    mPhysicsToGraphicsOffset: 680, // float[3] (12 bytes)
    mPhysicalSteeringWheelRange: 692, // float
    mBatteryChargeFraction: 696, // double (0.0-1.0)
    // Electric boost motor
    mElectricBoostMotorTorque: 704, // double
    mElectricBoostMotorRPM: 712, // double
    mElectricBoostMotorTemperature: 720, // double
    mElectricBoostWaterTemperature: 728, // double
    mElectricBoostMotorState: 736, // unsigned char (0=unavailable, 1=inactive, 2=propulsion, 3=regen)
    // mExpansion[111] at 737
    // Wheel data (4 wheels x 260 bytes each = 1040 bytes)
    mWheels: 848, // rF2Wheel[4] — FL=0, FR=1, RL=2, RR=3
};
// ─── rF2ScoringInfo (548 bytes, x64) ──────────────────────────────────────────
// Offsets relative to the start of the rF2ScoringInfo struct
// (which starts at byte 12 within the scoring mapped buffer).
export const SCORING_INFO = {
    mTrackName: 0, // char[64]
    mSession: 64, // long (int32) — 0=testday, 1-4=practice, 5-8=qual, 9=warmup, 10-13=race
    mCurrentET: 68, // double (elapsed time)
    mEndET: 76, // double
    mMaxLaps: 84, // long (int32)
    mLapDist: 88, // double
    // pointer1[8] at 96
    mNumVehicles: 104, // long (int32)
    mGamePhase: 108, // unsigned char (0-9, see rF2GamePhase enum)
    mYellowFlagState: 109, // signed char (-1 to 7)
    mSectorFlag: 110, // signed char[3]
    mStartLight: 113, // unsigned char
    mNumRedLights: 114, // unsigned char
    mInRealtime: 115, // bool
    mPlayerName: 116, // char[32]
    mPlrFileName: 148, // char[64]
    // Weather
    mDarkCloud: 212, // double (0.0-1.0)
    mRaining: 220, // double (0.0-1.0)
    mAmbientTemp: 228, // double (Celsius)
    mTrackTemp: 236, // double (Celsius)
    mWind: 244, // rF2Vec3 (24 bytes)
    mMinPathWetness: 268, // double (0.0-1.0)
    mMaxPathWetness: 276, // double (0.0-1.0)
    // Multiplayer
    mGameMode: 284, // unsigned char
    mIsPasswordProtected: 285, // bool
    mServerPort: 286, // unsigned short
    mServerPublicIP: 288, // unsigned long (uint32)
    mMaxPlayers: 292, // long (int32)
    mServerName: 296, // char[32]
    mStartET: 328, // float
    mAvgPathWetness: 332, // double (0.0-1.0)
    // mExpansion[200] at 340
    // pointer2[8] at 540
};
// ─── rF2VehicleScoring (584 bytes) ─────────────────────────────────────────────
// Offsets relative to the start of an rF2VehicleScoring struct.
export const VEHICLE_SCORING = {
    mID: 0, // long (int32)
    mDriverName: 4, // char[32]
    mVehicleName: 36, // char[64]
    mTotalLaps: 100, // short (int16)
    mSector: 102, // signed char
    mFinishStatus: 103, // signed char (0=none, 1=finished, 2=dnf, 3=dq)
    mLapDist: 104, // double
    mPathLateral: 112, // double
    mTrackEdge: 120, // double
    mBestSector1: 128, // double
    mBestSector2: 136, // double
    mBestLapTime: 144, // double
    mLastSector1: 152, // double
    mLastSector2: 160, // double
    mLastLapTime: 168, // double
    mCurSector1: 176, // double
    mCurSector2: 184, // double
    mNumPitstops: 192, // short (int16)
    mNumPenalties: 194, // short (int16)
    mIsPlayer: 196, // bool
    mControl: 197, // signed char (-1=nobody, 0=player, 1=AI, 2=remote, 3=replay)
    mInPits: 198, // bool
    mPlace: 199, // unsigned char (1-based position)
    mVehicleClass: 200, // char[32]
    // Dash Indicators
    mTimeBehindNext: 232, // double
    mLapsBehindNext: 240, // long (int32)
    mTimeBehindLeader: 244, // double
    mLapsBehindLeader: 252, // long (int32)
    mLapStartET: 256, // double
    // Position and derivatives
    mPos: 264, // rF2Vec3 (24 bytes)
    mLocalVel: 288, // rF2Vec3
    mLocalAccel: 312, // rF2Vec3
    // Orientation
    mOri: 336, // rF2Vec3[3] (72 bytes)
    mLocalRot: 408, // rF2Vec3
    mLocalRotAccel: 432, // rF2Vec3
    mHeadlights: 456, // unsigned char
    mPitState: 457, // unsigned char (0=none, 1=request, 2=entering, 3=stopped, 4=exiting)
    mServerScored: 458, // unsigned char
    mIndividualPhase: 459, // unsigned char
    mQualification: 460, // long (int32)
    mTimeIntoLap: 464, // double
    mEstimatedLapTime: 472, // double
    mPitGroup: 480, // char[24]
    mFlag: 504, // unsigned char (0=green, 6=blue)
    mUnderYellow: 505, // bool
    mCountLapFlag: 506, // unsigned char
    mInGarageStall: 507, // bool
    mUpgradePack: 508, // unsigned char[16]
    mPitLapDist: 524, // float
    mBestLapSector1: 528, // float
    mBestLapSector2: 532, // float
    // mExpansion[48] at 536
};
// ─── Enums ─────────────────────────────────────────────────────────────────────
export const RF2_GAME_PHASE = {
    GARAGE: 0,
    WARMUP: 1,
    GRID_WALK: 2,
    FORMATION: 3,
    COUNTDOWN: 4,
    GREEN_FLAG: 5,
    FULL_COURSE_YELLOW: 6,
    SESSION_STOPPED: 7,
    SESSION_OVER: 8,
    PAUSED: 9,
};
export const RF2_YELLOW_FLAG = {
    INVALID: -1,
    NO_FLAG: 0,
    PENDING: 1,
    PIT_CLOSED: 2,
    PIT_LEAD_LAP: 3,
    PIT_OPEN: 4,
    LAST_LAP: 5,
    RESUME: 6,
    RACE_HALT: 7,
};
export const RF2_PIT_STATE = {
    NONE: 0,
    REQUEST: 1,
    ENTERING: 2,
    STOPPED: 3,
    EXITING: 4,
};
export const RF2_IGNITION = {
    OFF: 0,
    IGNITION: 1,
    IGNITION_AND_STARTER: 2,
};
export const RF2_FINISH_STATUS = {
    NONE: 0,
    FINISHED: 1,
    DNF: 2,
    DQ: 3,
};
export const RF2_PRIMARY_FLAG = {
    GREEN: 0,
    BLUE: 6,
};
export const RF2_ELECTRIC_BOOST = {
    UNAVAILABLE: 0,
    INACTIVE: 1,
    PROPULSION: 2,
    REGENERATION: 3,
};
// ─── Shared Memory Buffer Names ────────────────────────────────────────────────
export const RF2_SHARED_MEMORY = {
    TELEMETRY: "$rFactor2SMMP_Telemetry$",
    SCORING: "$rFactor2SMMP_Scoring$",
    RULES: "$rFactor2SMMP_Rules$",
    FORCE_FEEDBACK: "$rFactor2SMMP_ForceFeedback$",
    GRAPHICS: "$rFactor2SMMP_Graphics$",
    PIT_INFO: "$rFactor2SMMP_PitInfo$",
    WEATHER: "$rFactor2SMMP_Weather$",
    EXTENDED: "$rFactor2SMMP_Extended$",
};
// ─── Helper: compute absolute offset into a mapped buffer ──────────────────────
/**
 * Get the absolute byte offset for a field in the player's telemetry data.
 * @param vehicleIndex Index into the vehicles array (0 = first vehicle)
 * @param fieldOffset Field offset from VEHICLE_TELEMETRY
 */
export function telemetryOffset(vehicleIndex, fieldOffset) {
    return TELEMETRY_BUFFER.VEHICLES_START
        + vehicleIndex * RF2_VEHICLE_TELEMETRY_SIZE
        + fieldOffset;
}
/**
 * Get the absolute byte offset for a field in the scoring info header.
 * @param fieldOffset Field offset from SCORING_INFO
 */
export function scoringInfoOffset(fieldOffset) {
    return SCORING_BUFFER.SCORING_INFO_START + fieldOffset;
}
/**
 * Get the absolute byte offset for a field in a vehicle's scoring data.
 * @param vehicleIndex Index into the vehicles array (0 = first vehicle)
 * @param fieldOffset Field offset from VEHICLE_SCORING
 */
export function vehicleScoringOffset(vehicleIndex, fieldOffset) {
    return SCORING_BUFFER.VEHICLES_START
        + vehicleIndex * RF2_VEHICLE_SCORING_SIZE
        + fieldOffset;
}
/**
 * Get the absolute byte offset for a wheel field within a vehicle's telemetry.
 * @param vehicleIndex Index into the vehicles array
 * @param wheelIndex 0=FL, 1=FR, 2=RL, 3=RR
 * @param fieldOffset Field offset from WHEEL
 */
export function wheelOffset(vehicleIndex, wheelIndex, fieldOffset) {
    return telemetryOffset(vehicleIndex, VEHICLE_TELEMETRY.mWheels)
        + wheelIndex * RF2_WHEEL_SIZE
        + fieldOffset;
}
