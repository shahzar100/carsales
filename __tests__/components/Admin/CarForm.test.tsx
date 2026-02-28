/**
 * CARFORM COMPONENT TESTS
 * Tests the 4-step car listing form:
 *  - Step 1: Basic Information (make, model, year) validation
 *  - Step 2: Pricing & Mileage validation
 *  - Step 3: Specs & Appearance (dropdowns + colour)
 *  - Step 4: Review & Submit with summary
 *  - Full end-to-end flow from step 1 → submit
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CarForm from "@/components/Admin/Form/CarForm";

// Mock scrollIntoView (not available in jsdom)
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

/** Helper to set a number/text input value reliably */
const setInput = (placeholder: string, value: string) => {
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value } });
};

describe("CarForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(cleanup);

  // ── Rendering ──────────────────────────────────────────────
  describe("Initial Render", () => {
    it("renders step 1 — Basic Information heading", () => {
      render(<CarForm />);
      // The heading is an <h3> inside the content area
      const heading = screen.getByRole("heading", {
        name: "Basic Information",
      });
      expect(heading).toBeInTheDocument();
    });

    it("shows all 4 step titles in the progress indicator", () => {
      render(<CarForm />);
      expect(
        screen.getAllByText("Basic Information").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText("Pricing & Mileage").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText("Specs & Appearance").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText("Review & Submit").length
      ).toBeGreaterThanOrEqual(1);
    });

    it("shows Make, Model and Year fields", () => {
      render(<CarForm />);
      expect(screen.getByPlaceholderText("e.g. Toyota")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. Corolla")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(`e.g. ${new Date().getFullYear()}`)
      ).toBeInTheDocument();
    });
  });

  // ── Step 1: Basic Info Validation ──────────────────────────
  describe("Step 1 — Basic Information Validation", () => {
    it("blocks next when make is empty", () => {
      render(<CarForm />);
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("blocks next when model is empty", () => {
      render(<CarForm />);
      setInput("e.g. Toyota", "Honda");
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("blocks next when year is empty", () => {
      render(<CarForm />);
      setInput("e.g. Toyota", "Honda");
      setInput("e.g. Corolla", "Civic");
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("advances to step 2 when all fields are filled", async () => {
      const user = userEvent.setup();
      render(<CarForm />);
      setInput("e.g. Toyota", "Honda");
      setInput("e.g. Corolla", "Civic");
      setInput(`e.g. ${new Date().getFullYear()}`, "2024");
      await user.click(screen.getByText("Next"));

      expect(
        screen.getByRole("heading", { name: "Pricing & Mileage" })
      ).toBeInTheDocument();
    });
  });

  // ── Step 2: Pricing Validation ─────────────────────────────
  describe("Step 2 — Pricing & Mileage Validation", () => {
    const goToStep2 = async (user: ReturnType<typeof userEvent.setup>) => {
      setInput("e.g. Toyota", "Honda");
      setInput("e.g. Corolla", "Civic");
      setInput(`e.g. ${new Date().getFullYear()}`, "2024");
      await user.click(screen.getByText("Next"));
    };

    it("blocks next when price is empty", async () => {
      const user = userEvent.setup();
      render(<CarForm />);
      await goToStep2(user);
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("blocks next when mileage is empty", async () => {
      const user = userEvent.setup();
      render(<CarForm />);
      await goToStep2(user);
      setInput("e.g. 15000", "20000");
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("advances to step 3 when price and mileage are valid", async () => {
      const user = userEvent.setup();
      render(<CarForm />);
      await goToStep2(user);
      setInput("e.g. 15000", "20000");
      setInput("e.g. 35000", "10000");
      await user.click(screen.getByText("Next"));

      expect(
        screen.getByRole("heading", { name: "Specs & Appearance" })
      ).toBeInTheDocument();
    });
  });

  // ── Step 3: Specs Validation ───────────────────────────────
  describe("Step 3 — Specs & Appearance Validation", () => {
    const goToStep3 = async (user: ReturnType<typeof userEvent.setup>) => {
      setInput("e.g. Toyota", "Honda");
      setInput("e.g. Corolla", "Civic");
      setInput(`e.g. ${new Date().getFullYear()}`, "2024");
      await user.click(screen.getByText("Next"));
      setInput("e.g. 15000", "20000");
      setInput("e.g. 35000", "10000");
      await user.click(screen.getByText("Next"));
    };

    it("blocks next when fuel type is not selected", async () => {
      const user = userEvent.setup();
      render(<CarForm />);
      await goToStep3(user);
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("renders fuel type, transmission, doors and colour inputs", async () => {
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
      setInput("e.g. Toyota", "BMW");
      setInput("e.g. Corolla", "M3");
      setInput(`e.g. ${new Date().getFullYear()}`, "2025");
      await user.click(screen.getByText("Next"));

      // Step 2
      setInput("e.g. 15000", "55000");
      setInput("e.g. 35000", "1200");
      await user.click(screen.getByText("Next"));

      // Step 3 — select dropdowns
      await user.click(screen.getByText("Select fuel"));
      await user.click(screen.getByText("Petrol"));
      await user.click(screen.getByText("Select transmission"));
      await user.click(screen.getByText("Automatic"));
      await user.click(screen.getByText("Select doors"));
      await user.click(screen.getByText("4 Door"));
      setInput("e.g. Midnight Blue", "Alpine White");
      await user.click(screen.getByText("Next"));

      // Step 4 — review
      expect(
        screen.getByRole("heading", { name: "Review & Submit" })
      ).toBeInTheDocument();
      expect(screen.getByText("Add Car")).toBeInTheDocument();

      // Summary values
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

      // Step 1 — fill data
      setInput("e.g. Toyota", "Audi");
      setInput("e.g. Corolla", "A4");
      setInput(`e.g. ${new Date().getFullYear()}`, "2023");
      await user.click(screen.getByText("Next"));

      // Step 2 — go back
      await user.click(screen.getByText("Previous"));

      // Step 1 — data should persist
      expect(screen.getByPlaceholderText("e.g. Toyota")).toHaveValue("Audi");
      expect(screen.getByPlaceholderText("e.g. Corolla")).toHaveValue("A4");
    });
  });
});
