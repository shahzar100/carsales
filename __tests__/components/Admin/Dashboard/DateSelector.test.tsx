/**
 * Tests for src/components/Admin/Dashboard/DateSelector.tsx
 *
 * Standards coverage:
 * - 📋 Functional: label reflects URL state (`?range=` and `?from/?to`);
 *   preset buttons push `?range=<v>` (or strip params for "all"); month
 *   buttons push `?range=month-<i>` and are disabled for future months;
 *   custom range pushes `?range=custom&from=&to=`
 * - 🎯 Usability: Clear (×) badge only appears when a non-default range
 *   is active; clicking the trigger toggles the dropdown; Apply disabled
 *   until both From and To are set
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

import DateSelector from "@/components/Admin/Dashboard/DateSelector";

beforeEach(() => {
  mockPush.mockReset();
  searchParamsValue = new URLSearchParams();
});

describe("DateSelector", () => {
  it("📋 default label is 'All time' when no range is in the URL", () => {
    render(<DateSelector />);
    expect(screen.getByText("All time")).toBeInTheDocument();
  });

  it("📋 reflects `?range=7d` as 'Last 7 days'", () => {
    searchParamsValue.set("range", "7d");
    render(<DateSelector />);
    expect(screen.getByText("Last 7 days")).toBeInTheDocument();
  });

  it("📋 reflects a month range as '<Month> <Year>'", () => {
    searchParamsValue.set("range", "month-0");
    render(<DateSelector />);
    const year = new Date().getFullYear();
    expect(screen.getByText(`January ${year}`)).toBeInTheDocument();
  });

  it("📋 reflects custom from/to as '<from> – <to>' in en-GB", () => {
    searchParamsValue.set("range", "custom");
    searchParamsValue.set("from", "2026-05-01");
    searchParamsValue.set("to", "2026-05-10");
    render(<DateSelector />);
    // Label format is "1 May – 10 May" in en-GB short style; assert with
    // partial fragments so the day-without-leading-zero rendering matches
    // regardless of node version.
    expect(screen.getByText(/1 May/)).toBeInTheDocument();
    expect(screen.getByText(/10 May/)).toBeInTheDocument();
  });

  it("🎯 trigger button toggles the dropdown", () => {
    render(<DateSelector />);
    expect(screen.queryByText(/Quick ranges/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("All time"));
    expect(screen.getByText(/Quick ranges/i)).toBeInTheDocument();
  });

  it("📋 clicking a preset pushes /admin/dashboard?range=<value>", () => {
    render(<DateSelector />);
    fireEvent.click(screen.getByText("All time"));
    fireEvent.click(screen.getByText("Last 30 days"));
    expect(mockPush).toHaveBeenCalledWith("/admin/dashboard?range=30d");
  });

  it("📋 the 'All time' preset strips the range param from the URL", () => {
    searchParamsValue.set("range", "30d");
    render(<DateSelector />);
    fireEvent.click(screen.getByText("Last 30 days"));
    fireEvent.click(screen.getByText("All time"));
    // No range= in the navigated URL
    const lastCall = mockPush.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toBe("/admin/dashboard");
  });

  it("📋 month button pushes /admin/dashboard?range=month-<idx>", () => {
    render(<DateSelector />);
    fireEvent.click(screen.getByText("All time"));
    // Click any past or current month — use the current month so we don't
    // pick a disabled-future button.
    const currentMonthIdx = new Date().getMonth();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    fireEvent.click(screen.getByText(months[currentMonthIdx]));
    expect(mockPush).toHaveBeenCalledWith(
      `/admin/dashboard?range=month-${currentMonthIdx}`
    );
  });

  it("🎯 future months are disabled", () => {
    render(<DateSelector />);
    fireEvent.click(screen.getByText("All time"));
    const currentMonthIdx = new Date().getMonth();
    // If we're in December (11), there are no future months — skip
    if (currentMonthIdx >= 11) return;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const futureBtn = screen
      .getByText(months[currentMonthIdx + 1])
      .closest("button");
    expect(futureBtn).toBeDisabled();
  });

  it("📋 custom range: Apply pushes ?range=custom&from=&to= with the values", () => {
    render(<DateSelector />);
    fireEvent.click(screen.getByText("All time"));
    fireEvent.click(screen.getByText(/custom date range/i));

    const fromInput = screen
      .getByText("From")
      .parentElement?.querySelector("input") as HTMLInputElement;
    const toInput = screen
      .getByText("To")
      .parentElement?.querySelector("input") as HTMLInputElement;
    fireEvent.change(fromInput, { target: { value: "2026-06-01" } });
    fireEvent.change(toInput, { target: { value: "2026-06-30" } });

    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));
    expect(mockPush).toHaveBeenCalledWith(
      "/admin/dashboard?range=custom&from=2026-06-01&to=2026-06-30"
    );
  });

  it("🎯 Apply is disabled until both From and To are set", () => {
    render(<DateSelector />);
    fireEvent.click(screen.getByText("All time"));
    fireEvent.click(screen.getByText(/custom date range/i));
    expect(screen.getByRole("button", { name: /^apply$/i })).toBeDisabled();
  });

  it("🎯 Clear (×) badge appears when a filter is active and pushes a clean URL", () => {
    searchParamsValue.set("range", "7d");
    render(<DateSelector />);
    const clear = screen.getByTitle(/clear filter/i);
    fireEvent.click(clear);
    expect(mockPush).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("🎯 no Clear badge when range is 'all' or absent", () => {
    render(<DateSelector />);
    expect(screen.queryByTitle(/clear filter/i)).not.toBeInTheDocument();
  });

  it("📋 'Back' button in custom panel returns to the presets view", () => {
    render(<DateSelector />);
    fireEvent.click(screen.getByText("All time"));
    fireEvent.click(screen.getByText(/custom date range/i));
    expect(screen.getByText("Custom Range")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(screen.queryByText("Custom Range")).not.toBeInTheDocument();
    expect(screen.getByText(/Quick ranges/i)).toBeInTheDocument();
  });

  it("🎯 preserves the independent `upcoming` window param when changing range", () => {
    // The Upcoming card owns `upcoming`; the top selector must not drop it.
    searchParamsValue.set("upcoming", "7d");
    render(<DateSelector />);
    fireEvent.click(screen.getByText("All time"));
    fireEvent.click(screen.getByText("Last 30 days"));
    const url = mockPush.mock.calls.at(-1)?.[0] as string;
    expect(url).toContain("range=30d");
    expect(url).toContain("upcoming=7d");
  });
});
