import React from "react";
import type { Metadata } from "next";
import { Star, MessageSquare, Users, ThumbsUp } from "lucide-react";
import { ServiceHero } from "@/components/Services/Common";
import { getReviewsCollection, serializeDocument } from "@/lib/models";
import { Review } from "@/lib/interfaces";
import { logError } from "@/lib/utils/observability";
import ReviewsPageContent from "./ReviewsPageContent";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ServiceHero {...heroProps} />
      <ReviewsPageContent reviews={reviews} />
    </div>
  );
};

export default ReviewsPage;
