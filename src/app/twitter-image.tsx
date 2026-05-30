// Twitter cards use the same 1200x630 frame as the standard OG card, so we
// reuse the same image generator (the default export) to keep the brand
// asset in one place — edit `opengraph-image.tsx` and both surfaces update.
//
// Route-segment config (`runtime`) and the metadata fields must be declared
// directly here, not re-exported: Next.js statically parses these at build
// time and a re-export (`export { runtime } from "./opengraph-image"`) fails
// the Turbopack build ("can't recognize the exported `runtime` field").
import OpengraphImage from "./opengraph-image";

export const runtime = "nodejs";
export const alt = "MMC Leeds — Premium Used Cars in Leeds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default OpengraphImage;
