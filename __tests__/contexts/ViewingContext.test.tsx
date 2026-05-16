/**
 * Tests for src/contexts/ViewingContext.tsx
 *
 * Standards coverage:
 * - 📋 Functional: in-progress booking state, partial updates, clear, addBooking
 * - 🎯 Usability: useViewing outside provider throws
 */

import React from "react";
import { render, screen, act } from "@testing-library/react";
import { ViewingProvider, useViewing } from "@/contexts/ViewingContext";

function Probe() {
  const v = useViewing();
  return (
    <div>
      <span data-testid="date">{v.viewingBooking.selectedDate ?? ""}</span>
      <span data-testid="time">{v.viewingBooking.selectedTime ?? ""}</span>
      <span data-testid="count">{v.bookings.length}</span>
      <button
        onClick={() =>
          v.setViewingBooking({ selectedDate: "2026-06-01", selectedTime: "10:00" })
        }
      >
        set
      </button>
      <button onClick={() => v.updateViewingBooking({ selectedTime: "11:00" })}>
        update
      </button>
      <button onClick={() => v.clearViewingBooking()}>clear</button>
      <button
        onClick={() => v.addBooking({ selectedDate: "2026-06-02" })}
      >
        add
      </button>
    </div>
  );
}

describe("ViewingContext", () => {
  it("starts with empty viewingBooking and no bookings", () => {
    render(
      <ViewingProvider>
        <Probe />
      </ViewingProvider>
    );
    expect(screen.getByTestId("date")).toHaveTextContent("");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("setViewingBooking replaces the whole object", () => {
    render(
      <ViewingProvider>
        <Probe />
      </ViewingProvider>
    );
    act(() => screen.getByText("set").click());
    expect(screen.getByTestId("date")).toHaveTextContent("2026-06-01");
    expect(screen.getByTestId("time")).toHaveTextContent("10:00");
  });

  it("updateViewingBooking merges partial updates", () => {
    render(
      <ViewingProvider>
        <Probe />
      </ViewingProvider>
    );
    act(() => screen.getByText("set").click());
    act(() => screen.getByText("update").click());
    expect(screen.getByTestId("date")).toHaveTextContent("2026-06-01"); // preserved
    expect(screen.getByTestId("time")).toHaveTextContent("11:00"); // overwritten
  });

  it("clearViewingBooking resets the in-progress booking", () => {
    render(
      <ViewingProvider>
        <Probe />
      </ViewingProvider>
    );
    act(() => screen.getByText("set").click());
    act(() => screen.getByText("clear").click());
    expect(screen.getByTestId("date")).toHaveTextContent("");
  });

  it("addBooking appends to bookings AND clears the in-progress one", () => {
    render(
      <ViewingProvider>
        <Probe />
      </ViewingProvider>
    );
    act(() => screen.getByText("set").click());
    act(() => screen.getByText("add").click());
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("date")).toHaveTextContent("");
  });

  it("throws when useViewing is used outside the provider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/ViewingProvider/);
    consoleError.mockRestore();
  });
});
