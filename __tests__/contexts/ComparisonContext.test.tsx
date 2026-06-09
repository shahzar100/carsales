/**
 * Tests for src/contexts/ComparisonContext.tsx
 *
 * Standards coverage:
 * - 📋 Functional: starts empty, add/remove/clear, MAX_COMPARE=3 cap,
 *   duplicate guard, isInComparison membership, localStorage hydrate on mount
 *   + persist on change, malformed-payload tolerance
 * - 🔒 Security: storage read/write are wrapped in try/catch so a quota or
 *   parse failure never crashes the UI; only well-formed arrays hydrate
 * - 🎯 Usability: toast feedback on add/duplicate/full/remove/clear;
 *   useComparison outside a provider throws a descriptive error
 */

import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import type { CarInterface } from "@/lib/interfaces";

// The context pulls toast helpers from ToastContext. We mock it so we can
// assert which feedback channel (success/info/warning) fires for each branch
// without rendering the real ToastProvider.
const toastSpies = {
  success: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
};
jest.mock("@/contexts/ToastContext", () => ({
  useToast: () => toastSpies,
}));

// Imported AFTER the mock is registered.
import {
  ComparisonProvider,
  useComparison,
} from "@/contexts/ComparisonContext";

const STORAGE_KEY = "car-comparison";

function makeCar(id: string, make = "Ford", model = "Focus"): CarInterface {
  return { _id: id, make, model } as CarInterface;
}

function Probe() {
  const {
    comparedCars,
    addToCompare,
    removeFromCompare,
    clearComparison,
    isInComparison,
  } = useComparison();
  return (
    <div>
      <span data-testid="ids">
        {comparedCars.map((c) => String(c._id)).join(",")}
      </span>
      <span data-testid="count">{comparedCars.length}</span>
      <span data-testid="has-a">{String(isInComparison("a"))}</span>
      <button onClick={() => addToCompare(makeCar("a", "Audi", "A3"))}>
        add-a
      </button>
      <button onClick={() => addToCompare(makeCar("b", "BMW", "M3"))}>
        add-b
      </button>
      <button onClick={() => addToCompare(makeCar("c", "Civic", "Type R"))}>
        add-c
      </button>
      <button onClick={() => addToCompare(makeCar("d", "Dodge", "Ram"))}>
        add-d
      </button>
      <button
        onClick={() => addToCompare({ make: "No", model: "Id" } as CarInterface)}
      >
        add-noid
      </button>
      <button onClick={() => removeFromCompare("a")}>remove-a</button>
      <button onClick={() => removeFromCompare("zzz")}>remove-missing</button>
      <button onClick={() => clearComparison()}>clear</button>
    </div>
  );
}

function renderProbe() {
  return render(
    <ComparisonProvider>
      <Probe />
    </ComparisonProvider>
  );
}

