/**
 * ADMIN CAR PARTS MANAGEMENT TESTS
 *
 * Targets the client island that owns all car-parts interactivity:
 *   src/components/Admin/CarPartsClient.tsx
 *
 * NOTE: the route page (src/app/(admin)/admin/dashboard/carparts/page.tsx)
 * was migrated to the server-component + client-island pattern (Day 12.6 /
 * Finding #29). Initial inventory is now fetched server-side and handed to
 * CarPartsClient as `initialParts`, so there is no client-side mount fetch
 * and no loading spinner to assert on. These tests therefore drive the
 * island directly with `initialParts` props — importing the async server
 * page (which pulls in iron-session / Mongo) is neither renderable in jsdom
 * nor the right unit under test.
 *
 * CarPartsClient:
 * - Renders a table of parts from `initialParts` (Name, Brand, Category,
 *   Price, Condition, In Stock)
 * - Shows an empty state when there are no parts
 * - "Add Part" opens the add/edit form modal
 * - "Delete" opens a ConfirmDialog and DELETEs via /api/admin/carparts
 *
 * Standards coverage:
 * - 📋 Functional: table rendering, CRUD entry points
 * - 🎯 Usability: empty state, confirmation modal, error toast on failure
 */
import React from "react";
import {
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CarPartsClient from "@/components/Admin/CarPartsClient";

// ── Mocks ────────────────────────────────────────────────────

// Mock next/image
jest.mock("next/image", () => {
  return function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  };
});

// Mock the legacy Button primitive used for the table actions + header CTA.
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

// Mock Modal — ConfirmDialog and the add/edit form both render through it.
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
    variant?: string;
  }) {
    return (
      <div data-testid="modal" role="dialog" aria-label={title}>
        {title ? <h2>{title}</h2> : null}
        <button onClick={onClose} aria-label="Close">
          ×
        </button>
        {children}
      </div>
    );
  };
});

