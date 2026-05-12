/**
 * SERVICEBOOKINGFORM COMPONENT TESTS
 *
 * The customer-facing service form. Drives:
 *  - Step 1 — Service category + (dynamic) sub-package + free-text details
 *  - Step 2 — Vehicle (make / model / year / reg)
 *  - Step 3 — Date & Time      (skipped when purpose === "quote")
 *  - Step 4 — Contact          (regex on email + phone)
 *  - Step 5 — Review & Submit  (separate summary cards for each section)
 *
 * The form supports two purposes — "quote" (no appointment) and "book"
 * (with appointment) — and exposes an `onSubmit` injection prop for
 * tests so we don't hit /api/bookings/{quote,service}.
 *
 * `useBusinessInfo()` is mocked to return null; we drive the Repair
 * category which has a static sub-service list (no businessInfo lookup),
 * so the dynamic Detailing/Tint packages aren't covered here. They're a
 * concern of BusinessInfoForm tests + the API integration tests.
 */
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ServiceBookingForm from "@/components/Main/Form/ServiceBookingForm";

jest.mock("@/contexts/BusinessInfoContext", () => ({
  useBusinessInfo: () => ({
    businessInfo: null,
    loading: false,
    refetch: jest.fn(),
  }),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const setInput = (placeholder: string, value: string) => {
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value } });
};

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
};

const fillVehicleStep = () => {
  setInput("e.g. BMW", "BMW");
  setInput("e.g. 3 Series", "320d");
  setInput(`e.g. ${new Date().getFullYear()}`, "2020");
};

const fillContactStep = () => {
  setInput("e.g. John Smith", "Jane Doe");
  setInput("e.g. john@example.com", "jane@example.com");
  setInput("e.g. 07700 900000", "07700 900000");
};

