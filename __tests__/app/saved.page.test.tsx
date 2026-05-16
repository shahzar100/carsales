/**
 * Tests for src/app/(main)/saved/page.tsx
 *
 * Thin shell — exports metadata + renders <SavedCarsPage />. There's no
 * logic to test beyond "the right child component is mounted under this
 * route." Behavior of the saved-cars feature itself lives in
 * SavedCarsPage.test.tsx.
 */
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/Car/SavedCarsPage", () => ({
  __esModule: true,
  default: () => <div data-testid="saved-cars-page" />,
}));

import Page, { metadata } from "@/app/(main)/saved/page";

describe("/saved page shell", () => {
  it("📋 renders <SavedCarsPage />", () => {
    render(<Page />);
    expect(screen.getByTestId("saved-cars-page")).toBeInTheDocument();
  });

  it("🔒 metadata: noindex via robots.index=false (private list, follow allowed)", () => {
    expect(metadata.title).toBe("Saved cars");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
