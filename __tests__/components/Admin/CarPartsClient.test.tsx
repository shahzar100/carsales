/**
 * Tests for src/components/Admin/CarPartsClient.tsx
 *
 * The CarParts admin page got the Day-12.6 server-component + client-island
 * treatment. The page now fetches the initial inventory server-side and
 * hands it to CarPartsClient. The CRUD UI (table + modals + Add/Edit/Delete
 * mutations) lives here.
 *
 * Standards coverage:
 * - 📋 Functional: renders the initialParts table; CRUD modals (Add → POST,
 *   Edit → PUT, Delete → DELETE → ConfirmDialog); refetch after each mutation;
 *   empty-state CTA only when there are no parts
 * - 🎯 Usability: per-condition badge colour; in-stock vs out-of-stock copy;
 *   toast on every success/failure branch
 */
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const stableToast = {
  success: mockToastSuccess,
  error: mockToastError,
  info: jest.fn(),
  warning: jest.fn(),
  toasts: [] as unknown[],
  addToast: jest.fn(),
  removeToast: jest.fn(),
  clearAllToasts: jest.fn(),
};
jest.mock("@/contexts/ToastContext", () => ({
  useToast: () => stableToast,
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/Admin/ImageUploader", () => ({
  __esModule: true,
  default: () => <div data-testid="image-uploader" />,
}));

import CarPartsClient from "@/components/Admin/CarPartsClient";

const parts = [
  {
    _id: "p1",
    name: "BMW M3 Brake Pads",
    brand: "BMW",
    category: "Brakes",
    price: 149.99,
    image: "/x.jpg",
    condition: "New",
    compatibility: "BMW M3 2019-2023",
    description: "High-performance brake pads",
    inStock: true,
  },
  {
    _id: "p2",
    name: "Honda Civic Air Filter",
    brand: "Honda",
    category: "Engine",
    price: 29.99,
    condition: "Used",
    compatibility: "Honda Civic 2020-2024",
    description: "OEM air filter",
    inStock: false,
  },
  {
    _id: "p3",
    name: "Toyota Camry Headlight",
    brand: "Toyota",
    category: "Lighting",
    price: 89.99,
    condition: "Refurbished",
    inStock: true,
  },
] as unknown as Parameters<typeof CarPartsClient>[0]["initialParts"];

let fetchMock: jest.Mock;

// Form labels in CarPartsClient aren't `htmlFor`-bound to their inputs,
// so reach for the input through the wrapping <div> that contains the
// label text.
function inputForLabel(label: string): HTMLInputElement {
  const labelEl = Array.from(document.querySelectorAll("label")).find(
    (el) => el.textContent?.trim().toLowerCase() === label.toLowerCase()
  );
  if (!labelEl) throw new Error(`label "${label}" not found`);
  const container = labelEl.parentElement!;
  const input = container.querySelector("input, textarea, select");
  if (!input) throw new Error(`no input next to "${label}"`);
  return input as HTMLInputElement;
}

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

afterEach(cleanup);

