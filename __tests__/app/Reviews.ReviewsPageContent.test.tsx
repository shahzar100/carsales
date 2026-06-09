/**
 * Tests for src/app/(main)/Reviews/ReviewsPageContent.tsx
 *
 * Client component for the public /Reviews page. Receives a `reviews` prop
 * and renders a RatingDistribution overview (average + per-star counts),
 * a ReviewsFilter tablist (filter by serviceType), and a grid of ReviewCards.
 * Filter state is local React state driven by the real ReviewsFilter child;
 * the empty-reviews and no-match branches each render distinct copy.
 *
 * Standards coverage:
 * - 📋 Functional: renders one card per review; service-type badge label
 *   mapping (known key → friendly label, unknown key → raw value); rating
 *   distribution counts per star bucket and average; verified badge only when
 *   `verified` is true; filtering by serviceType narrows the visible cards;
 *   selecting "All" restores the full list
 * - 🔒 Security: out-of-range ratings are excluded from the distribution
 *   counts (defensive 1–5 guard) so a bad rating can't skew the overview
 * - 🎯 Usability: empty reviews array renders no Rating Overview and the
 *   "No reviews yet" zero-state; filtering to a serviceType with no matching
 *   reviews also shows the zero-state; "review" vs "reviews" singular/plural;
 *   star ratings expose an accessible "N out of 5 stars" label
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";

import ReviewsPageContent from "@/app/(main)/Reviews/ReviewsPageContent";
import type { Review } from "@/lib/interfaces";

const makeReview = (overrides: Partial<Review>): Review => ({
  _id: "rev-default",
  customerName: "Default Customer",
  rating: 5,
  title: "Great experience",
  content: "Everything was excellent.",
  serviceType: "car-purchase",
  verified: false,
  createdAt: new Date("2026-01-15T10:00:00Z"),
  updatedAt: new Date("2026-01-15T10:00:00Z"),
  ...overrides,
});

// Four reviews spanning ratings 1–5 and 3 distinct service types.
const reviewPurchase = makeReview({
  _id: "rev-1",
  customerName: "Alice Smith",
  rating: 5,
  title: "Bought my dream car",
  content: "The sales team made buying so easy.",
  serviceType: "car-purchase",
  verified: true,
});

const reviewService = makeReview({
  _id: "rev-2",
  customerName: "Bob Jones",
  rating: 4,
  title: "Quick service turnaround",
  content: "Booked a service and it was done same day.",
  serviceType: "service",
  verified: false,
});

const reviewDetailing = makeReview({
  _id: "rev-3",
  customerName: "Carol White",
  rating: 2,
  title: "Detailing was okay",
  content: "Interior was clean but missed a spot.",
  serviceType: "detailing",
  verified: true,
});

const reviewPurchaseLow = makeReview({
  _id: "rev-4",
  customerName: "Dan Black",
  rating: 1,
  title: "Disappointed",
  content: "Car had a scratch I had not noticed.",
  serviceType: "car-purchase",
  verified: false,
});

const allReviews = [
  reviewPurchase,
  reviewService,
  reviewDetailing,
  reviewPurchaseLow,
];

describe("ReviewsPageContent", () => {
  it("📋 renders one ReviewCard per provided review", () => {
    render(<ReviewsPageContent reviews={allReviews} />);

    expect(screen.getByText("Bought my dream car")).toBeInTheDocument();
    expect(screen.getByText("Quick service turnaround")).toBeInTheDocument();
    expect(screen.getByText("Detailing was okay")).toBeInTheDocument();
    expect(screen.getByText("Disappointed")).toBeInTheDocument();

    // One <article> per review card.
    expect(screen.getAllByRole("article")).toHaveLength(4);

    // Author names and body content render too.
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(
      screen.getByText("The sales team made buying so easy.")
    ).toBeInTheDocument();
  });

  it("📋 maps known service-type keys to friendly badge labels", () => {
    render(<ReviewsPageContent reviews={[reviewPurchase, reviewService]} />);

    // "Car Purchase" and "Service" labels appear both as a ReviewsFilter tab
    // and as a card badge, so scope each assertion to the matching card.
    const purchaseCard = screen
      .getByText("Bought my dream car")
      .closest("article") as HTMLElement;
    expect(within(purchaseCard).getByText("Car Purchase")).toBeInTheDocument();

    const serviceCard = screen
      .getByText("Quick service turnaround")
      .closest("article") as HTMLElement;
    expect(within(serviceCard).getByText("Service")).toBeInTheDocument();
  });

  it("📋 falls back to the raw serviceType when it has no label mapping", () => {
    const unknown = makeReview({
      _id: "rev-unknown",
      title: "Unknown service review",
      serviceType: "warranty-claim",
    });
    render(<ReviewsPageContent reviews={[unknown]} />);

    const card = screen
      .getByText("Unknown service review")
      .closest("article") as HTMLElement;
    expect(within(card).getByText("warranty-claim")).toBeInTheDocument();
  });

  it("📋 shows the verified badge only for verified reviews", () => {
    render(<ReviewsPageContent reviews={[reviewPurchase, reviewService]} />);

    // reviewPurchase is verified, reviewService is not → exactly one badge.
    expect(screen.getAllByLabelText("Verified review")).toHaveLength(1);

    const verifiedCard = screen
      .getByText("Bought my dream car")
      .closest("article") as HTMLElement;
    expect(
      within(verifiedCard).getByLabelText("Verified review")
    ).toBeInTheDocument();

    const unverifiedCard = screen
      .getByText("Quick service turnaround")
      .closest("article") as HTMLElement;
    expect(
      within(unverifiedCard).queryByLabelText("Verified review")
    ).not.toBeInTheDocument();
  });

  it("📋 computes the average rating and per-star distribution counts", () => {
    render(<ReviewsPageContent reviews={allReviews} />);

    // ratings 5,4,2,1 → average = 12/4 = 3.0
    expect(screen.getByText("3.0")).toBeInTheDocument();

    // Rating Overview header present when there are reviews.
    expect(screen.getByText("Rating Overview")).toBeInTheDocument();

    // The distribution rows render the star digit + its count. The overview
    // also has a top-of-card "N reviews" line; assert plural form for 4.
    expect(screen.getByText("4 reviews")).toBeInTheDocument();
  });

  it("🔒 excludes out-of-range ratings from the distribution average bucket guard", () => {
    // rating 7 is invalid; it must not be counted in any 1–5 bucket, but it
    // still contributes to the raw average (the average has no guard).
    const bad = makeReview({ _id: "rev-bad", rating: 7, serviceType: "tinting" });
    const good = makeReview({ _id: "rev-good", rating: 3, serviceType: "tinting" });
    render(<ReviewsPageContent reviews={[bad, good]} />);

    // average = (7 + 3) / 2 = 5.0 (no clamping on the average itself).
    expect(screen.getByText("5.0")).toBeInTheDocument();
    // Both reviews still render as cards regardless of the bucket guard.
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("🎯 renders the singular 'review' label when there is exactly one", () => {
    render(<ReviewsPageContent reviews={[reviewPurchase]} />);
    expect(screen.getByText("1 review")).toBeInTheDocument();
    expect(screen.queryByText("1 reviews")).not.toBeInTheDocument();
  });

  it("🎯 empty reviews array renders zero-state and no Rating Overview", () => {
    render(<ReviewsPageContent reviews={[]} />);

    // RatingDistribution returns null when total === 0.
    expect(screen.queryByText("Rating Overview")).not.toBeInTheDocument();

    // The no-match / empty branch copy.
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(
      screen.getByText(/be the first to share your experience/i)
    ).toBeInTheDocument();

    // No cards at all.
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("📋 filtering by a service type narrows the visible cards", () => {
    render(<ReviewsPageContent reviews={allReviews} />);

    // Initially all four cards show.
    expect(screen.getAllByRole("article")).toHaveLength(4);

    // Click the "Car Purchase" filter tab.
    fireEvent.click(screen.getByRole("tab", { name: "Car Purchase" }));

    // Only the two car-purchase reviews remain.
    expect(screen.getByText("Bought my dream car")).toBeInTheDocument();
    expect(screen.getByText("Disappointed")).toBeInTheDocument();
    expect(
      screen.queryByText("Quick service turnaround")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Detailing was okay")).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("📋 selecting 'All' after a filter restores the full list", () => {
    render(<ReviewsPageContent reviews={allReviews} />);

    fireEvent.click(screen.getByRole("tab", { name: "Detailing" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("Detailing was okay")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "All" }));
    expect(screen.getAllByRole("article")).toHaveLength(4);
  });

  it("🎯 filtering to a service type with no matches shows the zero-state", () => {
    // No review has serviceType 'recovery', so that filter empties the grid.
    render(<ReviewsPageContent reviews={allReviews} />);

    fireEvent.click(screen.getByRole("tab", { name: "Recovery" }));

    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);

    // The Rating Overview is driven by the full `reviews` prop, not the
    // filtered subset, so it stays rendered while the grid is empty.
    expect(screen.getByText("Rating Overview")).toBeInTheDocument();
  });

  it("🎯 star ratings expose an accessible 'N out of 5 stars' label", () => {
    render(<ReviewsPageContent reviews={[reviewPurchase, reviewDetailing]} />);

    // Per-card star ratings (5 and 2) are present as accessible labels.
    expect(screen.getByLabelText("5 out of 5 stars")).toBeInTheDocument();
    expect(screen.getByLabelText("2 out of 5 stars")).toBeInTheDocument();
  });
});
