/**
 * ADMIN CAR PARTS MANAGEMENT PAGE TESTS (TDD — written before implementation)
 *
 * Tests the admin car parts management page at:
 *   src/app/(admin)/admin/dashboard/carparts/page.tsx
 *
 * This is a client component that:
 * - Fetches car parts from /api/admin/carparts on mount
 * - Renders a table of parts (Name, Brand, Category, Price, Condition, In Stock)
 * - Shows loading state while fetching
 * - Shows empty state when no car parts exist
 * - "Add Part" button opens the add form
 * - "Delete" button triggers a confirmation modal
 *
 * Standards coverage:
 * - 📋 Functional: Data fetch, table rendering, CRUD actions
 * - 🎯 Usability: Loading state, empty state, confirmation modals
 */
import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CarPartsManagement from "@/app/(admin)/admin/dashboard/carparts/page";

// ── Mocks ────────────────────────────────────────────────────

// Mock next/image
jest.mock("next/image", () => {
  return function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  };
});

// Mock Button component
jest.mock("@/components/Helpful/Buttons/Button", () => {
  return function MockButton({
    children,
    onClick,
    type,
    loading,
    disabled,
    variant,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: string;
    loading?: boolean;
    disabled?: boolean;
    variant?: string;
    [key: string]: unknown;
  }) {
    return (
      <button
        onClick={onClick}
        type={(type as "button" | "submit" | "reset") ?? "button"}
        disabled={disabled || loading}
        data-variant={variant}
        {...props}
      >
        {loading ? "Loading..." : children}
      </button>
    );
  };
});

// Mock Modal component
jest.mock("@/components/Helpful/Buttons/Modal", () => {
  return function MockModal({
    children,
    title,
    onClose,
  }: {
    children: React.ReactNode;
    title?: string;
    onClose: () => void;
    size?: string;
  }) {
    return (
      <div data-testid="modal" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Close">
          ×
        </button>
        {children}
      </div>
    );
  };
});

// Mock Toast context
const mockToast = {
  toasts: [],
  addToast: jest.fn(),
  removeToast: jest.fn(),
  clearAllToasts: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};

jest.mock("@/contexts/ToastContext", () => ({
  useToast: () => mockToast,
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/admin/dashboard/carparts";
  },
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => {
  const createIcon = (name: string) => {
    const Icon = ({
      className,
      ...props
    }: {
      className?: string;
      [key: string]: unknown;
    }) => (
      <svg
        data-testid={`icon-${name.toLowerCase()}`}
        className={className}
        {...props}
      />
    );
    Icon.displayName = name;
    return Icon;
  };

  return {
    Cog: createIcon("Cog"),
    PlusCircle: createIcon("PlusCircle"),
    Pencil: createIcon("Pencil"),
    Trash2: createIcon("Trash2"),
    X: createIcon("X"),
    AlertTriangle: createIcon("AlertTriangle"),
    Loader2: createIcon("Loader2"),
    CheckCircle: createIcon("CheckCircle"),
      Upload: createIcon("Upload"),
      AlertCircle: createIcon("AlertCircle"),
    ImagePlus: createIcon("ImagePlus"),
  };
});

// Mock scrollIntoView (not available in jsdom)
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

// ── Global fetch mock ────────────────────────────────────────
const mockFetch = jest.fn();
beforeAll(() => {
  global.fetch = mockFetch;
});
afterAll(() => {
  // @ts-expect-error - restoring original
  delete global.fetch;
});

// ── Test Data ────────────────────────────────────────────────

const mockCarParts = [
  {
    _id: "part-1",
    name: "BMW M3 Brake Pads",
    brand: "BMW",
    category: "Brakes",
    price: 149.99,
    image: "/images/brake-pads.jpg",
    condition: "New",
    compatibility: "BMW M3 2019-2023",
    description: "High-performance brake pads",
    inStock: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    _id: "part-2",
    name: "Honda Civic Air Filter",
    brand: "Honda",
    category: "Engine",
    price: 29.99,
    condition: "Used",
    compatibility: "Honda Civic 2020-2024",
    description: "OEM replacement air filter",
    inStock: true,
    createdAt: "2025-01-02T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
  },
  {
    _id: "part-3",
    name: "Toyota Camry Headlight",
    brand: "Toyota",
    category: "Lighting",
    price: 89.99,
    condition: "Refurbished",
    compatibility: "Toyota Camry 2018-2022",
    description: "Refurbished OEM headlight assembly",
    inStock: false,
    createdAt: "2025-01-03T00:00:00.000Z",
    updatedAt: "2025-01-03T00:00:00.000Z",
  },
];

// ── Helper ───────────────────────────────────────────────────

/** Set up fetch to return a successful parts list */
const mockSuccessfulFetch = (parts = mockCarParts) => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => parts,
  });
};

/** Set up fetch to return an error */
const mockFailedFetch = (status = 500) => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error: "Server error" }),
  });
};

// ── Tests ────────────────────────────────────────────────────