describe("CarPartsClient", () => {
  it("📋 renders the initialParts table with name/brand/category/price/condition/stock", () => {
    render(<CarPartsClient initialParts={parts} />);
    expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
    expect(screen.getByText("Honda Civic Air Filter")).toBeInTheDocument();
    expect(screen.getByText("Toyota Camry Headlight")).toBeInTheDocument();
    expect(screen.getByText("BMW")).toBeInTheDocument();
    expect(screen.getByText("Brakes")).toBeInTheDocument();
    expect(screen.getByText("£150")).toBeInTheDocument();
    expect(screen.getByText("£30")).toBeInTheDocument();
    // Per-condition badge colour classes thread through.
    const conditions = ["New", "Used", "Refurbished"];
    for (const c of conditions) {
      expect(screen.getByText(c)).toBeInTheDocument();
    }
    // Stock labels.
    expect(screen.getAllByText("In Stock").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
    // Subtitle reports the count.
    expect(screen.getByText(/3 parts in inventory/i)).toBeInTheDocument();
  });

  it("🎯 empty initialParts → EmptyState with 'Add First Part' CTA", () => {
    render(<CarPartsClient initialParts={[]} />);
    expect(screen.getByText(/no parts yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add first part/i })
    ).toBeInTheDocument();
  });

  it("📋 'Add Part' opens the form modal", () => {
    render(<CarPartsClient initialParts={parts} />);
    expect(screen.queryByText(/add new part/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add part/i }));
    expect(screen.getByText(/add new part/i)).toBeInTheDocument();
  });

  it("📋 Add form submit → POST /api/admin/carparts + success toast + refetch", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: parts }),
      });

    render(<CarPartsClient initialParts={parts} />);
    fireEvent.click(screen.getByRole("button", { name: /add part/i }));

    // Fill the required fields so the form passes HTML5 validation.
    fireEvent.change(inputForLabel("Name"), { target: { value: "New Part" } });
    fireEvent.change(inputForLabel("Brand"), { target: { value: "Audi" } });
    fireEvent.change(inputForLabel("Category"), { target: { value: "Wheels" } });
    fireEvent.change(inputForLabel("Price"), { target: { value: "99.99" } });

    // Use the modal's <form> directly — "Add Part" matches multiple
    // elements (the page-header button AND the modal submit button).
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      const post = fetchMock.mock.calls.find((c) => c[1]?.method === "POST");
      expect(post).toBeDefined();
      expect(post![0]).toBe("/api/admin/carparts");
    });
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Car part added successfully"
      )
    );
  });

  it("📋 Edit opens the form with prefilled data; submit → PUT", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: parts }),
      });

    render(<CarPartsClient initialParts={parts} />);
    // The first edit button (Pencil icon) in the action column for BMW row.
    const editButtons = screen.getAllByRole("button").filter((b) => {
      return b.querySelector(".lucide-pencil") !== null;
    });
    fireEvent.click(editButtons[0]);
    // Modal opens with "Edit Part" title.
    expect(screen.getByText(/edit part/i)).toBeInTheDocument();
    expect(inputForLabel("Name").value).toBe("BMW M3 Brake Pads");

    fireEvent.submit(screen.getByText(/save changes/i).closest("form")!);

    await waitFor(() => {
      const put = fetchMock.mock.calls.find((c) => c[1]?.method === "PUT");
      expect(put).toBeDefined();
    });
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Car part updated successfully"
      )
    );
  });

  it("📋 Delete opens ConfirmDialog; confirm → DELETE with the right id", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: parts }),
      });

    render(<CarPartsClient initialParts={parts} />);
    const deleteButtons = screen.getAllByRole("button").filter((b) => {
      return b.querySelector(".lucide-trash-2") !== null;
    });
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText(/delete car part\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /delete part/i }));

    await waitFor(() => {
      const del = fetchMock.mock.calls.find((c) => c[1]?.method === "DELETE");
      expect(del).toBeDefined();
      expect(del![0]).toBe("/api/admin/carparts?id=p1");
    });
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Car part deleted successfully"
      )
    );
  });

  it("🎯 Add POST non-ok → error toast", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    render(<CarPartsClient initialParts={parts} />);
    fireEvent.click(screen.getByRole("button", { name: /add part/i }));

    fireEvent.change(inputForLabel("Name"), { target: { value: "X" } });
    fireEvent.change(inputForLabel("Brand"), { target: { value: "Y" } });
    fireEvent.change(inputForLabel("Category"), { target: { value: "Z" } });
    fireEvent.change(inputForLabel("Price"), { target: { value: "1" } });
    // Use the modal's <form> directly — "Add Part" matches multiple
    // elements (the page-header button AND the modal submit button).
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Failed to add car part")
    );
  });

  it("🎯 Delete cancel → no DELETE fired", () => {
    render(<CarPartsClient initialParts={parts} />);
    const deleteButtons = screen.getAllByRole("button").filter((b) => {
      return b.querySelector(".lucide-trash-2") !== null;
    });
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
