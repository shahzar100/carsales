/**
 * Tests for src/components/Admin/Navigation/FeaturedToggle.tsx
 *
 * Standards coverage:
 * - 📋 Functional: the star button reflects the car's `featured` flag;
 *   clicking PUTs the flipped flag to /api/admin/cars and refreshes.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FeaturedToggle from "@/components/Admin/Navigation/FeaturedToggle";
import type { CarInterface } from "@/lib/interfaces";

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: mockRefresh }),
}));
jest.mock("@/contexts/ToastContext", () => ({
  useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));

const car = {
  _id: "car-9",
  year: 2023,
  make: "Tesla",
  model: "Model 3",
  featured: false,
} as unknown as CarInterface;

describe("FeaturedToggle", () => {
  let fetchMock: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  });

  it("renders a star button reflecting the unfeatured state", () => {
    render(<FeaturedToggle car={car} />);
    expect(
      screen.getByRole("button", { name: /add to featured/i })
    ).toBeInTheDocument();
  });

  it("a featured car's button offers to remove it", () => {
    render(<FeaturedToggle car={{ ...car, featured: true }} />);
    expect(
      screen.getByRole("button", { name: /remove from featured/i })
    ).toBeInTheDocument();
  });

  it("📋 clicking PUTs the flipped featured flag and refreshes", async () => {
    render(<FeaturedToggle car={car} />);
    fireEvent.click(screen.getByRole("button", { name: /add to featured/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/cars",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ _id: "car-9", featured: true }),
        })
      );
    });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });
});
