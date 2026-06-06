"use client";

import React, { useState, useMemo } from "react";
import { Star, CheckCircle } from "lucide-react";
import { Review } from "@/lib/interfaces";
import ReviewsFilter from "@/components/Reviews/ReviewsFilter";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  "car-purchase": "Car Purchase",
  service: "Service",
  viewing: "Viewing",
  detailing: "Detailing",
  tinting: "Tinting",
  recovery: "Recovery",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function RatingDistribution({ reviews }: { reviews: Review[] }) {
  const total = reviews.length;
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating - 1]++;
      }
    });
    return counts;
  }, [reviews]);

  if (total === 0) return null;

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / total;

  return (
    <div className="card mb-10 p-6">
      <h2 className="section-title mb-6">Rating Overview</h2>
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        {/* Average rating */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          <StarRating rating={Math.round(averageRating)} />
          <span className="subtitle">
            {total} {total === 1 ? "review" : "reviews"}
          </span>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star - 1];
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-8 text-right text-sm font-medium text-gray-700">
                  {star}
                </span>
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-sm text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="card p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="heading-3">{review.title}</h3>
            {review.verified && (
              <CheckCircle
                className="h-4 w-4 text-emerald-500"
                aria-label="Verified review"
              />
            )}
          </div>
          <StarRating rating={review.rating} />
        </div>
        <span className="badge badge-accent">
          {SERVICE_TYPE_LABELS[review.serviceType] || review.serviceType}
        </span>
      </div>

      <p className="body mb-4">{review.content}</p>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-sm font-medium text-gray-900">
          {review.customerName}
        </span>
        <time
          className="caption"
          dateTime={new Date(review.createdAt).toISOString()}
        >
          {formattedDate}
        </time>
      </div>
    </article>
  );
}

interface ReviewsPageContentProps {
  reviews: Review[];
}

const ReviewsPageContent: React.FC<ReviewsPageContentProps> = ({
  reviews,
}) => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredReviews = useMemo(() => {
    if (activeFilter === "all") return reviews;
    return reviews.filter((r) => r.serviceType === activeFilter);
  }, [reviews, activeFilter]);

  return (
    <>
      <RatingDistribution reviews={reviews} />

      <section aria-label="Customer reviews">
        <h2 className="section-title mb-6">What Our Customers Say</h2>

        <ReviewsFilter onFilterChange={setActiveFilter} />

        {filteredReviews.length === 0 ? (
          <div className="py-16 text-center">
            <Star className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="heading-3">No reviews yet</p>
            <p className="description mt-2">
              Be the first to share your experience with us.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredReviews.map((review) => (
              <ReviewCard key={String(review._id)} review={review} />
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default ReviewsPageContent;