describe("ComparisonContext", () => {
  beforeEach(() => {
    localStorage.clear();
    toastSpies.success.mockClear();
    toastSpies.info.mockClear();
    toastSpies.warning.mockClear();
    toastSpies.error.mockClear();
  });

  it("starts empty", async () => {
    renderProbe();
    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("0")
    );
    expect(screen.getByTestId("ids")).toHaveTextContent("");
  });

  it("addToCompare adds a car (keyed by _id) and fires a success toast", async () => {
    renderProbe();
    await act(async () => screen.getByText("add-a").click());

    expect(screen.getByTestId("ids")).toHaveTextContent("a");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(toastSpies.success).toHaveBeenCalledTimes(1);
    expect(toastSpies.success).toHaveBeenCalledWith(
      "Added to comparison",
      expect.stringContaining("Audi A3")
    );
  });

  it("ignores a car with no _id and fires no toast", async () => {
    renderProbe();
    await act(async () => screen.getByText("add-noid").click());

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(toastSpies.success).not.toHaveBeenCalled();
    expect(toastSpies.info).not.toHaveBeenCalled();
    expect(toastSpies.warning).not.toHaveBeenCalled();
  });

  it("rejects a duplicate add with an info toast and no state change", async () => {
    renderProbe();
    await act(async () => screen.getByText("add-a").click());
    toastSpies.success.mockClear();

    await act(async () => screen.getByText("add-a").click());

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(toastSpies.success).not.toHaveBeenCalled();
    expect(toastSpies.info).toHaveBeenCalledWith(
      "Already in comparison",
      expect.stringContaining("Audi A3")
    );
  });

  it("caps the comparison at MAX_COMPARE (3) and warns on the 4th add", async () => {
    renderProbe();
    await act(async () => screen.getByText("add-a").click());
    await act(async () => screen.getByText("add-b").click());
    await act(async () => screen.getByText("add-c").click());
    expect(screen.getByTestId("count")).toHaveTextContent("3");
    expect(toastSpies.success).toHaveBeenCalledTimes(3);

    await act(async () => screen.getByText("add-d").click());

    expect(screen.getByTestId("count")).toHaveTextContent("3");
    expect(screen.getByTestId("ids")).toHaveTextContent("a,b,c");
    expect(toastSpies.success).toHaveBeenCalledTimes(3); // unchanged
    expect(toastSpies.warning).toHaveBeenCalledWith(
      "Comparison full",
      expect.stringContaining("3")
    );
  });

  it("removeFromCompare drops the matching car and fires an info toast", async () => {
    renderProbe();
    await act(async () => screen.getByText("add-a").click());
    await act(async () => screen.getByText("add-b").click());
    toastSpies.info.mockClear();

    await act(async () => screen.getByText("remove-a").click());

    expect(screen.getByTestId("ids")).toHaveTextContent("b");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(toastSpies.info).toHaveBeenCalledWith(
      "Removed from comparison",
      expect.stringContaining("Audi A3")
    );
  });

  it("removeFromCompare for an unknown id is a no-op (no toast)", async () => {
    renderProbe();
    await act(async () => screen.getByText("add-a").click());
    toastSpies.info.mockClear();

    await act(async () => screen.getByText("remove-missing").click());

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(toastSpies.info).not.toHaveBeenCalled();
  });

  it("clearComparison empties the list and fires an info toast", async () => {
    renderProbe();
    await act(async () => screen.getByText("add-a").click());
    await act(async () => screen.getByText("add-b").click());
    toastSpies.info.mockClear();

    await act(async () => screen.getByText("clear").click());

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(toastSpies.info).toHaveBeenCalledWith(
      "Comparison cleared",
      expect.any(String)
    );
  });

  it("isInComparison reflects membership before and after adding", async () => {
    renderProbe();
    expect(screen.getByTestId("has-a")).toHaveTextContent("false");
    await act(async () => screen.getByText("add-a").click());
    expect(screen.getByTestId("has-a")).toHaveTextContent("true");
  });

  it("persists the compared list to localStorage on change", async () => {
    renderProbe();
    await act(async () => screen.getByText("add-a").click());

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      expect(stored).toHaveLength(1);
      expect(String(stored[0]._id)).toBe("a");
    });
  });

  it("hydrates from localStorage on mount", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([makeCar("x"), makeCar("y")])
    );
    renderProbe();

    await waitFor(() =>
      expect(screen.getByTestId("ids")).toHaveTextContent("x,y")
    );
    expect(screen.getByTestId("count")).toHaveTextContent("2");
  });

  it("trims a hydrated list longer than MAX_COMPARE down to 3", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        makeCar("1"),
        makeCar("2"),
        makeCar("3"),
        makeCar("4"),
        makeCar("5"),
      ])
    );
    renderProbe();

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("3")
    );
    expect(screen.getByTestId("ids")).toHaveTextContent("1,2,3");
  });

  it("ignores a malformed (non-array) localStorage payload without crashing", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: "an array" }));
    renderProbe();

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("0")
    );
  });

  it("ignores invalid JSON in localStorage without crashing", async () => {
    localStorage.setItem(STORAGE_KEY, "{not-json");
    renderProbe();

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("0")
    );
  });

  it("throws when useComparison is used outside the provider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/ComparisonProvider/);
    consoleError.mockRestore();
  });
});
