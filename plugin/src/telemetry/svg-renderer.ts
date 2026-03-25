/**
 * SVG template generators for telemetry display buttons.
 * All output 144x144 SVGs (resvg renders to 72x72 PNG for Stream Deck).
 *
 * Tire colors match LMU's rfDynHUD scheme: blue → yellow → red interpolation.
 * RPM bar mirrors the in-game tachometer color gradient.
 */

const W = 144;
const H = 144;
const SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
const SVG_CLOSE = `</svg>`;
const FONT = `font-family="'Segoe UI',Arial,sans-serif"`;
const BG = "#0c0c18";

// ── LMU Tire Color Scheme ───────────────────────────────────────────
// Matches rfDynHUD: blue(cold) → green(warming) → yellow(optimal) → orange(hot) → red(overheat)

function lmuTireColor(celsius: number): string {
    if (celsius < 50) return "#0044ff";     // very cold — dark blue
    if (celsius < 65) return "#0088ff";     // cold — light blue
    if (celsius < 75) return "#00dd88";     // warming — cyan-green
    if (celsius < 82) return "#88ee00";     // near optimal — green-yellow
    if (celsius <= 95) return "#ffee00";    // optimal — yellow
    if (celsius <= 110) return "#ff8800";   // hot — orange
    return "#ff0000";                       // overheating — red
}

function dimColor(hex: string, amount: number = 0.2): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * amount)},${Math.round(g * amount)},${Math.round(b * amount)})`;
}

function fuelColor(lapsRemaining: number): string {
    if (lapsRemaining > 5) return "#00ee77";
    if (lapsRemaining > 3) return "#ffcc00";
    return "#ff3333";
}

function wearColor(fraction: number): string {
    if (fraction > 0.7) return "#00ee77";
    if (fraction > 0.4) return "#ffcc00";
    return "#ff3333";
}

// ── RPM Colors (matches tachometer) ─────────────────────────────────

const RPM_SEGMENT_COLORS = [
    "#44aaff",   // Seg 1: 0-20% — light blue
    "#2266cc",   // Seg 2: 20-40% — darker blue
    "#ffdd00",   // Seg 3: 40-60% — yellow
    "#ff8800",   // Seg 4: 60-80% — orange
    "#ee2200",   // Seg 5: 80-100% — red
];

// ── Flag colors ─────────────────────────────────────────────────────

const FLAG_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    green:     { bg: "#009933", text: "#ffffff", label: "GREEN" },
    yellow:    { bg: "#ddaa00", text: "#000000", label: "YELLOW" },
    blue:      { bg: "#0066ee", text: "#ffffff", label: "BLUE" },
    red:       { bg: "#dd0000", text: "#ffffff", label: "RED" },
    white:     { bg: "#cccccc", text: "#000000", label: "SLOW CAR" },
    checkered: { bg: "#222222", text: "#ffffff", label: "FINISH" },
    none:      { bg: BG, text: "#555555", label: "NO FLAG" },
};

// ── Renderers ───────────────────────────────────────────────────────

export function renderNoData(): string {
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="68" text-anchor="middle" ${FONT} font-size="22" font-weight="900" fill="#333">NO</text>
<text x="72" y="96" text-anchor="middle" ${FONT} font-size="22" font-weight="900" fill="#333">DATA</text>
${SVG_CLOSE}`;
}

// ── RPM Segment ─────────────────────────────────────────────────────

/**
 * Render one RPM bar segment (1 of 5 across the top row).
 * @param segIndex 0-4 (which segment)
 * @param rpmPct 0.0-1.0 (current RPM as fraction of max)
 */
