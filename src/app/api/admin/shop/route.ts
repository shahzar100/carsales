import { NextRequest, NextResponse } from "next/server";
import { serializeDocument } from "@/lib/models";
import { getSession, isAuthenticated } from "@/lib/utils/auth";
import { recordAudit } from "@/lib/utils/audit";
import { getBusinessInfo, updateBusinessInfo } from "@/lib/utils/businessInfo";
import type { ShopInfo } from "@/lib/interfaces";
import {
  ok,
  badRequest,
  unauthorized,
  notFound,
  fail,
} from "@/lib/utils/apiResponse";
import { logError } from "@/lib/utils/observability";

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized(
        "Authentication required to access business settings"
      );
    }

    const businessInfo = await getBusinessInfo();
    if (!businessInfo) {
      return notFound("No business information found in the database");
    }

    return ok(businessInfo);
  } catch (error) {
    logError(error, { route: "GET /api/admin/shop" });
    return fail("Failed to retrieve business information");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized(
        "Authentication required to update business settings"
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON in request body — could not parse the data");
    }

    if (!body || typeof body !== "object") {
      return badRequest("Request body must be a valid JSON object");
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
      // (Fix 3 / security) `new URL("javascript:alert(1)")` parses
      // cleanly — the URL constructor only checks the grammar, not the
      // scheme. Without the explicit `https:` check below, a compromised
      // admin could ship a `javascript:` href to every public visitor
      // via the contact page's "Visit" link. The render-side helper
      // `safeExternalHref` in `src/lib/utils/url.ts` is the matching
      // defence in depth.
      let parsedMapsUrl: URL | null = null;
      try {
        parsedMapsUrl = new URL(body.googleMapsUrl as string);
      } catch {
        validationErrors.push(
          "Google Maps URL is not a valid URL (expected https://...)"
        );
      }
      if (parsedMapsUrl && parsedMapsUrl.protocol !== "https:") {
        validationErrors.push(
          "Google Maps URL must use https:// — other protocols are not allowed"
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
      logError(dbError, {
        route: "PUT /api/admin/shop",
        op: "updateBusinessInfo",
      });
      return fail("Database update failed");
    }

    const session = await getSession();
    await recordAudit({
      actor: session.username ?? "unknown",
      action: "shop.update",
      targetType: "shop",
      metadata: { fields: Object.keys(body as Record<string, unknown>) },
    });

    return ok(serializeDocument(shopInfo));
  } catch (error) {
    logError(error, { route: "PUT /api/admin/shop" });
    return fail("Unexpected error while saving business information");
  }
}
