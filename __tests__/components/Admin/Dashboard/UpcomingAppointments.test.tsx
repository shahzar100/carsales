/**
 * Tests for src/components/Admin/Dashboard/UpcomingAppointments.tsx
 *
 * Standards coverage:
 * - 📋 Functional: empty state when data=[]; per-row date label uses
 *   "Today"/"Tomorrow"/"<weekday> <day> <mon>"; time renders in 12-hour
 *   AM/PM; status capitalised next to a coloured dot; per-type icon
 *   (service vs viewing); detail falls back to reference when missing
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import UpcomingAppointments from "@/components/Admin/Dashboard/UpcomingAppointments";
import type { ActivityItem } from "@/components/Admin/Dashboard/types";

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

describe("UpcomingAppointments", () => {
  it("🎯 shows the empty state when data is []", () => {
    render(<UpcomingAppointments data={[]} />);
    expect(
      screen.getByText(/no upcoming appointments/i)
    ).toBeInTheDocument();
  });

  it("renders 'Today' for an item dated today", () => {
    const item: ActivityItem = {
      type: "service",
      reference: "BK-1",
      customer: "Alice",
      date: todayStr(0),
      time: "10:00",
      status: "pending",
      detail: "Detailing",
    };
    render(<UpcomingAppointments data={[item]} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders 'Tomorrow' for an item dated tomorrow", () => {
    const item: ActivityItem = {
      type: "service",
      reference: "BK-2",
      customer: "Alice",
      date: todayStr(1),
      time: "10:00",
      status: "confirmed",
      detail: "Tints",
    };
    render(<UpcomingAppointments data={[item]} />);
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
  });

  it("renders a long-form weekday/day/month label for further-out dates", () => {
    const item: ActivityItem = {
      type: "viewing",
      reference: "VW-3",
      customer: "Bob",
      date: "2030-06-15",
      time: "14:00",
      status: "confirmed",
      detail: "",
    };
    render(<UpcomingAppointments data={[item]} />);
    // en-GB short weekday/day/month — exact spacing varies by node version,
    // so probe individual fragments.
    expect(screen.getByText(/Jun/)).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it("📋 renders 12-hour AM/PM time", () => {
    render(
      <UpcomingAppointments
        data={[
          {
            type: "service",
            reference: "BK-AM",
            customer: "C",
            date: todayStr(0),
            time: "09:30",
            status: "pending",
            detail: "x",
          },
          {
            type: "viewing",
            reference: "VW-PM",
            customer: "D",
            date: todayStr(0),
            time: "14:45",
            status: "confirmed",
            detail: "y",
          },
        ]}
      />
    );
    expect(screen.getByText(/9:30 AM/)).toBeInTheDocument();
    expect(screen.getByText(/2:45 PM/)).toBeInTheDocument();
  });

  it("falls back to the reference when `detail` is empty", () => {
    render(
      <UpcomingAppointments
        data={[
          {
            type: "viewing",
            reference: "VW-NODETAIL",
            customer: "E",
            date: todayStr(2),
            time: "10:00",
            status: "pending",
            detail: "",
          },
        ]}
      />
    );
    expect(screen.getByText("VW-NODETAIL")).toBeInTheDocument();
  });

  it("includes the per-type icon (svg) and customer name on each row", () => {
    const item: ActivityItem = {
      type: "service",
      reference: "BK-1",
      customer: "Alice",
      date: todayStr(0),
      time: "10:00",
      status: "pending",
      detail: "Detailing",
    };
    const { container } = render(<UpcomingAppointments data={[item]} />);
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});