export function renderRpmSegment(segIndex: number, rpmPct: number): string {
    const segStart = segIndex * 0.2;
    const segEnd = (segIndex + 1) * 0.2;
    const segColor = RPM_SEGMENT_COLORS[segIndex];

    // At 98%+ RPM, ALL segments flash red — shift indicator
    if (rpmPct >= 0.98) {
        return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#ff0000" rx="6"/>
<rect x="8" y="20" width="128" height="104" fill="#cc0000" rx="8"/>
${SVG_CLOSE}`;
    }

    // Is this segment fully lit, partially lit, or off?
    const isLit = rpmPct >= segEnd;
    const isPartial = rpmPct > segStart && rpmPct < segEnd;

    if (isLit) {
        // Fully lit segment
        return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${dimColor(segColor, 0.15)}" rx="6"/>
<rect x="8" y="20" width="128" height="104" fill="${segColor}" rx="8"/>
${SVG_CLOSE}`;
    }

    if (isPartial) {
        // Partially lit — fill proportionally
        const fillPct = (rpmPct - segStart) / 0.2;
        const fillH = Math.round(fillPct * 104);
        const fillY = 20 + (104 - fillH);
        return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${dimColor(segColor, 0.08)}" rx="6"/>
<rect x="8" y="20" width="128" height="104" fill="${dimColor(segColor, 0.15)}" rx="8"/>
<rect x="8" y="${fillY}" width="128" height="${fillH}" fill="${segColor}" rx="8"/>
${SVG_CLOSE}`;
    }

    // Off segment — very dim
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${dimColor(segColor, 0.06)}" rx="6"/>
<rect x="8" y="20" width="128" height="104" fill="${dimColor(segColor, 0.12)}" rx="8"/>
${SVG_CLOSE}`;
}

// ── Tire (shaped like a tire) ───────────────────────────────────────

export function renderSingleTire(
    corner: string,
    pressureKpa: number,
    tempC: number,
    wear: number,
    optMinKpa: number,
    optMaxKpa: number,
): string {
    const psi = pressureKpa / 6.895;
    const tireColor = lmuTireColor(tempC);
    const wColor = wearColor(wear);
    const wearPct = Math.round(wear * 100);
    const wearBarW = Math.round(wear * 100);
    const bgTint = dimColor(tireColor, 0.25);

    // Tire shape: rounded rectangle (like a tire cross-section) with tread grooves
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<!-- Tire body (rounded rectangle with thick sidewalls) -->
<rect x="14" y="8" width="116" height="128" fill="${bgTint}" rx="22"/>
<rect x="22" y="14" width="100" height="116" fill="${tireColor}" rx="16" opacity="0.3"/>
<!-- Tread grooves -->
<rect x="30" y="14" width="3" height="116" fill="${BG}" opacity="0.4" rx="1"/>
<rect x="70" y="14" width="4" height="116" fill="${BG}" opacity="0.4" rx="1"/>
<rect x="111" y="14" width="3" height="116" fill="${BG}" opacity="0.4" rx="1"/>
<!-- Corner label -->
<text x="72" y="32" text-anchor="middle" ${FONT} font-size="18" font-weight="900" fill="#fff" opacity="0.9">${corner}</text>
<!-- Pressure (main value) -->
<text x="72" y="70" text-anchor="middle" ${FONT} font-size="38" font-weight="900" fill="#fff">${psi.toFixed(1)}</text>
<!-- Temperature -->
<text x="72" y="98" text-anchor="middle" ${FONT} font-size="22" font-weight="900" fill="#fff">${tempC.toFixed(0)}°C</text>
<!-- Wear bar at bottom -->
<rect x="28" y="114" width="88" height="8" fill="rgba(0,0,0,0.5)" rx="3"/>
<rect x="28" y="114" width="${Math.round(wear * 88)}" height="8" fill="${wColor}" rx="3"/>
${SVG_CLOSE}`;
}

// ── Flag Alert ──────────────────────────────────────────────────────

export function renderFlagAlert(flagType: string, pulse: boolean): string {
    if (flagType === "yellow") {
        return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#ddaa00" rx="10"/>
<rect x="0" y="0" width="20" height="${H}" fill="#000" opacity="0.3"/>
<rect x="${W - 20}" y="0" width="20" height="${H}" fill="#000" opacity="0.3"/>
<text x="72" y="56" text-anchor="middle" ${FONT} font-size="20" font-weight="900" fill="#000">YELLOW</text>
<text x="72" y="90" text-anchor="middle" ${FONT} font-size="32" font-weight="900" fill="#000">FLAG</text>
<text x="72" y="126" text-anchor="middle" ${FONT} font-size="22" font-weight="900" fill="#000">${pulse ? "\u26a0" : "\u26a0\u26a0\u26a0"}</text>
${SVG_CLOSE}`;
    }
    if (flagType === "blue") {
        return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#0066ee" rx="10"/>
<text x="72" y="56" text-anchor="middle" ${FONT} font-size="20" font-weight="900" fill="#fff">BLUE FLAG</text>
<text x="72" y="96" text-anchor="middle" ${FONT} font-size="18" font-weight="900" fill="#fff">LET PASS</text>
${SVG_CLOSE}`;
    }
    if (flagType === "red") {
        return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#dd0000" rx="10"/>
<text x="72" y="56" text-anchor="middle" ${FONT} font-size="20" font-weight="900" fill="#fff">RED FLAG</text>
<text x="72" y="96" text-anchor="middle" ${FONT} font-size="18" font-weight="900" fill="#fff">STOP</text>
${SVG_CLOSE}`;
    }
    return renderFlag(flagType);
}

