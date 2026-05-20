/**
 * Tests for src/components/Account/SavedCarsList.tsx
 *
 * The account-dashboard "Saved" tab — same data flow as the standalone
 * /saved page but rendered without page chrome. Filters server-side cars
 * by the saved-ids set, drops ids that no longer map to an available car.
 *
 * Standards coverage:
 * - 📋 Functional: fetches /api/cars?ids=…;
 *   filters by savedIds; skips fetch when savedIds is empty; cancel-flag
 *   prevents state updates after unmount
 * - 🎯 Usability: loading copy → empty-state with link to /BrowseFleet →
 *   populated grid; "Clear all" prompts for confirmation
 */
import React from "react";
import { render as rtlRender, screen, waitFor, fireEvent } from "@testing-library/react";
import { NavigationProvider } from "@/contexts/NavigationContext";

const mockClear = jest.fn();
const mockUseSavedCars = jest.fn();

jest.mock("@/contexts/SavedCarsContext", () => ({
  useSavedCars: () => mockUseSavedCars(),
}));

import SavedCarsList from "@/components/Account/SavedCarsList";

const render = (ui: React.ReactElement) =>
  rtlRender(<NavigationProvider>{ui}</NavigationProvider>);

let fetchMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  mockUseSavedCars.mockReturnValue({
    savedIds: [],
    clear: mockClear,
    isSaved: () => false,
    toggle: jest.fn(),
    remove: jest.fn(),
  });
});

describe("SavedCarsList", () => {
  it("📋 empty savedIds → no fetch, EmptyState with /BrowseFleet link", async () => {
    render(<SavedCarsList />);
    await waitFor(() =>
      expect(
        screen.getByText(/no saved cars yet/i)
      ).toBeInTheDocument()
    );
    expect(fetchMock).not.toHaveBeenCalled();
    const link = screen.getByText(/the fleet/i).closest("a");
    expect(link).toHaveAttribute("href", "/BrowseFleet");
  });

  it("📋 fetches available cars and filters by savedIds", async () => {
    mockUseSavedCars.mockReturnValue({
      savedIds: ["car-1", "car-3"],
      clear: mockClear,
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          cars: [
            {
              _id: "car-1",
              year: 2023,
              make: "Tesla",
              model: "Model 3",
              price: 35000,
              mileage: 10000,
              fuel: "Electric",
              transmission: "Automatic",
              doors: 4,
              colour: "White",
              status: "available",
              features: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              _id: "car-2",
              year: 2022,
              make: "BMW",
              model: "320d",
              price: 24000,
              mileage: 25000,
              fuel: "Diesel",
              transmission: "Manual",
              doors: 4,
              colour: "Black",
              status: "available",
              features: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              _id: "car-3",
              year: 2024,
              make: "Audi",
              model: "A4",
              price: 32000,
              mileage: 5000,
              fuel: "Petrol",
              transmission: "Automatic",
              doors: 4,
              colour: "Silver",
              status: "available",
              features: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      }),
    });

    render(<SavedCarsList />);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/cars?ids="),
        expect.objectContaining({ cache: "no-store" })
      )
    );
    await waitFor(() =>
      expect(screen.getByText("Tesla Model 3")).toBeInTheDocument()
    );
    expect(screen.getByText("Audi A4")).toBeInTheDocument();
    expect(screen.queryByText("BMW 320d")).not.toBeInTheDocument();
    // The count copy reflects the filtered list (2 saved cars). Text is
    // fragmented across `<motion.span>{count}</motion.span> saved cars`,
    // so reach for the containing <p> via its specific tag + match the
    // flattened textContent.
    const ps = Array.from(document.querySelectorAll("p")).filter((p) =>
      /\bsaved cars?\b/i.test(p.textContent ?? "")
    );
    expect(ps.length).toBeGreaterThanOrEqual(1);
    expect(ps[0].textContent).toMatch(/2\s+saved cars/i);
  });

  it("📋 singular 'car' label when exactly one car renders", async () => {
    mockUseSavedCars.mockReturnValue({
      savedIds: ["car-1"],
      clear: mockClear,
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          cars: [
            {
              _id: "car-1",
              year: 2023,
              make: "Tesla",
              model: "Model 3",
              price: 35000,
              mileage: 10000,
              fuel: "Electric",
              transmission: "Automatic",
              doors: 4,
              colour: "White",
              status: "available",
              features: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      }),
    });
    render(<SavedCarsList />);
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll("p")).some((p) =>
          /\b1\s+saved car\b/i.test(p.textContent ?? "")
        )
      ).toBe(true)
    );
  });

  it("🎯 non-ok response → empty-state, no crash", async () => {
    mockUseSavedCars.mockReturnValue({
      savedIds: ["car-1"],
      clear: mockClear,
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
    });
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    render(<SavedCarsList />);
    await waitFor(() =>
      expect(screen.getByText(/no saved cars yet/i)).toBeInTheDocument()
    );
  });

  it("🎯 network error → empty-state, no crash", async () => {
    mockUseSavedCars.mockReturnValue({
      savedIds: ["car-1"],
      clear: mockClear,
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
    });
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<SavedCarsList />);
    await waitFor(() =>
      expect(screen.getByText(/no saved cars yet/i)).toBeInTheDocument()
    );
  });

  it("📋 'Clear all' prompts for confirmation then calls clear()", async () => {
    mockUseSavedCars.mockReturnValue({
      savedIds: ["car-1"],
      clear: mockClear,
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          cars: [
            {
              _id: "car-1",
              year: 2023,
              make: "Tesla",
              model: "Model 3",
              price: 35000,
              mileage: 10000,
              fuel: "Electric",
              transmission: "Automatic",
              doors: 4,
              colour: "White",
              status: "available",
              features: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      }),
    });
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValueOnce(true);
    render(<SavedCarsList />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it("📋 'Clear all' is a no-op when the user cancels the prompt", async () => {
    mockUseSavedCars.mockReturnValue({
      savedIds: ["car-1"],
      clear: mockClear,
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          cars: [
            {
              _id: "car-1",
              year: 2023,
              make: "Tesla",
              model: "Model 3",
              price: 35000,
              mileage: 10000,
              fuel: "Electric",
              transmission: "Automatic",
              doors: 4,
              colour: "White",
              status: "available",
              features: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      }),
    });
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValueOnce(false);
    render(<SavedCarsList />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    expect(mockClear).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
