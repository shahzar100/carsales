/**
 * Tests for src/components/Admin/Tabs/ViewingBookingsTab.tsx
 *
 * Standards coverage:
 * - 📋 Functional: thin wrapper around BookingsTable with type="viewing".
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockBookingsTable = jest.fn();
jest.mock("@/components/Helpful/BookingsTable", () => ({
  __esModule: true,
  default: function MockBookingsTable(props: Record<string, unknown>) {
    mockBookingsTable(props);
    return <div data-testid="bookings-table">{String(props.type)}</div>;
  },
}));

import ViewingBookingsTab from "@/components/Admin/Tabs/ViewingBookingsTab";

describe("ViewingBookingsTab", () => {
  beforeEach(() => {
    mockBookingsTable.mockClear();
  });

  it("📋 renders BookingsTable with type='viewing' and forwards all props", () => {
    const props = {
      bookings: [],
      searchTerm: "",
      onSearchChange: jest.fn(),
      onCancelBooking: jest.fn(),
      onConfirmBooking: jest.fn(),
      onViewDetails: jest.fn(),
      getStatusBadge: jest.fn(() => <span />),
    };
    render(<ViewingBookingsTab {...props} />);
    expect(screen.getByTestId("bookings-table")).toHaveTextContent("viewing");
    expect(mockBookingsTable).toHaveBeenCalledWith(
      expect.objectContaining({ type: "viewing", ...props })
    );
  });
});
