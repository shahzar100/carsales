/**
 * CARFORM COMPONENT TESTS
 * Tests the 4-step car listing form:
 *  - Step 1: Basic Information (make, model, year) validation
 *  - Step 2: Pricing & Mileage validation
 *  - Step 3: Specs & Appearance (dropdowns + colour)
 *  - Step 4: Review & Submit with summary
 *  - Full end-to-end flow from step 1 → submit
 */
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CarForm from "@/components/Admin/Form/CarForm";

describe("CarForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(cleanup);

  // ── Rendering ──────────────────────────────────────────────
  describe("Initial Render", () => {
    it("renders step 1 — Basic Information", () => {
      render(<CarForm />);
      expect(screen.getByText("Basic Information")).toBeInTheDocument();
      expect(screen.getByText("Make")).toBeInTheDocument();
      expect(screen.getByText("Model")).toBeInTheDocument();
      expect(screen.getByText("Year")).toBeInTheDocument();
    });

    it("shows all 4 step titles in the progress indicator", () => {
      render(<CarForm />);
      expect(screen.getByText("Basic Information")).toBeInTheDocument();
      expect(screen.getByText("Pricing & Mileage")).toBeInTheDocument();
      expect(screen.getByText("Specs & Appearance")).toBeInTheDocument();
      expect(screen.getByText("Review & Submit")).toBeInTheDocument();
    });

    it("shows step counter as 'Step 1 of 4'", () => {
      render(<CarForm />);
      expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    });
  });

  // ── Step 1: Basic Info Validation ──────────────────────────
  describe("Step 1 — Basic Information Validation", () => {
    it("blocks next when make is empty", async () => {
      const user = userEvent.setup();
      render(<CarForm />);
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Make is required")).toBeInTheDocument();
    });

    it("blocks next when model is empty", async () => {
      const user = userEvent.setup();
      render(<CarForm />);

      await user.type(screen.getByPlaceholderText("e.g. Toyota"), "Honda");
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Model is required")).toBeInTheDocument();
    });

    it("blocks next when year is empty", async () => {
      const user = userEvent.setup();
      render(<CarForm />);

      await user.type(screen.getByPlaceholderText("e.g. Toyota"), "Honda");
      await user.type(screen.getByPlaceholderText("e.g. Corolla"), "Civic");
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Year is required")).toBeInTheDocument();
    });

    it("advances to step 2 when all fields are filled", async () => {
      const user = userEvent.setup();
      render(<CarForm />);

      await user.type(screen.getByPlaceholderText("e.g. Toyota"), "Honda");
      await user.type(screen.getByPlaceholderText("e.g. Corolla"), "Civic");
      await user.type(
        screen.getByPlaceholderText(`e.g. ${new Date().getFullYear()}`),
        "2024"
      );
      await user.click(screen.getByText("Next"));

      expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
      expect(screen.getByText(/Price/)).toBeInTheDocument();
    });
  });

  // ── Step 2: Pricing Validation ─────────────────────────────
  describe("Step 2 — Pricing & Mileage Validation", () => {
    const goToStep2 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByPlaceholderText("e.g. Toyota"), "Honda");
      await user.type(screen.getByPlaceholderText("e.g. Corolla"), "Civic");
      await user.type(
        screen.getByPlaceholderText(`e.g. ${new Date().getFullYear()}`),
        "2024"
      );
      await user.click(screen.getByText("Next"));
    };

    it("blocks next when price is empty", async () => {
      const user = userEvent.setup();
      render(<CarForm />);
      await goToStep2(user);

      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Price is required")).toBeInTheDocument();
    });

    it("blocks next when mileage is empty", async () => {
      const user = userEvent.setup();
      render(<CarForm />);
      await goToStep2(user);

      await user.type(screen.getByPlaceholderText("e.g. 15000"), "20000");
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Mileage is required")).toBeInTheDocument();
    });

    it("advances to step 3 when price and mileage are valid", async () => {
      const user = userEvent.setup();
      render(<CarForm />);
      await goToStep2(user);

      await user.type(screen.getByPlaceholderText("e.g. 15000"), "20000");
      await user.type(screen.getByPlaceholderText("e.g. 35000"), "10000");
      await user.click(screen.getByText("Next"));

      expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
    });
  });

  // ── Step 3: Specs Validation ───────────────────────────────
  describe("Step 3 — Specs & Appearance Validation", () => {
    const goToStep3 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByPlaceholderText("e.g. Toyota"), "Honda");
      await user.type(screen.getByPlaceholderText("e.g. Corolla"), "Civic");
      await user.type(
        screen.getByPlaceholderText(`e.g. ${new Date().getFullYear()}`),
        "2024"
      );
      await user.click(screen.getByText("Next"));
      await user.type(screen.getByPlaceholderText("e.g. 15000"), "20000");
      await user.type(screen.getByPlaceholderText("e.g. 35000"), "10000");
      await user.click(screen.getByText("Next"));
    };

    it("blocks next when fuel type is not selected", async () => {
      const user = userEvent.setup();
      render(<CarForm />);
      await goToStep3(user);

      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Please select a fuel type")).toBeInTheDocument();
    });

    it("renders all dropdown labels on step 3", async () => {
      const user = userEvent.setup();
      render(<CarForm />);
      await goToStep3(user);

      expect(screen.getByText("Fuel Type")).toBeInTheDocument();
      expect(screen.getByText("Transmission")).toBeInTheDocument();
      expect(screen.getByText("Doors")).toBeInTheDocument();
      expect(screen.getByText("Colour")).toBeInTheDocument();
    });
  });

  // ── Full Flow E2E ──────────────────────────────────────────
  describe("Full End-to-End Flow", () => {
    it("navigates all steps and shows summary on step 4", async () => {
      const user = userEvent.setup();
      render(<CarForm />);

      // Step 1
      await user.type(screen.getByPlaceholderText("e.g. Toyota"), "BMW");
      await user.type(screen.getByPlaceholderText("e.g. Corolla"), "M3");
      await user.type(
        screen.getByPlaceholderText(`e.g. ${new Date().getFullYear()}`),
        "2025"
      );
      await user.click(screen.getByText("Next"));

      // Step 2
      await user.type(screen.getByPlaceholderText("e.g. 15000"), "55000");
      await user.type(screen.getByPlaceholderText("e.g. 35000"), "1200");
      await user.click(screen.getByText("Next"));

      // Step 3 — select dropdowns by clicking option labels
      // Fuel
      await user.click(screen.getByText("Select fuel"));
      await user.click(screen.getByText("Petrol"));
      // Transmission
      await user.click(screen.getByText("Select transmission"));
      await user.click(screen.getByText("Automatic"));
      // Doors
      await user.click(screen.getByText("Select doors"));
      await user.click(screen.getByText("4 Door"));
      // Colour
      await user.type(
        screen.getByPlaceholderText("e.g. Midnight Blue"),
        "Alpine White"
      );
      await user.click(screen.getByText("Next"));

      // Step 4 — review
      expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
      expect(screen.getByText("Add Car")).toBeInTheDocument(); // submit label

      // Summary should show entered values
      expect(screen.getByText("BMW")).toBeInTheDocument();
      expect(screen.getByText("M3")).toBeInTheDocument();
      expect(screen.getByText("2025")).toBeInTheDocument();
      expect(screen.getByText("Petrol")).toBeInTheDocument();
      expect(screen.getByText("Automatic")).toBeInTheDocument();
      expect(screen.getByText("Alpine White")).toBeInTheDocument();
    });

    it("can go back and forth without losing data", async () => {
      const user = userEvent.setup();
      render(<CarForm />);

      // Step 1 — fill make
      const makeInput = screen.getByPlaceholderText("e.g. Toyota");
      await user.type(makeInput, "Audi");
      await user.type(screen.getByPlaceholderText("e.g. Corolla"), "A4");
      await user.type(
        screen.getByPlaceholderText(`e.g. ${new Date().getFullYear()}`),
        "2023"
      );
      await user.click(screen.getByText("Next"));

      // Step 2 — go back
      await user.click(screen.getByText("Previous"));

      // Step 1 — data should persist
      expect(screen.getByPlaceholderText("e.g. Toyota")).toHaveValue("Audi");
      expect(screen.getByPlaceholderText("e.g. Corolla")).toHaveValue("A4");
    });
  });
});
