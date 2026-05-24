// Twitter cards use the same 1200x630 frame as the standard OG card, so
// we delegate to the same generator. Re-exporting the default + metadata
// keeps the brand asset in one place — edit `opengraph-image.tsx` and
// both surfaces update.

export {
  default,
  runtime,
  alt,
  size,
  contentType,
} from "./opengraph-image";
