#!/usr/bin/env node
/**
 * Convert an SVG file to a 144x144 PNG and write it to a given output path.
 * Used by profile generators to create Stream Deck-compatible icon images.
 *
 * Usage: node tools/svg-to-png.js <input.svg> <output.png>
 */

const { Resvg } = require("../plugin/node_modules/@resvg/resvg-js");
const fs = require("fs");
const path = require("path");

const [,, svgPath, pngPath] = process.argv;

if (!svgPath || !pngPath) {
  console.error("Usage: node svg-to-png.js <input.svg> <output.png>");
  process.exit(1);
}

const svgData = fs.readFileSync(svgPath, "utf-8");
const size = parseInt(process.argv[4] || "72", 10);
const resvg = new Resvg(svgData, {
  fitTo: { mode: "width", value: size },
});
const pngBuffer = resvg.render().asPng();

fs.mkdirSync(path.dirname(pngPath), { recursive: true });
fs.writeFileSync(pngPath, pngBuffer);
