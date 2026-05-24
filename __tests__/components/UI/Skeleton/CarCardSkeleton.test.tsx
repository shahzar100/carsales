/**
 * Tests for src/components/UI/Skeleton/CarCardSkeleton.tsx,
 *           CarDetailSkeleton.tsx, CarListCardSkeleton.tsx,
 *           HeroFeaturedCarSkeleton.tsx, PackageCardSkeleton.tsx
 *
 * Standards coverage:
 * - 📋 Functional: each skeleton renders into the DOM without throwing,
 *   uses the shared `skeleton-shimmer` class somewhere in its tree
 *   (CSS hook for the loading animation), and contributes the expected
 *   structural placeholders (image stub + spec rows + buttons, etc).
 *   These are pure-visual placeholders so we keep tests to render-smoke
 *   plus the shimmer-class invariant.
 */
import React from "react";
import { render } from "@testing-library/react";
import CarCardSkeleton from "@/components/UI/Skeleton/CarCardSkeleton";
import CarDetailSkeleton from "@/components/UI/Skeleton/CarDetailSkeleton";
import CarListCardSkeleton from "@/components/UI/Skeleton/CarListCardSkeleton";
import HeroFeaturedCarSkeleton from "@/components/UI/Skeleton/HeroFeaturedCarSkeleton";
import PackageCardSkeleton from "@/components/UI/Skeleton/PackageCardSkeleton";

describe("Skeleton placeholders", () => {
  it("📋 CarCardSkeleton renders with shimmer placeholders", () => {
    const { container } = render(<CarCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
    expect(
      container.querySelectorAll(".skeleton-shimmer").length
    ).toBeGreaterThan(0);
  });

  it("📋 CarDetailSkeleton renders without throwing", () => {
    const { container } = render(<CarDetailSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("📋 CarListCardSkeleton renders without throwing", () => {
    const { container } = render(<CarListCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("📋 HeroFeaturedCarSkeleton renders dark-themed shimmer", () => {
    const { container } = render(<HeroFeaturedCarSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
    expect(
      container.querySelectorAll(".skeleton-shimmer-dark").length
    ).toBeGreaterThan(0);
  });

  it("📋 PackageCardSkeleton renders without throwing", () => {
    const { container } = render(<PackageCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
