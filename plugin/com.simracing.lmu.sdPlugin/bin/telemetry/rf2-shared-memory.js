/**
 * Windows shared memory reader for rFactor 2 / LMU telemetry.
 * Uses koffi FFI to call kernel32.dll OpenFileMappingA + MapViewOfFile.
 * Zero new dependencies — koffi is already bundled for SendInput.
 */
import koffi from "koffi";
// Windows constants
const FILE_MAP_READ = 0x0004;
// kernel32 functions
const kernel32 = koffi.load("kernel32.dll");
const OpenFileMappingA = kernel32.func("void* __stdcall OpenFileMappingA(uint32 dwDesiredAccess, bool bInheritHandle, str lpName)");
const MapViewOfFile = kernel32.func("void* __stdcall MapViewOfFile(void* hFileMappingObject, uint32 dwDesiredAccess, uint32 dwFileOffsetHigh, uint32 dwFileOffsetLow, uintptr dwNumberOfBytesToMap)");
const UnmapViewOfFile = kernel32.func("bool __stdcall UnmapViewOfFile(void* lpBaseAddress)");
const CloseHandle = kernel32.func("bool __stdcall CloseHandle(void* hObject)");
/** Named shared memory buffer names used by the rF2 shared memory plugin. */
const TELEMETRY_BUFFER = "$rFactor2SMMP_Telemetry$";
const SCORING_BUFFER = "$rFactor2SMMP_Scoring$";
/** A mapped shared memory buffer with version-block torn-frame detection. */
export class SharedMemoryBuffer {
    name;
    size;
    handle = null;
    pointer = null;
    view = null;
    constructor(name, size) {
        this.name = name;
        this.size = size;
    }
    /** Try to open the shared memory. Returns true if successful. */
    open() {
        if (this.view)
            return true;
        const handle = OpenFileMappingA(FILE_MAP_READ, false, this.name);
        if (!handle)
            return false;
        const pointer = MapViewOfFile(handle, FILE_MAP_READ, 0, 0, 0);
        if (!pointer) {
            CloseHandle(handle);
            return false;
        }
        this.handle = handle;
        this.pointer = pointer;
        // koffi.view() returns a buffer-like object; cast to get DataView
        const rawView = koffi.view(pointer, this.size);
        this.view = new DataView(rawView);
        return true;
    }
    /** Close the mapping and release handles. */
    close() {
        if (this.pointer) {
            UnmapViewOfFile(this.pointer);
            this.pointer = null;
        }
        if (this.handle) {
            CloseHandle(this.handle);
            this.handle = null;
        }
        this.view = null;
    }
    /** Check if the buffer is currently mapped. */
    get isOpen() {
        return this.view !== null;
    }
    /**
     * Get a consistent DataView snapshot. Checks version block for torn frames.
     * Returns null if buffer not open or data is being written (torn frame).
     */
    read() {
        if (!this.view)
            return null;
        // Version block: first 8 bytes are mVersionUpdateBegin and mVersionUpdateEnd
        const begin = this.view.getUint32(0, true);
        const end = this.view.getUint32(4, true);
        // If begin != end, the game is mid-write — skip this frame
        if (begin !== end)
            return null;
        // If both are 0, no data has been written yet
        if (begin === 0)
            return null;
        return this.view;
    }
}
/**
 * High-level interface to rF2 shared memory.
 * Manages both telemetry and scoring buffers with auto-reconnect.
 */
export class RF2SharedMemory {
    // Buffer sizes — generous allocation to cover max 128 vehicles
    // Actual sizes will be refined once struct offsets are confirmed
    telemetry = new SharedMemoryBuffer(TELEMETRY_BUFFER, 16 * 1024 * 1024);
    scoring = new SharedMemoryBuffer(SCORING_BUFFER, 8 * 1024 * 1024);
    reconnectTimer = null;
    /** Try to connect to both buffers. Returns true if at least telemetry is available. */
    connect() {
        const telOk = this.telemetry.open();
        const scrOk = this.scoring.open();
        return telOk;
    }
    /** Start auto-reconnect: tries to open buffers every intervalMs if not connected. */
    startAutoReconnect(intervalMs = 5000) {
        if (this.reconnectTimer)
            return;
        this.reconnectTimer = setInterval(() => {
            if (!this.telemetry.isOpen)
                this.telemetry.open();
            if (!this.scoring.isOpen)
                this.scoring.open();
        }, intervalMs);
    }
    /** Stop auto-reconnect. */
    stopAutoReconnect() {
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    /** Whether telemetry data is currently available. */
    get isAvailable() {
        return this.telemetry.isOpen;
    }
    /** Read telemetry buffer (50 FPS data: fuel, tires, ignition, etc). */
    readTelemetry() {
        if (!this.telemetry.isOpen)
            this.telemetry.open();
        return this.telemetry.read();
    }
    /** Read scoring buffer (5 FPS data: position, flags, lap times, etc). */
    readScoring() {
        if (!this.scoring.isOpen)
            this.scoring.open();
        return this.scoring.read();
    }
    /** Clean up all resources. */
    disconnect() {
        this.stopAutoReconnect();
        this.telemetry.close();
        this.scoring.close();
    }
}
