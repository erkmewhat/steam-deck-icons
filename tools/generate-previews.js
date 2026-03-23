#!/usr/bin/env node
/**
 * Generate a 1920x960 preview PNG mosaic for a Stream Deck icon pack.
 * Required by Elgato for icon packs to appear in the icon library.
 *
 * Usage: node tools/generate-previews.js <icon-pack-dir>
 * Example: node tools/generate-previews.js com.simracing.lmu-icons.sdIconPack
 */

const { Resvg } = require("../plugin/node_modules/@resvg/resvg-js");
const fs = require("fs");
const path = require("path");

const packDir = process.argv[2];
if (!packDir) {
  console.error("Usage: node generate-previews.js <icon-pack-dir>");
  process.exit(1);
}

const iconsDir = path.join(packDir, "icons");
const previewsDir = path.join(packDir, "previews");
const svgFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith(".svg")).sort();

const PREVIEW_W = 1920;
const PREVIEW_H = 960;
const ICON_SIZE = 120;
const PAD = 20;
const cols = Math.floor((PREVIEW_W - PAD) / (ICON_SIZE + PAD));
const rows = Math.floor((PREVIEW_H - PAD) / (ICON_SIZE + PAD));

// Build an SVG that tiles all icons as embedded images
let imageElements = "";
let idx = 0;
for (let row = 0; row < rows && idx < svgFiles.length; row++) {
  for (let col = 0; col < cols && idx < svgFiles.length; col++) {
    const svgPath = path.join(iconsDir, svgFiles[idx]);
    const svgData = fs.readFileSync(svgPath, "utf-8");

    // Render each icon to PNG first, then embed as base64
    const resvg = new Resvg(svgData, { fitTo: { mode: "width", value: ICON_SIZE } });
    const pngBuf = resvg.render().asPng();
    const b64 = pngBuf.toString("base64");

    const x = PAD + col * (ICON_SIZE + PAD);
    const y = PAD + row * (ICON_SIZE + PAD);
    imageElements += `<image x="${x}" y="${y}" width="${ICON_SIZE}" height="${ICON_SIZE}" href="data:image/png;base64,${b64}"/>\n`;
    idx++;
  }
}

const compositeSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${PREVIEW_W}" height="${PREVIEW_H}" viewBox="0 0 ${PREVIEW_W} ${PREVIEW_H}">
  <rect width="${PREVIEW_W}" height="${PREVIEW_H}" fill="#1a1a2e"/>
  ${imageElements}
</svg>`;

const resvgFinal = new Resvg(compositeSvg, {
  fitTo: { mode: "width", value: PREVIEW_W },
});
const previewPng = resvgFinal.render().asPng();

fs.mkdirSync(previewsDir, { recursive: true });
const outPath = path.join(previewsDir, "preview.png");
fs.writeFileSync(outPath, previewPng);
console.log(`Preview generated: ${outPath} (${svgFiles.length} icons, ${cols}x${rows} grid)`);
