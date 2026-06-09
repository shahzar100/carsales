import React from "react";
import type { Metadata } from "next";
import { Star, MessageSquare, Users, ThumbsUp } from "lucide-react";
import { ServiceHero } from "@/components/Services/Common";
import { getReviewsCollection, serializeDocument } from "@/lib/models";
import { Review } from "@/lib/interfaces";
import { logError } from "@/lib/utils/observability";
import { JsonLd } from "@/components/SEO/JsonLd";
import ReviewsPageContent from "./ReviewsPageContent";

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "MMC Leeds";

// Reviews change rarely; revalidate every 5 minutes (per-page strategy,
// see (main)/layout.tsx).
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Customer Reviews",
  description:
    "Read what our customers have to say about their experience with our vehicles, services, and support. Real reviews from verified customers.",
  alternates: { canonical: "/Reviews" },
  openGraph: {
    title: "Customer Reviews",
    description:
      "Read what our customers have to say about their experience with our vehicles, services, and support.",
    url: "/Reviews",
  },
};

const getReviews = async (): Promise<Review[]> => {
  try {
    const reviewsCollection = await getReviewsCollection();
    const reviews = await reviewsCollection
      .find({ verified: true })
      .sort({ createdAt: -1 })
      .toArray();
    return reviews.map((review) => serializeDocument(review) as Review);
  } catch (error) {
    logError(error, { context: "Reviews.getReviews" });
    return [];
  }
};

const ReviewsPage = async () => {
  const reviews = await getReviews();

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const heroProps = {
    icon: Star,
    iconBgColor: "bg-red-50 text-red-600",
    title: "Customer Reviews",
    description:
      "See what our customers have to say about their experience. We take pride in delivering quality vehicles and exceptional service.",
    badges: [
      {
        icon: MessageSquare,
        text: `${totalReviews} Reviews`,
        color: "text-red-500",
      },
      {
        icon: ThumbsUp,
        text: `${averageRating.toFixed(1)} Average Rating`,
        color: "text-gray-900",
      },
      { icon: Users, text: "Verified Customers", color: "text-red-700" },
    ],
  };

  // AggregateRating structured data, built from the same verified reviews
  // the page already summarises. Only emitted when there are real reviews.
  const aggregateRatingJsonLd =
    totalReviews > 0
      ? {
          "@context": "https://schema.org",
          "@type": "AutomotiveBusiness",
          name: businessName,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating.toFixed(1),
            reviewCount: totalReviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {aggregateRatingJsonLd && <JsonLd data={aggregateRatingJsonLd} />}
      <ServiceHero {...heroProps} />
      <ReviewsPageContent reviews={reviews} />
    </div>
  );
};

export default ReviewsPage;
