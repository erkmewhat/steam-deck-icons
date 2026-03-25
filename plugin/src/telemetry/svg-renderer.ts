/**
 * SVG template generators for telemetry display buttons.
 * All output 144x144 SVGs (Stream Deck scales to 72x72 for display).
 * Uses inline SVG passed via setImage(data:image/svg+xml,...).
 */

const W = 144;
const H = 144;
const SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
const SVG_CLOSE = `</svg>`;

// ── Color helpers ───────────────────────────────────────────────────

function fuelColor(lapsRemaining: number): string {
    if (lapsRemaining > 5) return "#00cc66";
    if (lapsRemaining > 3) return "#ffaa00";
    return "#ff3333";
}

function pressureColor(kpa: number, optMin: number, optMax: number): string {
    if (kpa < optMin - 5) return "#3399ff";   // cold / under
    if (kpa < optMin) return "#66ccff";        // slightly cold
    if (kpa <= optMax) return "#00cc66";       // optimal
    if (kpa <= optMax + 5) return "#ffaa00";   // warm
    return "#ff3333";                          // hot / over
}

function tempColor(celsius: number): string {
    if (celsius < 70) return "#3399ff";        // cold
    if (celsius < 80) return "#66ccff";        // warming
    if (celsius <= 95) return "#00cc66";       // optimal
    if (celsius <= 105) return "#ffaa00";      // warm
    return "#ff3333";                          // overheating
}

function wearColor(fraction: number): string {
    if (fraction > 0.7) return "#00cc66";
    if (fraction > 0.4) return "#ffaa00";
    return "#ff3333";
}

function batteryColor(fraction: number): string {
    if (fraction > 0.8) return "#3399ff";      // regen zone
    if (fraction > 0.4) return "#00cc66";
    if (fraction > 0.2) return "#ffaa00";
    return "#ff3333";
}

// ── Flag colors ─────────────────────────────────────────────────────

const FLAG_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    green:     { bg: "#00882a", text: "#ffffff", label: "GREEN" },
    yellow:    { bg: "#ccaa00", text: "#000000", label: "YELLOW" },
    blue:      { bg: "#0055cc", text: "#ffffff", label: "BLUE" },
    red:       { bg: "#cc0000", text: "#ffffff", label: "RED" },
    white:     { bg: "#cccccc", text: "#000000", label: "SLOW CAR" },
    checkered: { bg: "#222222", text: "#ffffff", label: "FINISH" },
    none:      { bg: "#1a1a2e", text: "#444444", label: "NO FLAG" },
};

// ── Renderers ───────────────────────────────────────────────────────

export function renderNoData(): string {
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#1a1a2e" rx="12"/>
<text x="72" y="65" text-anchor="middle" fill="#444" font-family="Arial,sans-serif" font-size="16" font-weight="bold">NO</text>
<text x="72" y="90" text-anchor="middle" fill="#444" font-family="Arial,sans-serif" font-size="16" font-weight="bold">DATA</text>
${SVG_CLOSE}`;
}

export function renderFuelGauge(fuel: number, fuelCapacity: number, lapsRemaining: number): string {
    const pct = Math.min(fuel / Math.max(fuelCapacity, 1), 1);
    const barW = Math.round(pct * 120);
    const color = fuelColor(lapsRemaining);
    const bgColor = lapsRemaining <= 3 ? "#2e0a0a" : "#1a1a2e";

    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${bgColor}" rx="12"/>
<text x="72" y="28" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="14">FUEL</text>
<text x="72" y="68" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="36" font-weight="bold">${fuel.toFixed(1)}</text>
<text x="72" y="90" text-anchor="middle" fill="#aaa" font-family="Arial,sans-serif" font-size="13">${lapsRemaining.toFixed(1)} laps</text>
<rect x="12" y="105" width="120" height="18" fill="#333" rx="4"/>
<rect x="12" y="105" width="${barW}" height="18" fill="${color}" rx="4"/>
${SVG_CLOSE}`;
}

