/**
 * Tests for src/components/Admin/AuditLogTable.tsx
 *
 * Standards coverage:
 * - 📋 Functional: rows render with formatted timestamp, actor, action,
 *   target, metadata; filter dropdowns push the right query string;
 *   "Older entries" link preserves active filters
 * - 🎯 Usability: empty state when filtered to zero rows; "Clear filters"
 *   link only shows when filters are active
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// The global jest.setup.component.js mocks useRouter() to return a fresh
// object literal on every call — so the global `push` jest.fn() resets
// between renders and `expect(push).toHaveBeenCalled()` always fails.
// Override the mock here with a stable singleton we can assert against.
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

import AuditLogTable from "@/components/Admin/AuditLogTable";
import type { AuditLog } from "@/lib/interfaces";

const sampleRows: AuditLog[] = [
  {
    _id: "row-1",
    createdAt: new Date("2026-05-15T10:30:00Z"),
    actor: "alice",
    action: "car.update",
    targetType: "car",
    targetId: "abc123def456",
    metadata: { fields: ["price"] },
  } as unknown as AuditLog,
  {
    _id: "row-2",
    createdAt: new Date("2026-05-15T09:00:00Z"),
    actor: "bob",
    action: "user.create",
    targetType: "user",
    targetId: "user-xyz",
    metadata: undefined,
  } as unknown as AuditLog,
];

describe("AuditLogTable", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("renders one row per audit entry with actor, action, target columns", () => {
    render(
      <AuditLogTable
        rows={sampleRows}
        actors={["alice", "bob"]}
        actions={["car.update", "user.create"]}
        filter={{}}
        nextCursor={null}
      />
    );
    // Each name shows up in both the <option> dropdown and the <td>
    // cell — getAllByText keeps the assertion robust to that.
    expect(screen.getAllByText("alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("bob").length).toBeGreaterThan(0);
    expect(screen.getAllByText("car.update").length).toBeGreaterThan(0);
    expect(screen.getAllByText("user.create").length).toBeGreaterThan(0);
  });

  it("formats createdAt using the en-GB locale", () => {
    render(
      <AuditLogTable
        rows={sampleRows}
        actors={[]}
        actions={[]}
        filter={{}}
        nextCursor={null}
      />
    );
    // en-GB short month formatting → "15 May 2026" or similar
    expect(screen.getAllByText(/May.*2026/i).length).toBeGreaterThan(0);
  });

  it("truncates long targetId to the first 8 chars + ellipsis", () => {
    render(
      <AuditLogTable
        rows={sampleRows}
        actors={[]}
        actions={[]}
        filter={{}}
        nextCursor={null}
      />
    );
    // sampleRows[0].targetId = "abc123def456" → "abc123de…"
    expect(screen.getByText(/abc123de…/)).toBeInTheDocument();
  });

  it("renders metadata as 'key=value, key=value'", () => {
    render(
      <AuditLogTable
        rows={sampleRows}
        actors={[]}
        actions={[]}
        filter={{}}
        nextCursor={null}
      />
    );
    expect(screen.getByText(/fields=\["price"\]/)).toBeInTheDocument();
  });

  it("renders an em-dash when metadata is missing", () => {
    render(
      <AuditLogTable
        rows={[sampleRows[1]]}
        actors={[]}
        actions={[]}
        filter={{}}
        nextCursor={null}
      />
    );
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("🎯 shows the empty-state message when rows is []", () => {
    render(
      <AuditLogTable
        rows={[]}
        actors={[]}
        actions={[]}
        filter={{}}
        nextCursor={null}
      />
    );
    expect(
      screen.getByText(/no audit log entries match the filters/i)
    ).toBeInTheDocument();
  });

  it("🎯 hides the 'Clear filters' link when no filter is active", () => {
    render(
      <AuditLogTable
        rows={sampleRows}
        actors={["alice"]}
        actions={["car.update"]}
        filter={{}}
        nextCursor={null}
      />
    );
    expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument();
  });

  it("🎯 shows the 'Clear filters' link when any filter is active", () => {
    render(
      <AuditLogTable
        rows={sampleRows}
        actors={["alice"]}
        actions={["car.update"]}
        filter={{ actor: "alice" }}
        nextCursor={null}
      />
    );
    expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
  });

  it("📋 pushes the right URL when an actor filter is chosen", () => {
    render(
      <AuditLogTable
        rows={sampleRows}
        actors={["alice", "bob"]}
        actions={["car.update"]}
        filter={{}}
        nextCursor={null}
      />
    );
    const actorSelect = screen.getByDisplayValue("All actors");
    fireEvent.change(actorSelect, { target: { value: "alice" } });
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/admin/dashboard/audit?actor=alice")
    );
  });

  it("📋 preserves existing filters when changing one of them", () => {
    render(
      <AuditLogTable
        rows={sampleRows}
        actors={["alice", "bob"]}
        actions={["car.update", "user.create"]}
        filter={{ actor: "alice" }}
        nextCursor={null}
      />
    );
    const actionSelect = screen.getByDisplayValue("All actions");
    fireEvent.change(actionSelect, { target: { value: "car.update" } });
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).toContain("actor=alice");
    expect(url).toContain("action=car.update");
  });

  it("📋 'Older entries' link carries cursor + active filters", () => {
    render(
      <AuditLogTable
        rows={sampleRows}
        actors={[]}
        actions={[]}
        filter={{ actor: "alice", targetType: "car" }}
        nextCursor="2026-05-15T09:00:00.000Z"
      />
    );
    const link = screen.getByText(/older entries/i).closest("a");
    const href = link?.getAttribute("href") ?? "";
    expect(href).toContain("/admin/dashboard/audit?");
    expect(href).toContain("actor=alice");
    expect(href).toContain("targetType=car");
    expect(href).toContain("cursor=");
  });

  it("📋 hides the pagination link when nextCursor is null", () => {
    render(
      <AuditLogTable
        rows={sampleRows}
        actors={[]}
        actions={[]}
        filter={{}}
        nextCursor={null}
      />
    );
    expect(screen.queryByText(/older entries/i)).not.toBeInTheDocument();
  });
});
