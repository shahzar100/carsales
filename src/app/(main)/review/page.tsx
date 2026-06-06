import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Star, ExternalLink, Heart } from "lucide-react";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { validateBookingReference } from "@/lib/utils/validation";

// Per-user / per-request; must not cache. (Audit #1.)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leave a Review",
  description: "Share your experience with us — we'd love to hear how we did.",
  // Booking-ref-bearing URLs should never enter the search index.
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{
    ref?: string;
  }>;
}

const ReviewPage = async ({ searchParams }: PageProps) => {
  const [{ ref }, businessInfo] = await Promise.all([
    searchParams,
    getBusinessInfo(),
  ]);

  // Prefer an explicit Google review link. Fall back to the maps URL,
  // which Google still treats as a review-ready destination.
  const externalReviewUrl =
    businessInfo.googleMapsUrl ?? null;

  // Validate ref format. We don't need to look it up in Mongo —
  // the email already proved the user has it. We just confirm the
  // shape and use it for friendliness in the copy.
  const refIsValid = typeof ref === "string" && validateBookingReference(ref);

  // ── Invalid / missing ref ─────────────────────────────────────
  if (!refIsValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="page-title mb-3">We couldn&apos;t find that review link</h1>
          <p className="mb-6 text-gray-600">
            The link from your email may have expired or been mistyped.
            You can still leave us a review directly.
          </p>
          {externalReviewUrl ? (
            <a
              href={externalReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
            >
              Leave a Google review
              <ExternalLink size={16} />
            </a>
          ) : (
            <Link
              href="/contact"
              className="inline-block rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
            >
              Contact us
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Valid ref — full review CTA ───────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <Heart className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="page-title mb-2">Thank you for choosing us</h1>
          <p className="description">
            Your experience matters to us. Could you spare 30 seconds to share
            it with other customers?
          </p>
        </div>

        {/* Star prompt */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          <div className="text-center">
            <div className="mb-3 flex justify-center gap-1" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-7 w-7 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <p className="mb-4 text-gray-700">
              Leaving a review on Google takes about a minute and helps other
              drivers find us.
            </p>
            <p className="mb-6 text-sm text-gray-500">
              Reference:{" "}
              <span className="font-mono font-semibold text-gray-700">
                {ref}
              </span>
            </p>

            {externalReviewUrl ? (
              <a
                href={externalReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
              >
                Leave a Google review
                <ExternalLink size={16} />
              </a>
            ) : (
              <Link
                href="/contact"
                className="inline-block rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
              >
                Contact us with feedback
              </Link>
            )}
          </div>
        </div>

        {/* Alternative — direct contact */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="section-title mb-2">Wasn&apos;t quite right?</h2>
          <p className="mb-4 text-gray-600">
            If something fell short, we&apos;d rather hear from you directly so
            we can put it right.
          </p>
          <Link
            href="/contact"
            className="font-medium text-red-600 hover:text-red-700"
          >
            Get in touch →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