export function renderFuelCalc(lapsRemaining: number, fuelNeeded: number, fuelPerLap: number): string {
    const color = fuelColor(lapsRemaining);

    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#1a1a2e" rx="12"/>
<text x="72" y="24" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="12">FUEL CALC</text>
<text x="72" y="52" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="28" font-weight="bold">${lapsRemaining.toFixed(1)}</text>
<text x="72" y="68" text-anchor="middle" fill="#aaa" font-family="Arial,sans-serif" font-size="11">laps left</text>
<text x="72" y="95" text-anchor="middle" fill="#ccc" font-family="Arial,sans-serif" font-size="16" font-weight="bold">${fuelNeeded.toFixed(1)}L</text>
<text x="72" y="112" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="11">needed</text>
<text x="72" y="134" text-anchor="middle" fill="#666" font-family="Arial,sans-serif" font-size="10">${fuelPerLap.toFixed(2)} L/lap</text>
${SVG_CLOSE}`;
}

/** 2x2 tire pressure grid. pressures in kPa, converted to PSI for display. */
export function renderTirePressure(pressures: [number, number, number, number], optMinKpa: number, optMaxKpa: number): string {
    const labels = ["FL", "FR", "RL", "RR"];
    const positions = [
        { x: 36, y: 48 },   // FL
        { x: 108, y: 48 },  // FR
        { x: 36, y: 108 },  // RL
        { x: 108, y: 108 }, // RR
    ];

    let tires = "";
    for (let i = 0; i < 4; i++) {
        const psi = pressures[i] / 6.895;
        const color = pressureColor(pressures[i], optMinKpa, optMaxKpa);
        const { x, y } = positions[i];
        tires += `
<text x="${x}" y="${y - 16}" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="11">${labels[i]}</text>
<text x="${x}" y="${y + 4}" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="20" font-weight="bold">${psi.toFixed(1)}</text>`;
    }

    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#1a1a2e" rx="12"/>
<text x="72" y="18" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="12">PRESSURE</text>
${tires}
${SVG_CLOSE}`;
}

/** 2x2 tire temperature grid. temps in Celsius. */
export function renderTireTemp(temps: [number, number, number, number]): string {
    const labels = ["FL", "FR", "RL", "RR"];
    const positions = [
        { x: 36, y: 48 },
        { x: 108, y: 48 },
        { x: 36, y: 108 },
        { x: 108, y: 108 },
    ];

    let tires = "";
    for (let i = 0; i < 4; i++) {
        const color = tempColor(temps[i]);
        const { x, y } = positions[i];
        tires += `
<text x="${x}" y="${y - 16}" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="11">${labels[i]}</text>
<text x="${x}" y="${y + 4}" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="20" font-weight="bold">${temps[i].toFixed(0)}</text>`;
    }

    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#1a1a2e" rx="12"/>
<text x="72" y="18" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="12">TIRE TEMP</text>
${tires}
${SVG_CLOSE}`;
}

/** 2x2 tire wear grid. wear as fraction 0.0-1.0. */
export function renderTireWear(wear: [number, number, number, number]): string {
    const labels = ["FL", "FR", "RL", "RR"];
    const positions = [
        { x: 36, y: 48 },
        { x: 108, y: 48 },
        { x: 36, y: 108 },
        { x: 108, y: 108 },
    ];

    let tires = "";
    for (let i = 0; i < 4; i++) {
        const pct = Math.round(wear[i] * 100);
        const color = wearColor(wear[i]);
        const { x, y } = positions[i];
        tires += `
<text x="${x}" y="${y - 16}" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="11">${labels[i]}</text>
<text x="${x}" y="${y + 4}" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="20" font-weight="bold">${pct}%</text>`;
    }

    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#1a1a2e" rx="12"/>
<text x="72" y="18" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="12">TIRE WEAR</text>
${tires}
${SVG_CLOSE}`;
}

