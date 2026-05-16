/**
 * Tests for src/components/Admin/Tabs/ServiceBookingsTab.tsx
 *
 * Standards coverage:
 * - 📋 Functional: thin wrapper around BookingsTable with type="service".
 *   Verify it forwards type + props correctly so a future caller refactor
 *   doesn't accidentally drop the type or any of the action callbacks.
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

import ServiceBookingsTab from "@/components/Admin/Tabs/ServiceBookingsTab";

describe("ServiceBookingsTab", () => {
  beforeEach(() => {
    mockBookingsTable.mockClear();
  });

  it("📋 renders BookingsTable with type='service' and forwards all props", () => {
    const onSearchChange = jest.fn();
    const onCancelBooking = jest.fn();
    const onConfirmBooking = jest.fn();
    const onViewDetails = jest.fn();
    const getStatusBadge = jest.fn(() => <span />);
    const bookings: never[] = [];

    render(
      <ServiceBookingsTab
        bookings={bookings}
        searchTerm="hello"
        onSearchChange={onSearchChange}
        onCancelBooking={onCancelBooking}
        onConfirmBooking={onConfirmBooking}
        onViewDetails={onViewDetails}
        getStatusBadge={getStatusBadge}
      />
    );

    expect(screen.getByTestId("bookings-table")).toHaveTextContent("service");
    expect(mockBookingsTable).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "service",
        bookings,
        searchTerm: "hello",
        onSearchChange,
        onCancelBooking,
        onConfirmBooking,
        onViewDetails,
        getStatusBadge,
      })
    );
  });
});
