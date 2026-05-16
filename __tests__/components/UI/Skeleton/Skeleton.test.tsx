/**
 * Tests for src/components/UI/Skeleton/Skeleton.tsx
 *
 * Standards coverage:
 * - 📋 Functional: all four primitives render with the expected width /
 *   height / shape; SkeletonText renders `lines` rows with the last one
 *   60% width; SkeletonWrapper switches between skeleton and children on
 *   the `isLoading` flag.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  SkeletonBlock,
  SkeletonCircle,
  SkeletonText,
  SkeletonImage,
  SkeletonWrapper,
} from "@/components/UI/Skeleton/Skeleton";

describe("Skeleton primitives", () => {
  it("SkeletonBlock renders with the supplied width/height/rounded class", () => {
    const { container } = render(
      <SkeletonBlock width="200px" height="40px" rounded="rounded-xl" />
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveStyle({ width: "200px", height: "40px" });
    expect(el.className).toContain("rounded-xl");
    expect(el.className).toContain("skeleton-shimmer");
  });

  it("SkeletonBlock falls back to sensible defaults", () => {
    const { container } = render(<SkeletonBlock />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveStyle({ width: "100%", height: "1rem" });
    expect(el.className).toContain("rounded-lg");
  });

  it("SkeletonCircle renders a circular shape sized in px", () => {
    const { container } = render(<SkeletonCircle size={60} />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveStyle({ width: "60px", height: "60px" });
    expect(el.className).toContain("rounded-full");
  });

  it("SkeletonText renders one row per line", () => {
    const { container } = render(<SkeletonText lines={5} />);
    expect(container.querySelectorAll(".skeleton-shimmer")).toHaveLength(5);
  });

  it("SkeletonText defaults to 3 lines", () => {
    const { container } = render(<SkeletonText />);
    expect(container.querySelectorAll(".skeleton-shimmer")).toHaveLength(3);
  });

  it("SkeletonText shortens the last line to 60% width", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const rows = container.querySelectorAll(".skeleton-shimmer");
    const last = rows[rows.length - 1] as HTMLElement;
    expect(last).toHaveStyle({ width: "60%" });
  });

  it("SkeletonImage renders the supplied aspect ratio class", () => {
    const { container } = render(<SkeletonImage aspectRatio="aspect-square" />);
    expect(container.firstChild).toHaveProperty("className");
    expect((container.firstChild as HTMLElement).className).toContain(
      "aspect-square"
    );
  });

  it("SkeletonWrapper shows the skeleton when isLoading=true", () => {
    render(
      <SkeletonWrapper
        isLoading={true}
        skeleton={<div data-testid="placeholder" />}
      >
        <div data-testid="real">real content</div>
      </SkeletonWrapper>
    );
    expect(screen.getByTestId("placeholder")).toBeInTheDocument();
    expect(screen.queryByTestId("real")).not.toBeInTheDocument();
  });

  it("SkeletonWrapper reveals children when isLoading=false", () => {
    render(
      <SkeletonWrapper
        isLoading={false}
        skeleton={<div data-testid="placeholder" />}
      >
        <div data-testid="real">real content</div>
      </SkeletonWrapper>
    );
    expect(screen.queryByTestId("placeholder")).not.toBeInTheDocument();
    expect(screen.getByTestId("real")).toBeInTheDocument();
  });
});
