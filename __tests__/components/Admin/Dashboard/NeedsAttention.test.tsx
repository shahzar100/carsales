/**
 * Tests for src/components/Admin/Dashboard/NeedsAttention.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders nothing when total=0; shows the count badge and a
 *   row per item; links each row to the matching admin tab; surfaces a
 *   "+N more" footer when the displayed slice is capped below the total
 */
import React from "react";
import { render, screen } from "@testing-library/react";

// next/link needs the app-router context to render; a plain anchor stand-in
// keeps this a pure presentational test.
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import NeedsAttention from "@/components/Admin/Dashboard/NeedsAttention";
import type { ActivityItem } from "@/components/Admin/Dashboard/types";

const item = (over: Partial<ActivityItem> = {}): ActivityItem => ({
  type: "viewing",
  reference: "VW-1",
  customer: "Alice",
  date: "2030-01-01",
  time: "10:00",
  status: "pending",
  detail: "2020 Toyota Corolla",
  ...over,
});

describe("NeedsAttention", () => {
  it("🎯 renders nothing when total is 0", () => {
    const { container } = render(
      <NeedsAttention data={{ items: [], total: 0 }} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the total badge and a row per item", () => {
    render(
      <NeedsAttention
        data={{
          items: [
            item({ reference: "VW-1", customer: "Alice" }),
            item({ reference: "BK-1", customer: "Bob", type: "service" }),
          ],
          total: 2,
        }}
      />
    );
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("links each row to the matching admin tab by type", () => {
    render(
      <NeedsAttention
        data={{
          items: [
            item({ reference: "VW-1", type: "viewing" }),
            item({ reference: "BK-1", type: "service", customer: "Bob" }),
          ],
          total: 2,
        }}
      />
    );
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/admin/dashboard/viewing");
    expect(hrefs).toContain("/admin/dashboard/service");
  });

  it("surfaces a '+N more' footer when items are capped below the total", () => {
    render(<NeedsAttention data={{ items: [item()], total: 5 }} />);
    expect(screen.getByText(/\+\s*4 more need attention/i)).toBeInTheDocument();
  });

  it("omits the footer when everything is shown", () => {
    render(<NeedsAttention data={{ items: [item()], total: 1 }} />);
    expect(screen.queryByText(/more need attention/i)).not.toBeInTheDocument();
  });
});