export function renderFlag(flagType: string): string {
    const flag = FLAG_COLORS[flagType] || FLAG_COLORS.none;
    if (flagType === "checkered") {
        return `${SVG_OPEN}
<defs><pattern id="ck" width="36" height="36" patternUnits="userSpaceOnUse">
<rect width="18" height="18" fill="#fff"/><rect x="18" y="18" width="18" height="18" fill="#fff"/>
<rect x="18" width="18" height="18" fill="#111"/><rect y="18" width="18" height="18" fill="#111"/>
</pattern></defs>
<rect width="${W}" height="${H}" fill="url(#ck)" rx="10"/>
<rect x="12" y="48" width="120" height="48" fill="rgba(0,0,0,0.8)" rx="8"/>
<text x="72" y="82" text-anchor="middle" ${FONT} font-size="28" font-weight="900" fill="#fff">FINISH</text>
${SVG_CLOSE}`;
    }
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${flag.bg}" rx="10"/>
<text x="72" y="88" text-anchor="middle" ${FONT} font-size="32" font-weight="900" fill="${flag.text}">${flag.label}</text>
${SVG_CLOSE}`;
}

// ── Other displays ──────────────────────────────────────────────────

export function renderFuelGauge(fuel: number, fuelCapacity: number, lapsRemaining: number): string {
    const pct = Math.min(fuel / Math.max(fuelCapacity, 1), 1);
    const barW = Math.round(pct * 124);
    const color = fuelColor(lapsRemaining);
    const bgColor = lapsRemaining <= 3 ? "#1a0505" : BG;
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${bgColor}" rx="10"/>
<text x="72" y="24" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#777">FUEL</text>
<text x="72" y="72" text-anchor="middle" ${FONT} font-size="48" font-weight="900" fill="${color}">${fuel.toFixed(1)}</text>
<text x="72" y="96" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#aaa">${lapsRemaining.toFixed(1)} laps</text>
<rect x="10" y="112" width="124" height="20" fill="#222" rx="6"/>
<rect x="10" y="112" width="${barW}" height="20" fill="${color}" rx="6"/>
${SVG_CLOSE}`;
}

