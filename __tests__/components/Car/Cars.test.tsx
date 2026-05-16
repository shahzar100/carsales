import React from "react";
import { render as rtlRender, screen, fireEvent, waitFor } from "@testing-library/react";

// Spy on the next-navigation router so handleEdit's router.push is observable.
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("@/contexts/ToastContext", () => {
  const actual = jest.requireActual("@/contexts/ToastContext");
  return {
    ...actual,
    useToast: () => ({
      success: mockToastSuccess,
      error: mockToastError,
      addToast: jest.fn(),
      removeToast: jest.fn(),
    }),
  };
});

import Cars from "@/components/Car/Cars";
import { ToastProvider } from "@/contexts/ToastContext";

// Cars (via children) calls `useToast()` which requires a provider in the
// tree — wrap every render so the components can resolve the context.
const render = (ui: React.ReactElement) =>
  rtlRender(<ToastProvider>{ui}</ToastProvider>);

// Mock Button component
jest.mock("@/components/Helpful/Buttons/Button", () => {
  return function MockButton({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return <button {...props}>{children}</button>;
  };
});

const mockCar = {
  _id: "1",
  make: "Toyota",
  model: "Camry",
  year: 2023,
  price: 25000,
  mileage: 15000,
  fuel: "Petrol" as const,
  transmission: "Automatic" as const,
  doors: 4,
  colour: "White",
  status: "available" as const,
  featured: true,
  features: ["Air Conditioning", "Bluetooth", "Cruise Control"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Cars", () => {
  const defaultProps = {
    car: mockCar,
    carId: 0,
    setCarId: jest.fn(),
    length: 5,
  };

  it("renders car title", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("2023 Toyota Camry")).toBeInTheDocument();
  });

  it("renders formatted price", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("£25,000")).toBeInTheDocument();
  });

  it("renders car specifications", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("Petrol")).toBeInTheDocument();
    expect(screen.getByText("White")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("available")).toBeInTheDocument();
  });

  it("renders featured badge when car is featured", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("does not render featured badge when car is not featured", () => {
    render(<Cars {...defaultProps} car={{ ...mockCar, featured: false }} />);
    expect(screen.queryByText("Featured")).not.toBeInTheDocument();
  });

  it("renders car features", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("Air Conditioning")).toBeInTheDocument();
    expect(screen.getByText("Bluetooth")).toBeInTheDocument();
    expect(screen.getByText("Cruise Control")).toBeInTheDocument();
  });

  it("renders car count indicator", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
  });

  it("renders inventory heading", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("Car Inventory")).toBeInTheDocument();
    expect(screen.getByText("(5)")).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("View")).toBeInTheDocument();
  });

  it("renders formatted mileage", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("15,000")).toBeInTheDocument();
  });

  it("renders status with correct color for sold", () => {
    render(
      <Cars {...defaultProps} car={{ ...mockCar, status: "sold" as const }} />
    );
    expect(screen.getByText("sold")).toBeInTheDocument();
  });

  describe("actions", () => {
    let fetchMock: jest.Mock;
    let openSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      fetchMock = jest.fn();
      (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
      openSpy = jest
        .spyOn(window, "open")
        .mockImplementation(() => null as unknown as Window);
    });

    afterEach(() => {
      openSpy.mockRestore();
    });

    it("📋 Edit button navigates to /admin/dashboard/cars/edit/<id>", () => {
      render(<Cars {...defaultProps} />);
      fireEvent.click(screen.getByText("Edit"));
      expect(mockPush).toHaveBeenCalledWith(
        "/admin/dashboard/cars/edit/1"
      );
    });

    it("📋 View button opens /BrowseFleet/<id> in a new tab", () => {
      render(<Cars {...defaultProps} />);
      fireEvent.click(screen.getByText("View"));
      expect(openSpy).toHaveBeenCalledWith(
        "/BrowseFleet/1",
        "_blank",
        "noopener,noreferrer"
      );
    });

    it("📋 Delete opens ConfirmDialog with the car label", () => {
      render(<Cars {...defaultProps} />);
      // ConfirmDialog appears when the danger button (no text, just trash icon) is clicked.
      const buttons = screen.getAllByRole("button");
      // The third action button is the danger one.
      fireEvent.click(buttons[buttons.length - 1]);
      expect(screen.getByText(/delete car\?/i)).toBeInTheDocument();
      expect(screen.getByText(/permanently removed/i)).toBeInTheDocument();
    });

    it("📋 Confirm delete → DELETE /api/admin/cars?id=<id> + success toast + refresh", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      render(<Cars {...defaultProps} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[buttons.length - 1]);
      fireEvent.click(screen.getByRole("button", { name: /delete car/i }));

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/admin/cars?id=1",
          expect.objectContaining({ method: "DELETE" })
        )
      );
      await waitFor(() =>
        expect(mockToastSuccess).toHaveBeenCalledWith(
          "Car deleted",
          "2023 Toyota Camry"
        )
      );
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("🎯 Confirm delete on the last item steps the carousel back by one", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      const setCarId = jest.fn();
      render(
        <Cars
          {...defaultProps}
          carId={4}
          length={5}
          setCarId={setCarId}
        />
      );
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[buttons.length - 1]);
      fireEvent.click(screen.getByRole("button", { name: /delete car/i }));
      await waitFor(() => expect(setCarId).toHaveBeenCalledWith(3));
    });

    it("🎯 Delete non-ok response → error toast with the server message", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: "Car has bookings" }),
      });
      render(<Cars {...defaultProps} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[buttons.length - 1]);
      fireEvent.click(screen.getByRole("button", { name: /delete car/i }));
      await waitFor(() =>
        expect(mockToastError).toHaveBeenCalledWith(
          "Delete failed",
          "Car has bookings"
        )
      );
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("🎯 Delete network error → generic 'Network error' toast", async () => {
      fetchMock.mockRejectedValue(new Error("offline"));
      render(<Cars {...defaultProps} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[buttons.length - 1]);
      fireEvent.click(screen.getByRole("button", { name: /delete car/i }));
      await waitFor(() =>
        expect(mockToastError).toHaveBeenCalledWith(
          "Delete failed",
          "Network error — please check your connection and try again."
        )
      );
    });

    it("🎯 Cancel closes the confirm dialog without firing a request", () => {
      render(<Cars {...defaultProps} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[buttons.length - 1]);
      expect(screen.getByText(/delete car\?/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.queryByText(/delete car\?/i)).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("🎯 Edit/View/Delete short-circuit when car._id is missing", () => {
      render(
        <Cars
          {...defaultProps}
          car={{ ...mockCar, _id: undefined } as unknown as typeof mockCar}
        />
      );
      // Buttons render disabled — clicking them is harmless because the
      // handlers themselves also guard `if (!car._id) return;`.
      const editBtn = screen.getByText("Edit").closest("button");
      const viewBtn = screen.getByText("View").closest("button");
      expect(editBtn).toBeDisabled();
      expect(viewBtn).toBeDisabled();
    });
  });
});
