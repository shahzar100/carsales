import { NextRequest, NextResponse } from "next/server";
import { serializeDocument } from "@/lib/models";
import { isAuthenticated } from "@/lib/utils/auth";
import { getBusinessInfo, updateBusinessInfo } from "@/lib/utils/businessInfo";
import type { ShopInfo } from "@/lib/interfaces";

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Authentication required to access business settings" },
        { status: 401 }
      );
    }

    const businessInfo = await getBusinessInfo();

    if (!businessInfo) {
      return NextResponse.json(
        { error: "No business information found in the database" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: businessInfo,
    });
  } catch (error) {
    console.error("Error fetching shop info:", error);
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      {
        error: `Failed to retrieve business information: ${message}`,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Authentication required to update business settings" },
        { status: 401 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body — could not parse the data" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid JSON object" },
        { status: 400 }
      );
    }

    // ── Field validation ───────────────────────────────────
    const validationErrors: string[] = [];

    if (
      !body.businessName ||
      typeof body.businessName !== "string" ||
      body.businessName.trim().length === 0
    ) {
      validationErrors.push("Business Name is required");
    }

    if (
      !body.address ||
      typeof body.address !== "string" ||
      body.address.trim().length === 0
    ) {
      validationErrors.push("Address is required");
    }

    if (
      !body.city ||
      typeof body.city !== "string" ||
      body.city.trim().length === 0
    ) {
      validationErrors.push("City is required");
    }

    if (
      !body.phone ||
      typeof body.phone !== "string" ||
      body.phone.trim().length === 0
    ) {
      validationErrors.push("Phone number is required");
    }

    if (
      !body.email ||
      typeof body.email !== "string" ||
      body.email.trim().length === 0
    ) {
      validationErrors.push("Email address is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email as string)) {
      validationErrors.push(
        "Email address format is invalid (expected user@domain.com)"
      );
    }

    if (
      body.bookingsEmail &&
      typeof body.bookingsEmail === "string" &&
      body.bookingsEmail.trim().length > 0 &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.bookingsEmail)
    ) {
      validationErrors.push(
        "Bookings Email format is invalid (expected user@domain.com)"
      );
    }

    if (
      body.googleMapsUrl &&
      typeof body.googleMapsUrl === "string" &&
      body.googleMapsUrl.trim().length > 0
    ) {
      try {
        new URL(body.googleMapsUrl as string);
      } catch {
        validationErrors.push(
          "Google Maps URL is not a valid URL (expected https://...)"
        );
      }
    }

    if (!body.hours || typeof body.hours !== "object") {
      validationErrors.push("Business hours are required");
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: `Validation failed: ${validationErrors.join("; ")}`,
          validationErrors,
        },
        { status: 400 }
      );
    }

    const shopInfo: Partial<ShopInfo> = {
      businessName: body.businessName as string,
      address: body.address as string,
      city: body.city as string,
      state: (body.state as string) || "",
      zipCode: (body.zipCode as string) || "",
      phone: body.phone as string,
      email: body.email as string,
      bookingsEmail: (body.bookingsEmail as string) || "",
      googleMapsUrl: (body.googleMapsUrl as string) || "",
      hours: body.hours as ShopInfo["hours"],
      description: (body.description as string) || "",
      socialMedia: (body.socialMedia as ShopInfo["socialMedia"]) || {},
      heroStats: body.heroStats as ShopInfo["heroStats"],
      detailingPackages:
        body.detailingPackages as ShopInfo["detailingPackages"],
      tintOptions: body.tintOptions as ShopInfo["tintOptions"],
      serviceOverviews: body.serviceOverviews as ShopInfo["serviceOverviews"],
      recovery: body.recovery as ShopInfo["recovery"],
    };

    try {
      await updateBusinessInfo(shopInfo);
    } catch (dbError) {
      console.error("Database error while updating business info:", dbError);
      const dbMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      return NextResponse.json(
        {
          error: `Database update failed: ${dbMessage}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeDocument(shopInfo),
    });
  } catch (error) {
    console.error("Error updating shop info:", error);
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      {
        error: `Unexpected error while saving business information: ${message}`,
      },
      { status: 500 }
    );
  }
}
