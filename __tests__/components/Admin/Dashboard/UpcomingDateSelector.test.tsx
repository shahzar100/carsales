/**
 * Tests for src/components/Admin/Dashboard/UpcomingDateSelector.tsx
 *
 * Standards coverage:
 * - 📋 Functional: default label is "Next 30 days"; reflects `?upcoming=` for
 *   presets and a custom date; preset clicks push `?upcoming=<v>`; the custom
 *   date input pushes `?upcoming=<YYYY-MM-DD>`
 * - 🎯 Usability: the future window NEVER clobbers the top-of-page range
 *   params (range/from/to are preserved on navigation)
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockPush = jest.fn();
let searchParamsValue: URLSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => searchParamsValue,
  usePathname: () => "/admin/dashboard",
}));

import UpcomingDateSelector from "@/components/Admin/Dashboard/UpcomingDateSelector";

beforeEach(() => {
  mockPush.mockReset();
  searchParamsValue = new URLSearchParams();
});

describe("UpcomingDateSelector", () => {
  it("📋 default label is 'Next 30 days' when no upcoming param is set", () => {
    render(<UpcomingDateSelector />);
    expect(screen.getByText("Next 30 days")).toBeInTheDocument();
  });

  it("📋 reflects `?upcoming=7d` as 'Next 7 days'", () => {
    searchParamsValue.set("upcoming", "7d");
    render(<UpcomingDateSelector />);
    expect(screen.getByText("Next 7 days")).toBeInTheDocument();
  });

  it("📋 reflects a custom date as 'Until <date>'", () => {
    searchParamsValue.set("upcoming", "2030-06-15");
    render(<UpcomingDateSelector />);
    expect(screen.getByText(/Until/)).toBeInTheDocument();
    expect(screen.getByText(/Jun/)).toBeInTheDocument();
  });

  it("📋 clicking a preset pushes ?upcoming=<value>", () => {
    render(<UpcomingDateSelector />);
    fireEvent.click(screen.getByText("Next 30 days"));
    fireEvent.click(screen.getByText("All upcoming"));
    expect(mockPush).toHaveBeenCalledWith("/admin/dashboard?upcoming=all");
  });

  it("🎯 preserves the top-of-page range params (range/from/to)", () => {
    searchParamsValue.set("range", "30d");
    render(<UpcomingDateSelector />);
    fireEvent.click(screen.getByText("Next 30 days"));
    fireEvent.click(screen.getByText("Next 7 days"));
    const url = mockPush.mock.calls.at(-1)?.[0] as string;
    expect(url).toContain("range=30d");
    expect(url).toContain("upcoming=7d");
  });

  it("📋 custom date: Apply pushes ?upcoming=<YYYY-MM-DD>", () => {
    render(<UpcomingDateSelector />);
    fireEvent.click(screen.getByText("Next 30 days"));
    fireEvent.click(screen.getByText(/until a date/i));

    const input = screen
      .getByText("Date")
      .parentElement?.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2030-12-31" } });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));
    expect(mockPush).toHaveBeenCalledWith(
      "/admin/dashboard?upcoming=2030-12-31"
    );
  });

  it("🎯 Apply is disabled until a date is chosen", () => {
    render(<UpcomingDateSelector />);
    fireEvent.click(screen.getByText("Next 30 days"));
    fireEvent.click(screen.getByText(/until a date/i));
    expect(screen.getByRole("button", { name: /^apply$/i })).toBeDisabled();
  });
});
