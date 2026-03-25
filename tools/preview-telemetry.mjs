/**
 * Generate preview PNGs of all telemetry button designs.
 * Renders each SVG template with sample data to see how they look at 72x72.
 */
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "telemetry-preview");
fs.mkdirSync(outDir, { recursive: true });

// Inline the renderer functions (can't import .ts directly)
const W = 144, H = 144;
const SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
const SVG_CLOSE = `</svg>`;
const FONT = `font-family="'Segoe UI',Arial,sans-serif"`;
const BG = "#0c0c18";

function dimColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * 0.2)},${Math.round(g * 0.2)},${Math.round(b * 0.2)})`;
}

function renderTireGrid(title, cells) {
    const cellW = 64, cellH = 52, gap = 4;
    const startX = (W - cellW * 2 - gap) / 2;
    const startY = 30;
    let grid = "";
    const coords = [
        { x: startX, y: startY },
        { x: startX + cellW + gap, y: startY },
        { x: startX, y: startY + cellH + gap },
        { x: startX + cellW + gap, y: startY + cellH + gap },
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

// Sample telemetry data
const samples = {
    "01-fuel": `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="24" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#777">FUEL</text>
<text x="72" y="72" text-anchor="middle" ${FONT} font-size="48" font-weight="900" fill="#00ee77">42.3</text>
<text x="72" y="96" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#aaa">8.2 laps</text>
<rect x="10" y="112" width="124" height="20" fill="#222" rx="6"/>
<rect x="10" y="112" width="48" height="20" fill="#00ee77" rx="6"/>
${SVG_CLOSE}`,

    "02-fuel-calc": `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="22" text-anchor="middle" ${FONT} font-size="14" font-weight="700" fill="#777">FUEL CALC</text>
<text x="72" y="60" text-anchor="middle" ${FONT} font-size="38" font-weight="900" fill="#00ee77">8.2</text>
<text x="72" y="78" text-anchor="middle" ${FONT} font-size="13" font-weight="700" fill="#999">laps left</text>
<rect x="10" y="90" width="124" height="2" fill="#333" rx="1"/>
<text x="72" y="114" text-anchor="middle" ${FONT} font-size="26" font-weight="900" fill="#fff">51.6L</text>
<text x="72" y="136" text-anchor="middle" ${FONT} font-size="13" font-weight="600" fill="#666">5.12 L/lap</text>
${SVG_CLOSE}`,

    "03-position": `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="84" text-anchor="middle" ${FONT} font-size="64" font-weight="900" fill="#ffd700">P3</text>
<text x="72" y="118" text-anchor="middle" ${FONT} font-size="20" font-weight="700" fill="#999">+1.2s</text>
${SVG_CLOSE}`,

    "04-lap-delta": `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#051a0a" rx="10"/>
<text x="72" y="24" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#777">DELTA</text>
<text x="72" y="88" text-anchor="middle" ${FONT} font-size="44" font-weight="900" fill="#00ee77">-0.34</text>
<text x="72" y="120" text-anchor="middle" ${FONT} font-size="18" font-weight="700" fill="#00ee77">FASTER</text>
${SVG_CLOSE}`,

    "05-flag-green": `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#009933" rx="10"/>
<text x="72" y="88" text-anchor="middle" ${FONT} font-size="32" font-weight="900" fill="#fff">GREEN</text>
${SVG_CLOSE}`,

    "06-flag-yellow": `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="#ddaa00" rx="10"/>
<text x="72" y="88" text-anchor="middle" ${FONT} font-size="32" font-weight="900" fill="#000">YELLOW</text>
${SVG_CLOSE}`,

    "07-pressure": renderTireGrid("PRESSURE", [
        { label: "FL", value: "22.1", color: "#00ee77" },
        { label: "FR", value: "23.4", color: "#ffcc00" },
        { label: "RL", value: "21.8", color: "#00ee77" },
        { label: "RR", value: "24.1", color: "#ff3333" },
    ]),

    "08-tire-temp": renderTireGrid("TIRE TEMP", [
        { label: "FL", value: "88°", color: "#00ee77" },
        { label: "FR", value: "92°", color: "#00ee77" },
        { label: "RL", value: "76°", color: "#55bbff" },
        { label: "RR", value: "102°", color: "#ffcc00" },
    ]),

    "09-tire-wear": renderTireGrid("TIRE WEAR", [
        { label: "FL", value: "82%", color: "#00ee77" },
        { label: "FR", value: "78%", color: "#00ee77" },
        { label: "RL", value: "55%", color: "#ffcc00" },
        { label: "RR", value: "38%", color: "#ff3333" },
    ]),

    "10-battery": `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="24" text-anchor="middle" ${FONT} font-size="16" font-weight="700" fill="#777">BATTERY</text>
<text x="72" y="80" text-anchor="middle" ${FONT} font-size="48" font-weight="900" fill="#00ee77">62%</text>
<rect x="10" y="100" width="124" height="24" fill="#222" rx="6"/>
<rect x="10" y="100" width="77" height="24" fill="#00ee77" rx="6"/>
${SVG_CLOSE}`,

    "11-pit-race": `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="92" text-anchor="middle" ${FONT} font-size="40" font-weight="900" fill="#00ee77">RACE</text>
${SVG_CLOSE}`,

    "12-pit-inbox": `${SVG_OPEN}
<rect width="${W}" height="${H}" fill="${BG}" rx="10"/>
<text x="72" y="72" text-anchor="middle" ${FONT} font-size="34" font-weight="900" fill="#ff3333">IN</text>
<text x="72" y="110" text-anchor="middle" ${FONT} font-size="34" font-weight="900" fill="#ff3333">BOX</text>
${SVG_CLOSE}`,
};

let count = 0;
for (const [name, svg] of Object.entries(samples)) {
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 144 } });
    const png = resvg.render().asPng();
    const outPath = path.join(outDir, `${name}.png`);
    fs.writeFileSync(outPath, png);
    count++;
}

console.log(`Generated ${count} preview PNGs in ${outDir}`);
