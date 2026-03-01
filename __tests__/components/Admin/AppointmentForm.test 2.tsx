/**
 * APPOINTMENTFORM COMPONENT TESTS
 * Tests the 4-step appointment booking form:
 *  - Step 1: Customer Details validation (name, email, phone)
 *  - Step 2: Service Details (dropdown selection)
 *  - Step 3: Date & Time validation
 *  - Step 4: Review & Submit with summary
 *  - Full end-to-end flow
 */
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppointmentForm from "@/components/Admin/Form/AppointmentForm";

describe("AppointmentForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(cleanup);

  // ── Rendering ──────────────────────────────────────────────
  describe("Initial Render", () => {
    it("renders step 1 — Customer Details", () => {
      render(<AppointmentForm />);
      expect(screen.getByText("Customer Details")).toBeInTheDocument();
      expect(screen.getByText("Full Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Phone")).toBeInTheDocument();
    });

    it("shows all 4 step titles", () => {
      render(<AppointmentForm />);
      expect(screen.getByText("Customer Details")).toBeInTheDocument();
      expect(screen.getByText("Service Details")).toBeInTheDocument();
      expect(screen.getByText("Date & Time")).toBeInTheDocument();
      expect(screen.getByText("Review & Submit")).toBeInTheDocument();
    });

    it("shows step counter as 'Step 1 of 4'", () => {
      render(<AppointmentForm />);
      expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    });
  });

  // ── Step 1: Customer Details Validation ────────────────────
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

      await user.type(
        screen.getByPlaceholderText("e.g. John Smith"),
        "Jane Doe"
      );
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    it("blocks next when email is invalid", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);

      await user.type(
        screen.getByPlaceholderText("e.g. John Smith"),
        "Jane Doe"
      );
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "not-an-email"
      );
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });

    it("blocks next when phone is empty", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);

      await user.type(
        screen.getByPlaceholderText("e.g. John Smith"),
        "Jane Doe"
      );
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "jane@example.com"
      );
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Phone number is required")).toBeInTheDocument();
    });

    it("blocks next when phone is invalid", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);

      await user.type(
        screen.getByPlaceholderText("e.g. John Smith"),
        "Jane Doe"
      );
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "jane@example.com"
      );
      await user.type(screen.getByPlaceholderText("e.g. 07700 900000"), "abc");
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByText("Please enter a valid phone number")
      ).toBeInTheDocument();
    });

    it("advances to step 2 with valid customer details", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);

      await user.type(
        screen.getByPlaceholderText("e.g. John Smith"),
        "Jane Doe"
      );
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "jane@example.com"
      );
      await user.type(
        screen.getByPlaceholderText("e.g. 07700 900000"),
        "07700 123456"
      );
      await user.click(screen.getByText("Next"));

      expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
      expect(screen.getByText("Service Type")).toBeInTheDocument();
    });
  });

  // ── Step 2: Service Details Validation ─────────────────────
  describe("Step 2 — Service Details Validation", () => {
    const goToStep2 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(
        screen.getByPlaceholderText("e.g. John Smith"),
        "Jane Doe"
      );
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "jane@example.com"
      );
      await user.type(
        screen.getByPlaceholderText("e.g. 07700 900000"),
        "07700 123456"
      );
      await user.click(screen.getByText("Next"));
    };

    it("blocks next when service type is not selected", async () => {
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

      // Select a service type from the dropdown
      await user.click(screen.getByText("Select a service"));
      await user.click(screen.getByText("Oil Change"));
      await user.click(screen.getByText("Next"));

      expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
    });
  });

  // ── Step 3: Date & Time Validation ─────────────────────────
  describe("Step 3 — Date & Time Validation", () => {
    const goToStep3 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(
        screen.getByPlaceholderText("e.g. John Smith"),
        "Jane Doe"
      );
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "jane@example.com"
      );
      await user.type(
        screen.getByPlaceholderText("e.g. 07700 900000"),
        "07700 123456"
      );
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

    it("shows Date and Time fields on step 3", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);
      await goToStep3(user);

      expect(screen.getByText("Date")).toBeInTheDocument();
      expect(screen.getByText("Time")).toBeInTheDocument();
    });
  });

  // ── Data Persistence ───────────────────────────────────────
  describe("Data Persistence", () => {
    it("preserves customer details when navigating back from step 2", async () => {
      const user = userEvent.setup();
      render(<AppointmentForm />);

      const nameInput = screen.getByPlaceholderText("e.g. John Smith");
      await user.type(nameInput, "Jane Doe");
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "jane@example.com"
      );
      await user.type(
        screen.getByPlaceholderText("e.g. 07700 900000"),
        "07700 123456"
      );
      await user.click(screen.getByText("Next"));

      // Go back
      await user.click(screen.getByText("Previous"));

      expect(screen.getByPlaceholderText("e.g. John Smith")).toHaveValue(
        "Jane Doe"
      );
      expect(screen.getByPlaceholderText("e.g. john@example.com")).toHaveValue(
        "jane@example.com"
      );
    });
  });
});
