import { ImageResponse } from "next/og";

// Next.js App Router OG image convention. Exporting `size` + `contentType`
// alongside the default component lets the framework wire the route up at
// `/opengraph-image` and emit the correct meta tags on every page that
// doesn't override its own OG image.
//
// We deliberately don't call `getBusinessInfo()` here. That helper hits
// MongoDB (five collections) and is `React.cache`-wrapped per *request* —
// a benefit which doesn't carry over to a separately-rendered OG route.
// The OG card is a brand asset, not a live data surface, so a hardcoded
// fallback is the right trade-off.

export const runtime = "nodejs";
export const alt = "MMC Leeds — Premium Used Cars in Leeds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #000000 0%, #1a0000 55%, #450a0a 100%)",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Subtle red accent bar on the left edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "12px",
            background: "#dc2626",
            display: "flex",
          }}
        />

        {/* MMC monogram (top right) */}
        <div
          style={{
            position: "absolute",
            top: "64px",
            right: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "120px",
            height: "120px",
            borderRadius: "16px",
            border: "4px solid #dc2626",
            color: "#dc2626",
            fontSize: "56px",
            fontWeight: 900,
            letterSpacing: "-2px",
          }}
        >
          MMC
        </div>

        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            color: "#dc2626",
            fontSize: "28px",
            fontWeight: 600,
            letterSpacing: "8px",
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          MMC Leeds
        </div>

        {/* Business name */}
        <div
          style={{
            display: "flex",
            color: "#ffffff",
            fontSize: "96px",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-3px",
            marginBottom: "32px",
          }}
        >
          Premium Used Cars
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            color: "#d1d5db",
            fontSize: "36px",
            fontWeight: 400,
            lineHeight: 1.3,
            maxWidth: "900px",
            marginBottom: "48px",
          }}
        >
          Browse the fleet, book a viewing, drive away happy.
        </div>

        {/* Footer row: location + url */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            color: "#9ca3af",
            fontSize: "26px",
            fontWeight: 500,
          }}
        >
          <span style={{ display: "flex" }}>Roseville Road, Leeds</span>
          <span style={{ display: "flex", color: "#dc2626" }}>•</span>
          <span style={{ display: "flex" }}>mmcleeds.co.uk</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
