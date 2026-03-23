#!/usr/bin/env node
/**
 * Create an animated GIF icon from an SVG template with pulsing glow.
 * Renders frames by modifying SVG opacity values per frame, converts each
 * to raw pixels, then encodes as animated GIF.
 *
 * Usage: node tools/create-animated-icon.js <input-on.svg> <output.gif> [frames] [frame-ms]
 */

const { Resvg } = require("../plugin/node_modules/@resvg/resvg-js");
const sharp = require("../plugin/node_modules/sharp");
const GIFEncoder = require("../plugin/node_modules/gif-encoder-2");
const fs = require("fs");

const [,, svgPath, outPath, framesArg, delayArg] = process.argv;
if (!svgPath || !outPath) {
  console.error("Usage: node create-animated-icon.js <input.svg> <output.gif> [frames] [frame-ms]");
  process.exit(1);
}

const FRAMES = parseInt(framesArg || "12", 10);
const DELAY = parseInt(delayArg || "80", 10);
const SIZE = 72;

const template = fs.readFileSync(svgPath, "utf-8");

function pulseReplace(svg, pulse) {
  // Pulse flood glow
  svg = svg.replace(
    /stop-color="#FFD54F" stop-opacity="0\.45"/g,
    `stop-color="#FFD54F" stop-opacity="${(0.25 + 0.35 * pulse).toFixed(2)}"`
  );
  // Pulse beam groups
  svg = svg.replace(
    /(<g filter="url\(#on-beamBlur\)" opacity=")[\d.]+(")/,
    `$1${(0.6 + 0.4 * pulse).toFixed(2)}$2`
  );
  svg = svg.replace(
    /(<g filter="url\(#on-glow\)" opacity=")[\d.]+(")/,
    `$1${(0.6 + 0.4 * pulse).toFixed(2)}$2`
  );
  // Pulse lens
  svg = svg.replace(
    /(<ellipse cx="52" cy="65"[^>]*opacity=")[\d.]+(")/,
    `$1${(0.3 + 0.5 * pulse).toFixed(2)}$2`
  );
  return svg;
}

async function main() {
  console.log(`Generating ${FRAMES} frames at ${DELAY}ms each (${SIZE}x${SIZE})...`);

  const encoder = new GIFEncoder(SIZE, SIZE);
  encoder.setDelay(DELAY);
  encoder.setRepeat(0); // infinite loop
  encoder.setQuality(10);
  encoder.setTransparent(0x000000);
  encoder.start();

  for (let i = 0; i < FRAMES; i++) {
    const t = i / FRAMES;
    const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);

    let svg = pulseReplace(template, pulse);

    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: SIZE } });
    const png = resvg.render().asPng();

    // Get raw RGBA pixels
    const { data } = await sharp(png)
      .resize(SIZE, SIZE)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    encoder.addFrame(data);
  }

  encoder.finish();

  const buf = encoder.out.getData();
  fs.writeFileSync(outPath, buf);

  console.log(`Created: ${outPath} (${buf.length.toLocaleString()} bytes, ${FRAMES} frames, ${FRAMES * DELAY}ms loop)`);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
