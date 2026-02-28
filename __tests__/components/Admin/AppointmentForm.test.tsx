/**
 * APPOINTMENTFORM COMPONENT TESTS
 * Tests the 4-step appointment form:
 *  - Step 1: Customer Details (name, email regex, phone regex)
 *  - Step 2: Service Details (dropdown)
 *  - Step 3: Date & Time (date + time dropdown)
 *  - Step 4: Review & Submit with summary
 *  - Full end-to-end flow + data persistence
 */
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppointmentForm from "@/components/Admin/Form/AppointmentForm";

// Mock scrollIntoView (not available in jsdom, used by Dropdown)
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

/** Helper — reliable input value setter */
const setInput = (placeholder: string, value: string) => {
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value } });
};

/** Future date for date-picker tests */
const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
};

describe("AppointmentForm Component", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(cleanup);

  // ── Rendering ──────────────────────────────────────────────
  describe("Initial Render", () => {
    it("renders step 1 heading — Customer Details", () => {
      render(<AppointmentForm />);
      expect(
        screen.getByRole("heading", { name: "Customer Details" })
      ).toBeInTheDocument();
    });

    it("shows all 4 step titles in the progress indicator", () => {
      render(<AppointmentForm />);
      expect(
        screen.getAllByText("Customer Details").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText("Service Details").length
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Date & Time").length).toBeGreaterThanOrEqual(
        1
      );
      expect(
        screen.getAllByText("Review & Submit").length
      ).toBeGreaterThanOrEqual(1);
    });

    it("shows Full Name, Email and Phone fields", () => {
      render(<AppointmentForm />);
      expect(
        screen.getByPlaceholderText("e.g. John Smith")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g. john@example.com")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g. 07700 900000")
      ).toBeInTheDocument();
    });
  });

  // ── Step 1: Customer Validation ────────────────────────────
  describe("Step 1 — Customer Details Validation", () => {
    it("blocks next when name is empty", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Customer name is required")).toBeInTheDocument();
    });

    it("blocks next when email is empty", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      setInput("e.g. John Smith", "John Smith");
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    it("rejects invalid email format", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      setInput("e.g. John Smith", "John Smith");
      setInput("e.g. john@example.com", "not-an-email");
      setInput("e.g. 07700 900000", "07700 900000");
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });

    it("blocks next when phone is empty", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      setInput("e.g. John Smith", "John Smith");
      setInput("e.g. john@example.com", "john@example.com");
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Phone number is required")).toBeInTheDocument();
    });

    it("rejects invalid phone format", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      setInput("e.g. John Smith", "John Smith");
      setInput("e.g. john@example.com", "john@example.com");
      setInput("e.g. 07700 900000", "abc");
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByText("Please enter a valid phone number")
      ).toBeInTheDocument();
    });

    it("advances to step 2 with valid data", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      setInput("e.g. John Smith", "John Smith");
      setInput("e.g. john@example.com", "john@example.com");
      setInput("e.g. 07700 900000", "07700 900000");
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Service Details" })
      ).toBeInTheDocument();
    });
  });

  // ── Step 2: Service Validation ─────────────────────────────
  describe("Step 2 — Service Details Validation", () => {
    const goToStep2 = async (user: ReturnType<typeof userEvent.setup>) => {
      setInput("e.g. John Smith", "John Smith");
      setInput("e.g. john@example.com", "john@example.com");
      setInput("e.g. 07700 900000", "07700 900000");
      await user.click(screen.getByText("Next"));
    };

    it("blocks next when service type not selected", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      await goToStep2(user);
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByText("Please select a service type")
      ).toBeInTheDocument();
    });

    it("advances to step 3 after selecting a service", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      await goToStep2(user);
      await user.click(screen.getByText("Select a service"));
      await user.click(screen.getByText("Oil Change"));
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Date & Time" })
      ).toBeInTheDocument();
    });
  });

  // ── Step 3: Date & Time Validation ─────────────────────────
  describe("Step 3 — Date & Time Validation", () => {
    const goToStep3 = async (user: ReturnType<typeof userEvent.setup>) => {
      setInput("e.g. John Smith", "John Smith");
      setInput("e.g. john@example.com", "john@example.com");
      setInput("e.g. 07700 900000", "07700 900000");
      await user.click(screen.getByText("Next"));
      await user.click(screen.getByText("Select a service"));
      await user.click(screen.getByText("Oil Change"));
      await user.click(screen.getByText("Next"));
    };

    it("blocks next when date is empty", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      await goToStep3(user);
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Please select a date")).toBeInTheDocument();
    });

    it("blocks next when time is not selected", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      await goToStep3(user);
      // Set a future date — FormInput doesn't use htmlFor, so query by input type
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Please select a time")).toBeInTheDocument();
    });

    it("advances to step 4 with valid date and time", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      await goToStep3(user);
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      await user.click(screen.getByText("Select a time slot"));
      await user.click(screen.getByText("10:00"));
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Review & Submit" })
      ).toBeInTheDocument();
    });
  });

  // ── Full Flow E2E ──────────────────────────────────────────
  describe("Full End-to-End Flow", () => {
    it("navigates all steps and shows summary on step 4", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);

      // Step 1
      setInput("e.g. John Smith", "Jane Doe");
      setInput("e.g. john@example.com", "jane@test.com");
      setInput("e.g. 07700 900000", "+44 7700 900000");
      await user.click(screen.getByText("Next"));

      // Step 2
      await user.click(screen.getByText("Select a service"));
      await user.click(screen.getByText("Full Service"));
      await user.click(screen.getByText("Next"));

      // Step 3
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      await user.click(screen.getByText("Select a time slot"));
      await user.click(screen.getByText("14:00"));
      await user.click(screen.getByText("Next"));

      // Step 4 — review summary
      expect(
        screen.getByRole("heading", { name: "Review & Submit" })
      ).toBeInTheDocument();
      expect(screen.getByText("Create Appointment")).toBeInTheDocument();

      // Summary values
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("jane@test.com")).toBeInTheDocument();
      expect(screen.getByText("+44 7700 900000")).toBeInTheDocument();
      expect(screen.getByText("Full Service")).toBeInTheDocument();
      expect(screen.getByText("14:00")).toBeInTheDocument();
    });

    it("preserves data when navigating back", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);

      setInput("e.g. John Smith", "Alice");
      setInput("e.g. john@example.com", "alice@example.com");
      setInput("e.g. 07700 900000", "07700 111111");
      await user.click(screen.getByText("Next"));

      // Go back
      await user.click(screen.getByText("Previous"));

      // Data persists
      expect(screen.getByPlaceholderText("e.g. John Smith")).toHaveValue(
        "Alice"
      );
      expect(screen.getByPlaceholderText("e.g. john@example.com")).toHaveValue(
        "alice@example.com"
      );
    });
  });
});
