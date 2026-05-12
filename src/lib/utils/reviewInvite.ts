/**
 * REVIEW INVITE UTILITY
 *
 * Determines the correct review-invite email template based on
 * booking type and service category, then sends it.
 *
 * Called by the /api/cron/review-invites Vercel Cron Job
 * 24 hours after a booking is marked as "completed".
 */
import React from "react";
import { Document } from "mongodb";
import { sendEmail } from "@/emails/send";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { logEvent } from "@/lib/utils/observability";
import type { ServiceAppointment, CarViewingBooking } from "@/lib/interfaces";

// ── Review email templates ───────────────────────────────────
import { ReviewInviteService } from "@/emails/ReviewInviteService";
import { ReviewInviteViewing } from "@/emails/ReviewInviteViewing";
import { ReviewInviteRepair } from "@/emails/ReviewInviteRepair";
import { ReviewInviteRecovery } from "@/emails/ReviewInviteRecovery";
import { ReviewInviteDetailing } from "@/emails/ReviewInviteDetailing";
import { ReviewInviteTinting } from "@/emails/ReviewInviteTinting";

// ── Service-type keywords used to pick the right template ────
const REPAIR_KEYWORDS = [
  "repair",
  "engine",
  "brake",
  "clutch",
  "transmission",
  "drivetrain",
  "electrical",
  "diagnostic",
  "suspension",
  "exhaust",
  "bodywork",
];

const RECOVERY_KEYWORDS = [
  "recovery",
  "breakdown",
  "towing",
  "tow",
  "roadside",
  "jump start",
  "flat tyre",
  "lockout",
  "fuel delivery",
];

const DETAILING_KEYWORDS = [
  "detail",
  "detailing",
  "valet",
  "polish",
  "wax",
  "ceramic",
  "paint protection",
  "paint correction",
  "interior clean",
  "exterior clean",
];

const TINTING_KEYWORDS = ["tint", "tinting", "window film", "window tint"];

/**
 * Check whether any keyword appears in the service type string.
 */
function matchesKeywords(serviceType: string, keywords: string[]): boolean {
  const lower = serviceType.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Build the review URL for a given booking reference.
 * Falls back to the site root with a query-string param.
 */
function buildReviewUrl(bookingReference: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";
  return `${baseUrl}/review?ref=${encodeURIComponent(bookingReference)}`;
}

/**
 * Send the appropriate review-invite email for a completed booking.
 *
 * @param booking  – the raw MongoDB document for the booking
 * @param type     – "service" | "viewing"
 */
export async function sendReviewInviteEmail(
  booking: Document,
  type: "service" | "viewing"
): Promise<void> {
  const shopInfo = await getBusinessInfo();
  const emailShopInfo = {
    businessName: shopInfo.businessName,
    phone: shopInfo.phone,
    email: shopInfo.email,
    address: `${shopInfo.address}, ${shopInfo.city}, ${shopInfo.state} ${shopInfo.zipCode}`,
  };

  const customerEmail =
    (booking.customerInfo as { email?: string })?.email ?? "";
  const bookingRef = (booking.bookingReference as string) ?? "N/A";

  if (!customerEmail) {
    logEvent("reviewInvite.skipped_no_email", { bookingRef });
    return;
  }

  const reviewUrl = buildReviewUrl(bookingRef);

  let emailElement: React.ReactElement;
  let subject: string;

  if (type === "viewing") {
    // ── Car viewing ──────────────────────────────────────
    const viewingBooking = booking as unknown as CarViewingBooking;
    const carLabel =
      `${viewingBooking.carDetails?.year ?? ""} ${viewingBooking.carDetails?.make ?? ""} ${viewingBooking.carDetails?.model ?? ""}`.trim();

    subject = `How was your viewing of the ${carLabel}? — ${emailShopInfo.businessName}`;
    emailElement = React.createElement(ReviewInviteViewing, {
      booking: viewingBooking,
      shopInfo: emailShopInfo,
      reviewUrl,
    });
  } else {
    // ── Service bookings — pick template by service type ─
    const serviceBooking = booking as unknown as ServiceAppointment;
    const serviceType = serviceBooking.serviceType ?? "";

    if (matchesKeywords(serviceType, RECOVERY_KEYWORDS)) {
      subject = `How was your recovery experience? — ${emailShopInfo.businessName}`;
      emailElement = React.createElement(ReviewInviteRecovery, {
        booking: serviceBooking,
        shopInfo: emailShopInfo,
        reviewUrl,
      });
    } else if (matchesKeywords(serviceType, REPAIR_KEYWORDS)) {
      subject = `How was your repair? — ${emailShopInfo.businessName}`;
      emailElement = React.createElement(ReviewInviteRepair, {
        booking: serviceBooking,
        shopInfo: emailShopInfo,
        reviewUrl,
      });
    } else if (matchesKeywords(serviceType, DETAILING_KEYWORDS)) {
      subject = `How does your car look? — ${emailShopInfo.businessName}`;
      emailElement = React.createElement(ReviewInviteDetailing, {
        booking: serviceBooking,
        shopInfo: emailShopInfo,
        reviewUrl,
      });
    } else if (matchesKeywords(serviceType, TINTING_KEYWORDS)) {
      subject = `How's your new tint? — ${emailShopInfo.businessName}`;
      emailElement = React.createElement(ReviewInviteTinting, {
        booking: serviceBooking,
        shopInfo: emailShopInfo,
        reviewUrl,
      });
    } else {
      // Default: general service review
      subject = `How was your service? — ${emailShopInfo.businessName}`;
      emailElement = React.createElement(ReviewInviteService, {
        booking: serviceBooking,
        shopInfo: emailShopInfo,
        reviewUrl,
      });
    }
  }

  // Log the booking reference only — never customerName/customerEmail in
  // production logs. (CODEBASE_ISSUES F3.) PII would otherwise stream
  // into Vercel logs on every cron invocation.
  console.log(
    `📧 Sending review invite for ${type} booking ${bookingRef}`
  );

  const result = await sendEmail({
    to: customerEmail,
    subject,
    react: emailElement,
  });

  if (!result.success) {
    logEvent("reviewInvite.email_send_failed", {
      bookingRef,
      error: String(result.error),
    });
  }
}
