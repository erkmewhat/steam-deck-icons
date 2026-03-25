/**
 * SVG template generators for telemetry display buttons.
 * All output 144x144 SVGs (resvg renders to 72x72 PNG for Stream Deck).
 *
 * Design: big bold numbers, high contrast, color-coded backgrounds.
 * At 72x72 pixels, every pixel counts — maximize readability.
 */
const W = 144;
const H = 144;
const SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
const SVG_CLOSE = `</svg>`;
const FONT = `font-family="'Segoe UI',Arial,sans-serif"`;
const BG = "#0c0c18";
// ── Color helpers ───────────────────────────────────────────────────
function fuelColor(lapsRemaining) {
    if (lapsRemaining > 5)
        return "#00ee77";
    if (lapsRemaining > 3)
        return "#ffcc00";
    return "#ff3333";
}
function pressureColor(kpa, optMin, optMax) {
    if (kpa < optMin - 5)
        return "#2288ff";
    if (kpa < optMin)
        return "#55bbff";
    if (kpa <= optMax)
        return "#00ee77";
    if (kpa <= optMax + 5)
        return "#ffcc00";
    return "#ff3333";
}
function tempColor(celsius) {
    if (celsius < 70)
        return "#2288ff";
    if (celsius < 80)
        return "#55bbff";
    if (celsius <= 95)
        return "#00ee77";
    if (celsius <= 105)
        return "#ffcc00";
    return "#ff3333";
}
function wearColor(fraction) {
    if (fraction > 0.7)
        return "#00ee77";
    if (fraction > 0.4)
        return "#ffcc00";
    return "#ff3333";
}
function batteryColor(fraction) {
    if (fraction > 0.8)
        return "#2288ff";
    if (fraction > 0.4)
        return "#00ee77";
    if (fraction > 0.2)
        return "#ffcc00";
    return "#ff3333";
}
// Dim version of a color for cell backgrounds
function dimColor(hex) {
    // Parse hex and reduce to ~20% brightness
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * 0.2)},${Math.round(g * 0.2)},${Math.round(b * 0.2)})`;
}
// ── Flag colors ─────────────────────────────────────────────────────
const FLAG_COLORS = {
    green: { bg: "#009933", text: "#ffffff", label: "GREEN" },
    yellow: { bg: "#ddaa00", text: "#000000", label: "YELLOW" },
    blue: { bg: "#0066ee", text: "#ffffff", label: "BLUE" },
    red: { bg: "#dd0000", text: "#ffffff", label: "RED" },
    white: { bg: "#cccccc", text: "#000000", label: "SLOW CAR" },
    checkered: { bg: "#222222", text: "#ffffff", label: "FINISH" },
    none: { bg: BG, text: "#555555", label: "NO FLAG" },
};
function renderTireGrid(title, cells) {
    // 2x2 grid with colored background cells, big values
    const cellW = 64;
    const cellH = 52;
    const gap = 4;
    const startX = (W - cellW * 2 - gap) / 2;
    const startY = 30;
    let grid = "";
    const coords = [
        { x: startX, y: startY }, // FL
        { x: startX + cellW + gap, y: startY }, // FR
        { x: startX, y: startY + cellH + gap }, // RL
        { x: startX + cellW + gap, y: startY + cellH + gap }, // RR
    ];
    for (let i = 0; i < 4; i++) {
        const { x, y } = coords[i];
        const c = cells[i];
        const bg = dimColor(c.color);
        grid += `
<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${bg}" rx="6"/>
<text x="${x + 10}" y="${y + 16}" ${FONT} font-size="13" font-weight="700" fill="#999">${c.label}</text>
<text x="${x + cellW / 2}" y="${y + 42}" text-anchor="middle" ${FONT} font-size="24" font-weight="900" fill="${c.color}">${c.value}</text>`;
    }
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="22" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#777">${title}</text>
${grid}
${SVG_CLOSE}`;
}
// ── Renderers ───────────────────────────────────────────────────────
export function renderNoData() {
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="68" text-anchor="middle" ${FONT} font-size="22" font-weight="900" fill="#333">NO</text>
<text x="72" y="96" text-anchor="middle" ${FONT} font-size="22" font-weight="900" fill="#333">DATA</text>
${SVG_CLOSE}`;
}
export function renderFuelGauge(fuel, fuelCapacity, lapsRemaining) {
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
export function renderFuelCalc(lapsRemaining, fuelNeeded, fuelPerLap) {
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
/** 2x2 tire pressure grid with colored background cells. */
export function renderTirePressure(pressures, optMinKpa, optMaxKpa) {
    const labels = ["FL", "FR", "RL", "RR"];
    const cells = pressures.map((kpa, i) => ({
        label: labels[i],
        value: (kpa / 6.895).toFixed(1),
        color: pressureColor(kpa, optMinKpa, optMaxKpa),
    }));
    return renderTireGrid("PRESSURE", cells);
}
/** 2x2 tire temperature grid. */
export function renderTireTemp(temps) {
    const labels = ["FL", "FR", "RL", "RR"];
    const cells = temps.map((c, i) => ({
        label: labels[i],
        value: `${c.toFixed(0)}°`,
        color: tempColor(c),
    }));
    return renderTireGrid("TIRE TEMP", cells);
}
/** 2x2 tire wear grid. */
export function renderTireWear(wear) {
    const labels = ["FL", "FR", "RL", "RR"];
    const cells = wear.map((w, i) => ({
        label: labels[i],
        value: `${Math.round(w * 100)}%`,
        color: wearColor(w),
    }));
    return renderTireGrid("TIRE WEAR", cells);
}
export function renderFlag(flagType) {
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
export function renderPosition(place, gap) {
    const placeColor = place <= 3 ? "#ffd700" : "#ffffff";
    const gapStr = gap > 0 ? `+${gap.toFixed(1)}s` : gap === 0 ? "LEADER" : `${gap.toFixed(1)}s`;
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="84" text-anchor="middle" ${FONT} font-size="64" font-weight="900" fill="${placeColor}">P${place}</text>
<text x="72" y="118" text-anchor="middle" ${FONT} font-size="20" font-weight="700" fill="#999">${gapStr}</text>
${SVG_CLOSE}`;
}
export function renderLapDelta(delta) {
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
export function renderBattery(charge) {
    const pct = Math.round(charge * 100);
    const barW = Math.round(charge * 124);
    const color = batteryColor(charge);
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="24" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#777">BATTERY</text>
<text x="72" y="80" text-anchor="middle" ${FONT} font-size="48" font-weight="900" fill="${color}">${pct}%</text>
<rect x="10" y="100" width="124" height="24" fill="#222" rx="6"/>
<rect x="10" y="100" width="${barW}" height="24" fill="${color}" rx="6"/>
${SVG_CLOSE}`;
}
export function renderBatteryNA() {
    return `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="24" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#777">BATTERY</text>
<text x="72" y="88" text-anchor="middle" ${FONT} font-size="28" font-weight="900" fill="#444">N/A</text>
${SVG_CLOSE}`;
}
const PIT_STATES = {
    0: { label: "RACE", color: "#00ee77" },
    1: { label: "PIT\nREQ", color: "#ffcc00" },
    2: { label: "PIT\nENTER", color: "#ff8800" },
    3: { label: "IN\nBOX", color: "#ff3333" },
    4: { label: "PIT\nEXIT", color: "#ffcc00" },
};
export function renderPitState(pitState, inPits) {
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