// The add/edit form embeds the S3-backed ImageUploader — stub it out so the
// form renders in jsdom without touching upload/browser APIs.
jest.mock("@/components/Admin/ImageUploader", () => {
  return function MockImageUploader() {
    return <div data-testid="image-uploader" />;
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
// Only the mutation paths (create / edit / delete + refetch) call fetch;
// rendering reads from the `initialParts` prop.
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
    condition: "New" as const,
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
    condition: "Used" as const,
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
    condition: "Refurbished" as const,
    compatibility: "Toyota Camry 2018-2022",
    description: "Refurbished OEM headlight assembly",
    inStock: false,
    createdAt: "2025-01-03T00:00:00.000Z",
    updatedAt: "2025-01-03T00:00:00.000Z",
  },
];

const renderClient = (parts = mockCarParts) =>
  // Cast: the test fixtures match the runtime shape the API serialises to.
  render(
    <CarPartsClient
      initialParts={parts as unknown as React.ComponentProps<
        typeof CarPartsClient
      >["initialParts"]}
    />
  );

// ── Tests ────────────────────────────────────────────────────

describe("Admin CarPartsManagement (CarPartsClient)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(cleanup);

  // ── Table Rendering ────────────────────────────────────────
  describe("Table Rendering", () => {
    it("renders the car parts table from initialParts", () => {
      renderClient();

      expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      expect(screen.getByText("Honda Civic Air Filter")).toBeInTheDocument();
      expect(screen.getByText("Toyota Camry Headlight")).toBeInTheDocument();
    });

    it("displays the table column headers", () => {
      renderClient();

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Brand")).toBeInTheDocument();
      expect(screen.getByText("Category")).toBeInTheDocument();
      expect(screen.getByText("Price")).toBeInTheDocument();
      expect(screen.getByText("Condition")).toBeInTheDocument();
      // "In Stock" appears in both the header and data cells.
      expect(screen.getAllByText(/In Stock/i).length).toBeGreaterThanOrEqual(1);
    });

    it("displays the brand for each part", () => {
      renderClient();

      expect(screen.getByText("BMW")).toBeInTheDocument();
      expect(screen.getByText("Honda")).toBeInTheDocument();
      expect(screen.getByText("Toyota")).toBeInTheDocument();
    });

    it("displays the price for each part (rounded to whole pounds)", () => {
      const { container } = renderClient();

      // formatPrice rounds to whole pounds: 149.99 → £150, 29.99 → £30,
      // 89.99 → £90.
      const text = container.textContent?.replace(/\s+/g, "") ?? "";
      expect(text).toMatch(/£150/);
      expect(text).toMatch(/£30/);
      expect(text).toMatch(/£90/);
    });

    it("displays the condition badge for each part", () => {
      renderClient();

      expect(screen.getByText("New")).toBeInTheDocument();
      expect(screen.getByText("Used")).toBeInTheDocument();
      expect(screen.getByText("Refurbished")).toBeInTheDocument();
    });

    it("displays the stock status for each part", () => {
      renderClient();

      // Parts 1 and 2 are in stock (+ the column header), part 3 is not.
      expect(screen.getAllByText(/In Stock/i).length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText(/Out of Stock/i)).toBeInTheDocument();
    });

    it("shows the parts count in the subtitle", () => {
      renderClient();

      expect(screen.getByText(/3 parts/i)).toBeInTheDocument();
    });
  });

  // ── Empty State ────────────────────────────────────────────
  describe("Empty State", () => {
    it("shows the empty state when there are no parts", () => {
      renderClient([]);

      expect(screen.getByText(/No parts yet/i)).toBeInTheDocument();
    });

    it("shows the 'Add First Part' button in the empty state", () => {
      renderClient([]);

      expect(screen.getByText(/Add First Part/i)).toBeInTheDocument();
    });
  });

  // ── Add Part ───────────────────────────────────────────────
  describe("Add Part", () => {
    it("shows the 'Add Part' button in the header", () => {
      renderClient();

      expect(screen.getByText("Add Part")).toBeInTheDocument();
    });

    it("opens the add form when 'Add Part' is clicked", async () => {
      const user = userEvent.setup();
      renderClient();

      await user.click(screen.getByText("Add Part"));

      await waitFor(() => {
        expect(screen.getByText(/Add New Part/i)).toBeInTheDocument();
      });
    });
  });

  // ── Delete Part ────────────────────────────────────────────
  describe("Delete Part", () => {
    const dangerButtons = () =>
      screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("data-variant") === "danger");

    it("shows a delete button for each part row", () => {
      renderClient();

      expect(dangerButtons().length).toBe(mockCarParts.length);
    });

    it("opens the delete confirmation dialog when a delete button is clicked", async () => {
      const user = userEvent.setup();
      renderClient();

      await user.click(dangerButtons()[0]);

      await waitFor(() => {
        expect(screen.getByText(/Delete car part/i)).toBeInTheDocument();
      });
      // The dialog names the part being removed (also still in the table row).
      expect(
        screen.getAllByText(/BMW M3 Brake Pads/i).length
      ).toBeGreaterThan(0);
    });

    it("shows cancel and confirm buttons in the delete dialog", async () => {
      const user = userEvent.setup();
      renderClient();

      await user.click(dangerButtons()[0]);

      await waitFor(() => {
        expect(screen.getByText(/Delete car part/i)).toBeInTheDocument();
      });

      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Delete part/i })
      ).toBeInTheDocument();
    });

    it("shows an error toast when the delete request fails", async () => {
      const user = userEvent.setup();
      renderClient();

      await user.click(dangerButtons()[0]);
      await waitFor(() => {
        expect(screen.getByText(/Delete car part/i)).toBeInTheDocument();
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      await user.click(screen.getByRole("button", { name: /Delete part/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/admin/carparts?id=part-1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});