export function renderFlag(flagType: string): string {
    const flag = FLAG_COLORS[flagType] || FLAG_COLORS.none;

    // Checkered gets a special pattern
    if (flagType === "checkered") {
        return `${SVG_OPEN}
<defs><pattern id="ck" width="36" height="36" patternUnits="userSpaceOnUse">
<rect width="18" height="18" fill="#fff"/><rect x="18" y="18" width="18" height="18" fill="#fff"/>
<rect x="18" width="18" height="18" fill="#000"/><rect y="18" width="18" height="18" fill="#000"/>
</pattern></defs>
<rect width="${W}" height="${H}" fill="url(#ck)" rx="12"/>
<rect x="22" y="52" width="100" height="40" fill="rgba(0,0,0,0.7)" rx="8"/>
<text x="72" y="78" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="18" font-weight="bold">FINISH</text>
${SVG_CLOSE}`;
    }

    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${flag.bg}" rx="12"/>
<text x="72" y="80" text-anchor="middle" fill="${flag.text}" font-family="Arial,sans-serif" font-size="22" font-weight="bold">${flag.label}</text>
${SVG_CLOSE}`;
}

export function renderPosition(place: number, gap: number): string {
    const placeColor = place <= 3 ? "#ffd700" : "#ffffff";
    const gapStr = gap > 0 ? `+${gap.toFixed(1)}s` : gap === 0 ? "LEADER" : `${gap.toFixed(1)}s`;

    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#1a1a2e" rx="12"/>
<text x="72" y="28" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="14">POSITION</text>
<text x="72" y="80" text-anchor="middle" fill="${placeColor}" font-family="Arial,sans-serif" font-size="52" font-weight="bold">P${place}</text>
<text x="72" y="110" text-anchor="middle" fill="#aaa" font-family="Arial,sans-serif" font-size="16">${gapStr}</text>
${SVG_CLOSE}`;
}

export function renderLapDelta(delta: number): string {
    const isPositive = delta >= 0;
    const color = isPositive ? "#ff3333" : "#00cc66";
    const sign = isPositive ? "+" : "";
    const arrow = isPositive ? "\u25b2" : "\u25bc";
    const label = isPositive ? "SLOWER" : "FASTER";

    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#1a1a2e" rx="12"/>
<text x="72" y="28" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="14">LAP DELTA</text>
<text x="72" y="55" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="18">${arrow}</text>
<text x="72" y="88" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="30" font-weight="bold">${sign}${delta.toFixed(2)}</text>
<text x="72" y="115" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="14">${label}</text>
${SVG_CLOSE}`;
}

export function renderBattery(charge: number): string {
    const pct = Math.round(charge * 100);
    const barW = Math.round(charge * 120);
    const color = batteryColor(charge);

    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#1a1a2e" rx="12"/>
<text x="72" y="28" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="14">BATTERY</text>
<text x="72" y="72" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="36" font-weight="bold">${pct}%</text>
<rect x="12" y="95" width="120" height="20" fill="#333" rx="4"/>
<rect x="12" y="95" width="${barW}" height="20" fill="${color}" rx="4"/>
${SVG_CLOSE}`;
}

export function renderBatteryNA(): string {
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#1a1a2e" rx="12"/>
<text x="72" y="28" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="14">BATTERY</text>
<text x="72" y="80" text-anchor="middle" fill="#444" font-family="Arial,sans-serif" font-size="20" font-weight="bold">N/A</text>
${SVG_CLOSE}`;
}

const PIT_STATES: Record<number, { label: string; color: string }> = {
    0: { label: "RACE", color: "#00cc66" },
    1: { label: "PIT\nREQ", color: "#ffaa00" },
    2: { label: "PIT\nIN", color: "#ff6600" },
    3: { label: "IN\nBOX", color: "#ff3333" },
    4: { label: "PIT\nOUT", color: "#ffaa00" },
};

export function renderPitState(pitState: number, inPits: boolean): string {
    const state = PIT_STATES[pitState] || PIT_STATES[0];
    const lines = state.label.split("\n");

    const textElements = lines.length === 1
        ? `<text x="72" y="85" text-anchor="middle" fill="${state.color}" font-family="Arial,sans-serif" font-size="28" font-weight="bold">${lines[0]}</text>`
        : `<text x="72" y="70" text-anchor="middle" fill="${state.color}" font-family="Arial,sans-serif" font-size="26" font-weight="bold">${lines[0]}</text>
<text x="72" y="100" text-anchor="middle" fill="${state.color}" font-family="Arial,sans-serif" font-size="26" font-weight="bold">${lines[1]}</text>`;

    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#1a1a2e" rx="12"/>
<text x="72" y="24" text-anchor="middle" fill="#888" font-family="Arial,sans-serif" font-size="12">PIT STATE</text>
${textElements}
${SVG_CLOSE}`;
}