export function renderFuelCalc(lapsRemaining: number, fuelNeeded: number, fuelPerLap: number): string {
    const color = fuelColor(lapsRemaining);
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="22" text-anchor="middle" ${FONT} font-size="14" font-weight="700" fill="#777">FUEL CALC</text>
<text x="72" y="60" text-anchor="middle" ${FONT} font-size="38" font-weight="900" fill="${color}">${lapsRemaining.toFixed(1)}</text>
<text x="72" y="78" text-anchor="middle" ${FONT} font-size="13" font-weight="700" fill="#999">laps left</text>
<rect x="10" y="90" width="124" height="2" fill="#333" rx="1"/>
<text x="72" y="114" text-anchor="middle" ${FONT} font-size="26" font-weight="900" fill="#fff">${fuelNeeded.toFixed(1)}L</text>
<text x="72" y="136" text-anchor="middle" ${FONT} font-size="13" font-weight="600" fill="#666">${fuelPerLap.toFixed(2)} L/lap</text>
${SVG_CLOSE}`;
}

export function renderPosition(place: number, gap: number): string {
    const placeColor = place <= 3 ? "#ffd700" : "#ffffff";
    const gapStr = gap > 0 ? `+${gap.toFixed(1)}s` : gap === 0 ? "LEADER" : `${gap.toFixed(1)}s`;
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="84" text-anchor="middle" ${FONT} font-size="64" font-weight="900" fill="${placeColor}">P${place}</text>
<text x="72" y="118" text-anchor="middle" ${FONT} font-size="20" font-weight="700" fill="#999">${gapStr}</text>
${SVG_CLOSE}`;
}

export function renderLapDelta(delta: number): string {
    const isPositive = delta >= 0;
    const color = isPositive ? "#ff3333" : "#00ee77";
    const sign = isPositive ? "+" : "";
    const bgTint = isPositive ? "#1a0505" : "#051a0a";
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${bgTint}" rx="10"/>
<text x="72" y="24" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#777">DELTA</text>
<text x="72" y="88" text-anchor="middle" ${FONT} font-size="44" font-weight="900" fill="${color}">${sign}${delta.toFixed(2)}</text>
<text x="72" y="120" text-anchor="middle" ${FONT} font-size="18" font-weight="700" fill="${color}">${isPositive ? "SLOWER" : "FASTER"}</text>
${SVG_CLOSE}`;
}

export function renderBattery(charge: number): string {
    const pct = Math.round(charge * 100);
    const barW = Math.round(charge * 124);
    const color = charge > 0.4 ? "#00ee77" : charge > 0.2 ? "#ffcc00" : "#ff3333";
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="24" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#777">BATTERY</text>
<text x="72" y="80" text-anchor="middle" ${FONT} font-size="48" font-weight="900" fill="${color}">${pct}%</text>
<rect x="10" y="100" width="124" height="24" fill="#222" rx="6"/>
<rect x="10" y="100" width="${barW}" height="24" fill="${color}" rx="6"/>
${SVG_CLOSE}`;
}

export function renderBatteryNA(): string {
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="24" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#777">BATTERY</text>
<text x="72" y="88" text-anchor="middle" ${FONT} font-size="28" font-weight="900" fill="#444">N/A</text>
${SVG_CLOSE}`;
}

const PIT_STATES: Record<number, { label: string; color: string }> = {
    0: { label: "RACE", color: "#00ee77" },
    1: { label: "PIT\nREQ", color: "#ffcc00" },
    2: { label: "PIT\nENTER", color: "#ff8800" },
    3: { label: "IN\nBOX", color: "#ff3333" },
    4: { label: "PIT\nEXIT", color: "#ffcc00" },
};

export function renderPitState(pitState: number, inPits: boolean): string {
    const state = PIT_STATES[pitState] || PIT_STATES[0];
    const lines = state.label.split("\n");
    const textElements = lines.length === 1
        ? `<text x="72" y="92" text-anchor="middle" ${FONT} font-size="40" font-weight="900" fill="${state.color}">${lines[0]}</text>`
        : `<text x="72" y="72" text-anchor="middle" ${FONT} font-size="34" font-weight="900" fill="${state.color}">${lines[0]}</text>
<text x="72" y="110" text-anchor="middle" ${FONT} font-size="34" font-weight="900" fill="${state.color}">${lines[1]}</text>`;
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
${textElements}
${SVG_CLOSE}`;
}
