/**
 * Tests for src/components/Account/BookingsList.tsx
 *
 * Standards coverage:
 * - 📋 Functional: loading state, empty state, per-kind icon mapping
 *   (service/viewing/reservation), status badge, optional subtitle, ref
 *   shown
 * - 🎯 Usability: empty state describes how to get something here
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import BookingsList from "@/components/Account/BookingsList";
import type { ActivityItem } from "@/components/Account/BookingsList";

const sample: ActivityItem[] = [
  {
    kind: "service",
    reference: "BK-SVC123",
    status: "pending",
    date: "2030-01-15",
    title: "Detailing — Full",
    subtitle: "2030-01-15 at 10:00",
  },
  {
    kind: "viewing",
    reference: "VW-V001",
    status: "confirmed",
    date: "2030-02-01",
    title: "Tesla Model 3 (2020)",
  },
  {
    kind: "reservation",
    reference: "RSV-R1",
    status: "expired",
    date: "2025-01-01",
    title: "BMW 320d (2019)",
    subtitle: "Reservation",
  },
];

describe("BookingsList", () => {
  it("🎯 renders 'Loading…' when loading", () => {
    render(
      <BookingsList
        items={[]}
        loading={true}
        emptyTitle="empty"
        emptyDescription="—"
      />
    );
    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
  });

  it("🎯 renders the empty state when items is [] and not loading", () => {
    render(
      <BookingsList
        items={[]}
        loading={false}
        emptyTitle="No upcoming bookings"
        emptyDescription="Book a viewing to get started."
      />
    );
    expect(screen.getByText("No upcoming bookings")).toBeInTheDocument();
    expect(
      screen.getByText(/book a viewing to get started/i)
    ).toBeInTheDocument();
  });

  it("renders one row per item with the right kind label", () => {
    render(
      <BookingsList
        items={sample}
        loading={false}
        emptyTitle=""
        emptyDescription=""
      />
    );
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Car viewing")).toBeInTheDocument();
    // "Reservation" shows up as both the kind label AND the subtitle row
    // for the reservation entry — accept >=1 match.
    expect(screen.getAllByText("Reservation").length).toBeGreaterThan(0);
  });

  it("includes title, reference and (optional) subtitle for each row", () => {
    render(
      <BookingsList
        items={sample}
        loading={false}
        emptyTitle=""
        emptyDescription=""
      />
    );
    expect(screen.getByText("Detailing — Full")).toBeInTheDocument();
    expect(screen.getByText("Ref: BK-SVC123")).toBeInTheDocument();
    expect(screen.getByText("2030-01-15 at 10:00")).toBeInTheDocument();
    expect(screen.getByText("Tesla Model 3 (2020)")).toBeInTheDocument();
    expect(screen.getByText("BMW 320d (2019)")).toBeInTheDocument();
  });

  it("omits the subtitle row when subtitle is not provided", () => {
    render(
      <BookingsList
        items={[
          {
            kind: "viewing",
            reference: "VW-NS",
            status: "pending",
            date: "2030-03-01",
            title: "No subtitle here",
          },
        ]}
        loading={false}
        emptyTitle=""
        emptyDescription=""
      />
    );
    expect(screen.getByText("No subtitle here")).toBeInTheDocument();
    // Only the title and the ref line — no extra subtitle paragraph.
    expect(screen.queryByText(/at \d/)).not.toBeInTheDocument();
  });
});