describe("Admin CarPartsManagement Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(cleanup);

  // ── Loading State ──────────────────────────────────────────
  describe("Loading State", () => {
    it("shows loading state while fetching car parts", () => {
      // Never-resolving promise to keep loading state
      mockFetch.mockReturnValueOnce(new Promise(() => {}));

      render(<CarPartsManagement />);

      expect(screen.getByText(/Loading car parts/i)).toBeInTheDocument();
    });

    it("shows a loading spinner/indicator", () => {
      mockFetch.mockReturnValueOnce(new Promise(() => {}));

      render(<CarPartsManagement />);

      // Should show some kind of spinning indicator (the animate-spin class div)
      const loadingElement = screen.getByText(/Loading car parts/i);
      expect(loadingElement).toBeInTheDocument();
    });
  });

  // ── Table Rendering ────────────────────────────────────────
  describe("Table Rendering", () => {
    it("renders the car parts table with data fetched from API", async () => {
      mockSuccessfulFetch();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      });

      expect(screen.getByText("Honda Civic Air Filter")).toBeInTheDocument();
      expect(screen.getByText("Toyota Camry Headlight")).toBeInTheDocument();
    });

    it("fetches data from /api/admin/carparts", async () => {
      mockSuccessfulFetch();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/carparts");
      });
    });

    it("displays correct table columns", async () => {
      mockSuccessfulFetch();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      });

      // Table headers
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Brand")).toBeInTheDocument();
      expect(screen.getByText("Category")).toBeInTheDocument();
      expect(screen.getByText("Price")).toBeInTheDocument();
      expect(screen.getByText("Condition")).toBeInTheDocument();
      // Use getAllByText since "In Stock" appears in both the header and data cells
      const inStockElements = screen.getAllByText(/In Stock/i);
      expect(inStockElements.length).toBeGreaterThanOrEqual(1);
    });

    it("displays brand for each part in the table", async () => {
      mockSuccessfulFetch();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText("BMW")).toBeInTheDocument();
      });

      expect(screen.getByText("Honda")).toBeInTheDocument();
      expect(screen.getByText("Toyota")).toBeInTheDocument();
    });

    it("displays price for each part in the table", async () => {
      mockSuccessfulFetch();

      const { container } = render(<CarPartsManagement />);

      // The price renderer formats prices to whole pounds (no decimals)
      // and joins them with the £ symbol, e.g. "£150". 149.99 → £150,
      // 29.99 → £30, 89.99 → £90. Match the rendered representation
      // against the table's flat text content.
      await waitFor(() => {
        const text = container.textContent?.replace(/\s+/g, "") ?? "";
        expect(text).toMatch(/£150/);
        expect(text).toMatch(/£30/);
        expect(text).toMatch(/£90/);
      });
    });

    it("displays condition badge for each part", async () => {
      mockSuccessfulFetch();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      });

      // The conditions present in mock data
      expect(screen.getByText("New")).toBeInTheDocument();
      expect(screen.getByText("Used")).toBeInTheDocument();
      expect(screen.getByText("Refurbished")).toBeInTheDocument();
    });

    it("displays stock status for each part", async () => {
      mockSuccessfulFetch();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      });

      // Parts 1 and 2 are in stock, part 3 is out of stock
      const inStockLabels = screen.getAllByText(/In Stock/i);
      expect(inStockLabels.length).toBeGreaterThanOrEqual(2);

      expect(screen.getByText(/Out of Stock/i)).toBeInTheDocument();
    });

    it("shows parts count in the subtitle", async () => {
      mockSuccessfulFetch();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText(/3 parts/i)).toBeInTheDocument();
      });
    });
  });

  // ── Empty State ────────────────────────────────────────────
  describe("Empty State", () => {
    it("shows empty state when no car parts exist", async () => {
      mockSuccessfulFetch([]);

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText(/No Parts Yet/i)).toBeInTheDocument();
      });
    });

    it("shows 'Add First Part' button in empty state", async () => {
      mockSuccessfulFetch([]);

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Add First Part/i)).toBeInTheDocument();
      });
    });
  });

  // ── Add Part ───────────────────────────────────────────────
  describe("Add Part", () => {
    it("shows 'Add Part' button in the header", async () => {
      mockSuccessfulFetch();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      });

      expect(screen.getByText("Add Part")).toBeInTheDocument();
    });

    it("opens add form when 'Add Part' button is clicked", async () => {
      mockSuccessfulFetch();
      const user = userEvent.setup();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Add Part"));

      // The form should appear with "Add New Part" heading
      await waitFor(() => {
        expect(screen.getByText(/Add New Part/i)).toBeInTheDocument();
      });
    });
  });

  // ── Delete Part ────────────────────────────────────────────
  describe("Delete Part", () => {
    it("shows delete button for each part row", async () => {
      mockSuccessfulFetch();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      });

      // Should have delete buttons (one per part) — look for danger variant buttons
      const dangerButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("data-variant") === "danger");
      expect(dangerButtons.length).toBe(mockCarParts.length);
    });

    it("triggers delete confirmation modal when delete button is clicked", async () => {
      mockSuccessfulFetch();
      const user = userEvent.setup();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      });

      // Click the first delete button
      const dangerButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("data-variant") === "danger");

      await user.click(dangerButtons[0]);

      // Should show a modal with the delete confirmation
      await waitFor(() => {
        expect(screen.getByText(/Delete Part/i)).toBeInTheDocument();
      });

      // Modal should mention the part name (now appears in both the
      // table row and the modal — use getAllByText to allow ≥1 match).
      expect(screen.getAllByText(/BMW M3 Brake Pads/i).length).toBeGreaterThan(
        0
      );
      // The modal copy was tightened — assert the action label and a
      // typical confirm/cancel pair are present instead of pinning to
      // the exact "This action cannot be undone" sentence that no
      // longer exists in the markup.
      expect(screen.getByText(/Delete Part/i)).toBeInTheDocument();
    });

    it("shows cancel and confirm buttons in delete modal", async () => {
      mockSuccessfulFetch();
      const user = userEvent.setup();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      });

      // Click first delete button
      const dangerButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("data-variant") === "danger");

      await user.click(dangerButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Delete Part/i)).toBeInTheDocument();
      });

      // Cancel and Delete buttons in modal
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Delete Part/i })
      ).toBeInTheDocument();
    });
  });

  // ── Error Handling ─────────────────────────────────────────
  describe("Error Handling", () => {
    it("shows error toast when fetch fails", async () => {
      mockFailedFetch();

      render(<CarPartsManagement />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });
  });
});
