/**
 * Tests for src/components/Car/SavedCarsPage.tsx
 *
 * Standards coverage:
 * - 📋 Functional: fetches /api/cars?ids=… on
 *   mount when savedIds is non-empty; filters the response by savedIds;
 *   skips the fetch when savedIds is empty
 * - 🎯 Usability: distinct sub-heading for authenticated vs unauthenticated
 *   visitors; "Clear all" only shows when there are saved cars and prompts
 *   for confirmation; empty-state copy; loading state shown while fetching
 */
import React from "react";
import { render as rtlRender, screen, waitFor, fireEvent } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { NavigationProvider } from "@/contexts/NavigationContext";

const mockedUseSession = useSession as unknown as jest.Mock;
const mockClear = jest.fn();
const mockUseSavedCars = jest.fn();

jest.mock("@/contexts/SavedCarsContext", () => ({
  useSavedCars: () => mockUseSavedCars(),
}));

import SavedCarsPage from "@/components/Car/SavedCarsPage";

const render = (ui: React.ReactElement) =>
  rtlRender(<NavigationProvider>{ui}</NavigationProvider>);

let fetchMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  mockedUseSession.mockReturnValue({
    data: null,
    status: "unauthenticated",
  });
  mockUseSavedCars.mockReturnValue({
    savedIds: [],
    clear: mockClear,
    isSaved: () => false,
    toggle: jest.fn(),
    remove: jest.fn(),
  });
});

describe("SavedCarsPage", () => {
  it("renders the title 'Saved cars'", () => {
    render(<SavedCarsPage />);
    expect(screen.getByText("Saved cars")).toBeInTheDocument();
  });

  it("🎯 unauthenticated sub-heading mentions device + sign-in link", () => {
    render(<SavedCarsPage />);
    expect(screen.getByText(/saved on this device/i)).toBeInTheDocument();
    const link = screen.getByText(/sign in/i).closest("a");
    expect(link).toHaveAttribute("href", "/login?callbackUrl=/saved");
  });

  it("🎯 authenticated sub-heading mentions cross-device sync", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { email: "u@example.com" } },
      status: "authenticated",
    });
    render(<SavedCarsPage />);
    expect(
      screen.getByText(/synced to your account/i)
    ).toBeInTheDocument();
  });

  it("📋 empty-state when savedIds is [] (no fetch, no list)", async () => {
    render(<SavedCarsPage />);
    await waitFor(() =>
      expect(
        screen.getByText(/you haven't saved any cars yet/i)
      ).toBeInTheDocument()
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("📋 fetches saved cars from /api/cars and filters by savedIds", async () => {
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

    render(<SavedCarsPage />);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/cars?ids="),
        expect.objectContaining({ cache: "no-store" })
      )
    );
    // Only saved cars (car-1 and car-3) should render — car-2 is filtered out.
    await waitFor(() =>
      expect(screen.getByText("Tesla Model 3")).toBeInTheDocument()
    );
    expect(screen.getByText("Audi A4")).toBeInTheDocument();
    expect(screen.queryByText("BMW 320d")).not.toBeInTheDocument();
  });

  it("🎯 non-ok response leaves cars empty (shows empty-state)", async () => {
    mockUseSavedCars.mockReturnValue({
      savedIds: ["car-1"],
      clear: mockClear,
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
    });
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    render(<SavedCarsPage />);
    await waitFor(() =>
      expect(
        screen.getByText(/you haven't saved any cars yet/i)
      ).toBeInTheDocument()
    );
  });

  it("🎯 network error leaves cars empty without crashing", async () => {
    mockUseSavedCars.mockReturnValue({
      savedIds: ["car-1"],
      clear: mockClear,
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
    });
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<SavedCarsPage />);
    await waitFor(() =>
      expect(
        screen.getByText(/you haven't saved any cars yet/i)
      ).toBeInTheDocument()
    );
  });

  it("🎯 'Clear all' only renders when savedIds is non-empty", () => {
    const { rerender } = render(<SavedCarsPage />);
    expect(
      screen.queryByRole("button", { name: /clear all/i })
    ).not.toBeInTheDocument();

    mockUseSavedCars.mockReturnValue({
      savedIds: ["car-1"],
      clear: mockClear,
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
    });
    rerender(<SavedCarsPage />);
    expect(
      screen.getByRole("button", { name: /clear all/i })
    ).toBeInTheDocument();
  });

  it("📋 'Clear all' prompts for confirmation then calls clear()", () => {
    mockUseSavedCars.mockReturnValue({
      savedIds: ["car-1"],
      clear: mockClear,
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
    });
    const confirmSpy = jest
      .spyOn(window, "confirm")
      .mockReturnValueOnce(true);
    render(<SavedCarsPage />);
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it("📋 'Clear all' does nothing when the user cancels the confirmation", () => {
    mockUseSavedCars.mockReturnValue({
      savedIds: ["car-1"],
      clear: mockClear,
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
    });
    const confirmSpy = jest
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false);
    render(<SavedCarsPage />);
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    expect(mockClear).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