describe("ServiceBookingForm Component", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(cleanup);

  // ── Initial render + purpose toggle ──────────────────────────
  describe("Initial Render", () => {
    it("defaults to the Service step (step 1)", () => {
      render(<ServiceBookingForm />);
      expect(
        screen.getByRole("heading", { name: "Service" })
      ).toBeInTheDocument();
      expect(screen.getByText("Get a Quote")).toBeInTheDocument();
      expect(screen.getByText("Book Service")).toBeInTheDocument();
    });

    it("defaults purpose to 'book' (5 steps including Date & Time)", () => {
      render(<ServiceBookingForm />);
      // Date & Time step header is visible in the progress indicator
      expect(screen.getAllByText("Date & Time").length).toBeGreaterThanOrEqual(
        1
      );
    });

    it("drops the Date & Time step when purpose is 'quote'", async () => {
      const user = userEvent.setup();
      render(<ServiceBookingForm />);
      await user.click(screen.getByText("Get a Quote"));
      // Date & Time step removed from the progress indicator
      expect(screen.queryByText("Date & Time")).not.toBeInTheDocument();
    });

    it("hides the service-picker grid when a defaultService is supplied", () => {
      render(<ServiceBookingForm defaultService="Detailing" />);
      expect(screen.getByText("Car Detailing")).toBeInTheDocument();
      // The other category cards should NOT appear
      expect(screen.queryByText("Window Tinting")).not.toBeInTheDocument();
      expect(screen.queryByText("Auto Repair")).not.toBeInTheDocument();
    });
  });

  // ── Step 1 — Service category ─────────────────────────────────
  describe("Step 1 — Service category", () => {
    it("blocks Next until a service category is picked", () => {
      render(<ServiceBookingForm />);
      expect(screen.getByText("Next").closest("button")!).toBeDisabled();
    });

    it("allows advancing to step 2 once a category is picked", async () => {
      const user = userEvent.setup();
      render(<ServiceBookingForm />);
      await user.click(screen.getByText("Auto Repair"));
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Vehicle" })
      ).toBeInTheDocument();
    });

    it("auto-passes step 1 when defaultService is set", async () => {
      const user = userEvent.setup();
      render(<ServiceBookingForm defaultService="Repair" />);
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Vehicle" })
      ).toBeInTheDocument();
    });
  });

  // ── Step 2 — Vehicle ──────────────────────────────────────────
  describe("Step 2 — Vehicle validation", () => {
    const goToStep2 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByText("Auto Repair"));
      await user.click(screen.getByText("Next"));
    };

    it("blocks Next when make/model/year are empty", async () => {
      const user = userEvent.setup();
      render(<ServiceBookingForm />);
      await goToStep2(user);
      expect(screen.getByText("Next").closest("button")!).toBeDisabled();
    });

    it("rejects an out-of-range year", async () => {
      const user = userEvent.setup();
      render(<ServiceBookingForm />);
      await goToStep2(user);
      setInput("e.g. BMW", "BMW");
      setInput("e.g. 3 Series", "320d");
      setInput(`e.g. ${new Date().getFullYear()}`, "1800");
      expect(screen.getByText("Next").closest("button")!).toBeDisabled();
    });

    it("advances to step 3 with a valid vehicle", async () => {
      const user = userEvent.setup();
      render(<ServiceBookingForm />);
      await goToStep2(user);
      fillVehicleStep();
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Date & Time" })
      ).toBeInTheDocument();
    });
  });

  // ── Step 3 — Date & Time (only present when book) ─────────────
  describe("Step 3 — Date & Time (book purpose only)", () => {
    const goToStep3 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByText("Auto Repair"));
      await user.click(screen.getByText("Next"));
      fillVehicleStep();
      await user.click(screen.getByText("Next"));
    };

    it("blocks Next when date/time are empty", async () => {
      const user = userEvent.setup();
      render(<ServiceBookingForm />);
      await goToStep3(user);
      expect(screen.getByText("Next").closest("button")!).toBeDisabled();
    });

    it("advances to step 4 with valid date and time", async () => {
      const user = userEvent.setup();
      render(<ServiceBookingForm />);
      await goToStep3(user);
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      await user.click(screen.getByText("Select a time"));
      await user.click(screen.getByText("10:00"));
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Contact" })
      ).toBeInTheDocument();
    });
  });

  // ── Step 4 — Contact ──────────────────────────────────────────
  describe("Step 4 — Contact validation", () => {
    const goToContact = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByText("Auto Repair"));
      await user.click(screen.getByText("Next"));
      fillVehicleStep();
      await user.click(screen.getByText("Next"));
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      await user.click(screen.getByText("Select a time"));
      await user.click(screen.getByText("10:00"));
      await user.click(screen.getByText("Next"));
    };

    it("rejects invalid email format", async () => {
      const user = userEvent.setup();
      render(<ServiceBookingForm />);
      await goToContact(user);
      setInput("e.g. John Smith", "Jane Doe");
      setInput("e.g. john@example.com", "not-an-email");
      setInput("e.g. 07700 900000", "07700 900000");
      expect(screen.getByText("Next").closest("button")!).toBeDisabled();
    });

    it("rejects invalid phone format", async () => {
      const user = userEvent.setup();
      render(<ServiceBookingForm />);
      await goToContact(user);
      setInput("e.g. John Smith", "Jane Doe");
      setInput("e.g. john@example.com", "jane@example.com");
      setInput("e.g. 07700 900000", "abc");
      expect(screen.getByText("Next").closest("button")!).toBeDisabled();
    });
  });

  // ── Full submit flow (quote and book) ─────────────────────────
  describe("Full flow", () => {
    it("submits a 'book' request with the expected payload", async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn().mockResolvedValue({ success: true });
      render(<ServiceBookingForm onSubmit={onSubmit} />);

      // Step 1 — pick Repair
      await user.click(screen.getByText("Auto Repair"));
      await user.click(screen.getByText("Next"));

      // Step 2 — vehicle
      fillVehicleStep();
      await user.click(screen.getByText("Next"));

      // Step 3 — date & time
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      await user.click(screen.getByText("Select a time"));
      await user.click(screen.getByText("14:00"));
      await user.click(screen.getByText("Next"));

      // Step 4 — contact
      fillContactStep();
      await user.click(screen.getByText("Next"));

      // Step 5 — review
      expect(
        screen.getByRole("heading", { name: "Review" })
      ).toBeInTheDocument();
      await user.click(screen.getByText("Book Service"));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          purpose: "book",
          serviceType: "Repair",
          vehicleMake: "BMW",
          vehicleModel: "320d",
          vehicleYear: "2020",
          time: "14:00",
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "07700 900000",
        })
      );
    });

    it("submits a 'quote' request without a date/time", async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn().mockResolvedValue({ success: true });
      render(<ServiceBookingForm onSubmit={onSubmit} />);

      // Flip purpose to quote (drops Date & Time step)
      await user.click(screen.getByText("Get a Quote"));
      await user.click(screen.getByText("Auto Repair"));
      await user.click(screen.getByText("Next"));

      fillVehicleStep();
      await user.click(screen.getByText("Next"));

      // Now step 3 (under quote) is Contact, not Date & Time
      expect(
        screen.getByRole("heading", { name: "Contact" })
      ).toBeInTheDocument();

      fillContactStep();
      await user.click(screen.getByText("Next"));

      // Submit
      await user.click(screen.getByText("Submit Quote Request"));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      const payload = onSubmit.mock.calls[0][0];
      expect(payload).toMatchObject({
        purpose: "quote",
        serviceType: "Repair",
        vehicleMake: "BMW",
      });
      // Date/time empty under quote path
      expect(payload.date).toBe("");
      expect(payload.time).toBe("");
    });
  });
});
