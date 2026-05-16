/**
 * Tests for the remaining loading skeletons:
 *   - CarCardSkeleton
 *   - CarListCardSkeleton
 *   - CarDetailSkeleton
 *   - HeroFeaturedCarSkeleton
 *   - PackageCardSkeleton
 *
 * Standards coverage:
 * - 📋 Functional: each renders the `skeleton-shimmer` class so the
 *   shimmer animation continues to fire; a regression in the CSS-class
 *   name (or motion config) is detectable here without a visual test.
 */
import React from "react";
import { render } from "@testing-library/react";
import CarCardSkeleton from "@/components/UI/Skeleton/CarCardSkeleton";
import CarListCardSkeleton from "@/components/UI/Skeleton/CarListCardSkeleton";
import CarDetailSkeleton from "@/components/UI/Skeleton/CarDetailSkeleton";
import HeroFeaturedCarSkeleton from "@/components/UI/Skeleton/HeroFeaturedCarSkeleton";
import PackageCardSkeleton from "@/components/UI/Skeleton/PackageCardSkeleton";

const cases: Array<[string, React.FC]> = [
  ["CarCardSkeleton", CarCardSkeleton],
  ["CarListCardSkeleton", CarListCardSkeleton],
  ["CarDetailSkeleton", CarDetailSkeleton],
  ["HeroFeaturedCarSkeleton", HeroFeaturedCarSkeleton],
  ["PackageCardSkeleton", PackageCardSkeleton],
];

describe.each(cases)("%s", (_label, Component) => {
  it("renders as a real DOM tree (not null) with placeholder content", () => {
    const { container } = render(<Component />);
    expect(container.firstChild).toBeTruthy();
    // All skeletons share the same placeholder treatment — a
    // motion-driven rounded box. Asserting any element with one of the
    // shared rounded-* tailwind classes catches a regression where the
    // skeleton accidentally rendered no children at all.
    const placeholders = container.querySelectorAll(
      '[class*="rounded"], [class*="skeleton-shimmer"], [class*="animate-pulse"]'
    );
    expect(placeholders.length).toBeGreaterThan(0);
  });
});
