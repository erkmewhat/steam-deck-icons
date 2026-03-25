/**
 * Convert SVG strings to base64 PNG data URIs for setImage().
 * Uses resvg-js (already bundled) to render SVG → PNG in memory.
 *
 * SVG data URIs via setImage() don't work reliably on Stream Deck.
 * Base64 PNG data URIs are the supported path.
 */
import { Resvg } from "@resvg/resvg-js";

/**
 * Render an SVG string to a base64 PNG data URI suitable for setImage().
 * Output is 72x72 pixels (native SD button size).
 */
export function svgToPngDataUri(svg: string): string {
    const resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: 72 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    const b64 = Buffer.from(pngBuffer).toString("base64");
    return `data:image/png;base64,${b64}`;
}
