/**
 * Tests for src/app/(admin)/admin/dashboard/cars/edit/[_id]/page.tsx
 *
 * Standards coverage:
 * - 🔒 Security: invalid ObjectId never hits MongoDB; `findOne` errors are
 *   swallowed by the surrounding try/catch (logged via observability)
 * - 📋 Functional: missing car → "Vehicle not found" branch with back-link;
 *   valid car → EditCarForm receives the serialised car
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockIsValid = jest.fn();
const mockFindOne = jest.fn();
const mockLogError = jest.fn();

jest.mock("mongodb", () => ({
  ObjectId: Object.assign(
    function (this: any, id: string) {
      this._id = id;
    },
    { isValid: (id: string) => mockIsValid(id) }
  ),
}));
jest.mock("@/lib/models", () => ({
  // The edit page delegates to the shared getCarById helper. Mirror its
  // contract: bail on an invalid ObjectId (without touching the DB), else
  // find-one + serialize, swallowing errors via logError.
  getCarById: jest.fn(async (id: string, context = "getCarById") => {
    if (!mockIsValid(id)) return null;
    try {
      const car = await mockFindOne({ _id: id });
      return car ? { ...(car as object) } : null;
    } catch (error) {
      mockLogError(error, { context });
      return null;
    }
  }),
  getCarsCollection: jest.fn(async () => ({
    findOne: (q: unknown) => mockFindOne(q),
  })),
  serializeDocument: (d: unknown) => ({ ...(d as object) }),
}));
jest.mock("@/lib/utils/observability", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

let formProps: any = null;
jest.mock("@/components/Admin/Form/EditCarForm", () => ({
  __esModule: true,
  default: (props: unknown) => {
    formProps = props;
    return <div data-testid="edit-form" />;
  },
}));

import EditCarPage from "@/app/(admin)/admin/dashboard/cars/edit/[_id]/page";

beforeEach(() => {
  jest.clearAllMocks();
  formProps = null;
});

describe("admin/dashboard/cars/edit/[_id] page", () => {
  it("🔒 invalid ObjectId → 'Vehicle not found' without touching the DB", async () => {
    mockIsValid.mockReturnValue(false);
    const ui = await EditCarPage({
      params: Promise.resolve({ _id: "not-an-object-id" }),
    });
    render(ui);
    expect(screen.getByText(/vehicle not found/i)).toBeInTheDocument();
    expect(mockFindOne).not.toHaveBeenCalled();
    // Back-link to inventory still rendered in the empty state.
    expect(screen.getByText(/back to inventory/i).closest("a")).toHaveAttribute(
      "href",
      "/admin/dashboard/cars"
    );
  });

  it("📋 ObjectId valid + findOne returns null → 'Vehicle not found'", async () => {
    mockIsValid.mockReturnValue(true);
    mockFindOne.mockResolvedValue(null);
    const ui = await EditCarPage({
      params: Promise.resolve({ _id: "507f1f77bcf86cd799439011" }),
    });
    render(ui);
    expect(screen.getByText(/vehicle not found/i)).toBeInTheDocument();
    expect(screen.queryByTestId("edit-form")).not.toBeInTheDocument();
  });

  it("🔒 findOne throws → swallowed via logError, renders 'Vehicle not found'", async () => {
    mockIsValid.mockReturnValue(true);
    mockFindOne.mockRejectedValue(new Error("db offline"));
    const ui = await EditCarPage({
      params: Promise.resolve({ _id: "507f1f77bcf86cd799439011" }),
    });
    render(ui);
    expect(screen.getByText(/vehicle not found/i)).toBeInTheDocument();
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: "admin/cars/edit" })
    );
  });

  it("📋 found car → renders EditCarForm with the serialised doc + title line", async () => {
    mockIsValid.mockReturnValue(true);
    mockFindOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      year: 2023,
      make: "Tesla",
      model: "Model 3",
    });
    const ui = await EditCarPage({
      params: Promise.resolve({ _id: "507f1f77bcf86cd799439011" }),
    });
    render(ui);
    expect(screen.getByTestId("edit-form")).toBeInTheDocument();
    expect(formProps.car.make).toBe("Tesla");
    expect(formProps.car.model).toBe("Model 3");
    // Header subtitle shows year/make/model.
    expect(screen.getByText(/2023 Tesla Model 3/)).toBeInTheDocument();
  });
});
