import { ImageResponse } from "next/og";
import { ObjectId } from "mongodb";
import type { CarInterface } from "@/lib/interfaces";
import { getCarsCollection, serializeDocument } from "@/lib/models";
import { formatPrice, formatMileage } from "@/lib/utils/format";
import { logError } from "@/lib/utils/observability";

// Per-car OG card. Falls back to the static brand card (visually identical
// to `src/app/opengraph-image.tsx`) on any failure — bad id, Mongo down,
// missing car — so a broken share preview never 500s the listing.

export const runtime = "nodejs";
export const alt = "MMC Leeds — Vehicle Listing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: { _id: string };
}

async function safeGetCar(id: string): Promise<CarInterface | null> {
  try {
    // Reject ids that aren't a valid ObjectId before touching Mongo — the
    // constructor throws on garbage input and we want the fallback path,
    // not a stack trace, when a crawler probes an invalid URL.
    if (!ObjectId.isValid(id)) return null;
    const cars = await getCarsCollection();
    const doc = await cars.findOne({ _id: new ObjectId(id) as never });
    if (!doc) return null;
    return serializeDocument(doc) as CarInterface;
  } catch (error) {
    logError(error, { context: "BrowseFleet/[_id]/opengraph-image.safeGetCar" });
    return null;
  }
}

function StaticFallback() {
  return (
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
      <div
        style={{
          display: "flex",
          color: "#d1d5db",
          fontSize: "36px",
          fontWeight: 400,
          lineHeight: 1.3,
          maxWidth: "900px",
        }}
      >
        Browse the fleet, book a viewing, drive away happy.
      </div>
    </div>
  );
}

export default async function CarOpengraphImage({ params }: Props) {
  const { _id } = await (params as unknown as Promise<{ _id: string }>);
  const car = await safeGetCar(_id);

  if (!car) {
    return new ImageResponse(<StaticFallback />, { ...size });
  }

  const title = `${car.year} ${car.make} ${car.model}`;
  const price = formatPrice(car.price);
  const mileage = `${formatMileage(car.mileage)} miles`;

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
        {/* Brand accent bar */}
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

        {/* MMC monogram */}
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
            fontSize: "26px",
            fontWeight: 600,
            letterSpacing: "8px",
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          MMC Leeds Vehicle
        </div>

        {/* Year / Make / Model */}
        <div
          style={{
            display: "flex",
            color: "#ffffff",
            fontSize: "88px",
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: "-3px",
            marginBottom: "40px",
            maxWidth: "980px",
          }}
        >
          {title}
        </div>

        {/* Price (the headline number) */}
        <div
          style={{
            display: "flex",
            color: "#dc2626",
            fontSize: "72px",
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: "-2px",
            marginBottom: "32px",
          }}
        >
          {price}
        </div>

        {/* Spec strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            color: "#d1d5db",
            fontSize: "30px",
            fontWeight: 500,
            marginBottom: "32px",
          }}
        >
          <span style={{ display: "flex" }}>{mileage}</span>
          <span style={{ display: "flex", color: "#dc2626" }}>•</span>
          <span style={{ display: "flex", textTransform: "capitalize" }}>
            {car.fuel}
          </span>
          <span style={{ display: "flex", color: "#dc2626" }}>•</span>
          <span style={{ display: "flex", textTransform: "capitalize" }}>
            {car.transmission}
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            color: "#9ca3af",
            fontSize: "24px",
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
