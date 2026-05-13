/**
 * CARVIEWINGFORM COMPONENT TESTS
 *
 * Drives the 3-step car-viewing booking form:
 *  - Step 1: Date & Time (date picker + time-slot dropdown)
 *  - Step 2: Contact Details (name, email regex, phone regex, notes)
 *  - Step 3: Review & Confirm (summary cards, submit)
 *
 * The form is rendered under ViewingProvider so it can read a pre-seeded
 * carDetails / dealership / customerInfo bundle (mirrors the user flow
 * where the customer arrives via the "Book Viewing" CTA on a car page).
 *
 * Submit is verified via the `onSubmit` injection prop the component
 * already exposes specifically for tests — keeps us off the network and
 * off the real /api/bookings/viewing route.
 */
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CarViewingForm from "@/components/Main/Form/CarViewingForm";
import { ViewingProvider } from "@/contexts/ViewingContext";

// Mock scrollIntoView (Dropdown uses it; not in jsdom).
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const setInput = (placeholder: string, value: string) => {
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value } });
};

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
};

const renderForm = (opts: { onSubmit?: jest.Mock } = {}) =>
  render(
    <ViewingProvider>
      <CarViewingForm onSubmit={opts.onSubmit} />
    </ViewingProvider>
  );

describe("CarViewingForm Component", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(cleanup);

  // ── Rendering ────────────────────────────────────────────────
  describe("Initial Render", () => {
    it("renders step 1 (Date & Time) by default", () => {
      renderForm();
      expect(
        screen.getByRole("heading", { name: "Date & Time" })
      ).toBeInTheDocument();
    });

    it("shows all 3 step titles in the progress indicator", () => {
      renderForm();
      expect(screen.getAllByText("Date & Time").length).toBeGreaterThanOrEqual(
        1
      );
      expect(
        screen.getAllByText("Contact Details").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText("Review & Confirm").length
      ).toBeGreaterThanOrEqual(1);
    });

    it("renders a date picker and time-slot dropdown", () => {
      renderForm();
      expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
      expect(screen.getByText("Select a time slot")).toBeInTheDocument();
    });
  });

  // ── Step 1 — Date & Time ──────────────────────────────────────
  describe("Step 1 — Date & Time validation", () => {
    it("blocks Next when both date and time are empty", () => {
      renderForm();
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("blocks Next with only a date selected", () => {
      renderForm();
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("advances to step 2 when both date and time are valid", async () => {
      const user = userEvent.setup();
      renderForm();
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      await user.click(screen.getByText("Select a time slot"));
      await user.click(screen.getByText("10:00–11:00"));
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Contact Details" })
      ).toBeInTheDocument();
    });

    it("renders the InfoBanner confirming the appointment once filled in", async () => {
      const user = userEvent.setup();
      renderForm();
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      await user.click(screen.getByText("Select a time slot"));
      await user.click(screen.getByText("14:00–15:00"));
      expect(screen.getByText(/Your appointment:/)).toBeInTheDocument();
    });
  });

  // ── Step 2 — Contact Details ──────────────────────────────────
  describe("Step 2 — Contact validation", () => {
    const goToStep2 = async (user: ReturnType<typeof userEvent.setup>) => {
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      await user.click(screen.getByText("Select a time slot"));
      await user.click(screen.getByText("10:00–11:00"));
      await user.click(screen.getByText("Next"));
    };

    it("blocks Next with no name", async () => {
      const user = userEvent.setup();
      renderForm();
      await goToStep2(user);
      expect(screen.getByText("Next").closest("button")!).toBeDisabled();
    });

    it("rejects an invalid email format", async () => {
      const user = userEvent.setup();
      renderForm();
      await goToStep2(user);
      setInput("e.g. John Smith", "Jane Doe");
      setInput("e.g. john@example.com", "not-an-email");
      setInput("e.g. 07700 900000", "07700 900000");
      expect(screen.getByText("Next").closest("button")!).toBeDisabled();
    });

    it("rejects an invalid phone format", async () => {
      const user = userEvent.setup();
      renderForm();
      await goToStep2(user);
      setInput("e.g. John Smith", "Jane Doe");
      setInput("e.g. john@example.com", "jane@example.com");
      setInput("e.g. 07700 900000", "abc");
      expect(screen.getByText("Next").closest("button")!).toBeDisabled();
    });

    it("advances to step 3 with valid contact details", async () => {
      const user = userEvent.setup();
      renderForm();
      await goToStep2(user);
      setInput("e.g. John Smith", "Jane Doe");
      setInput("e.g. john@example.com", "jane@example.com");
      setInput("e.g. 07700 900000", "07700 900000");
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Review & Confirm" })
      ).toBeInTheDocument();
    });
  });

  // ── Step 3 — Review & Submit ──────────────────────────────────
  describe("Step 3 — Review summary and submit", () => {
    const fillAllSteps = async (
      user: ReturnType<typeof userEvent.setup>,
      values = {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "07700 900000",
      }
    ) => {
      // Step 1
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      await user.click(screen.getByText("Select a time slot"));
      await user.click(screen.getByText("14:00–15:00"));
      await user.click(screen.getByText("Next"));

      // Step 2
      setInput("e.g. John Smith", values.name);
      setInput("e.g. john@example.com", values.email);
      setInput("e.g. 07700 900000", values.phone);
      await user.click(screen.getByText("Next"));
    };

    it("renders the appointment + contact summaries", async () => {
      const user = userEvent.setup();
      renderForm();
      await fillAllSteps(user);
      // Summary contains the customer's typed values somewhere on screen
      expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(0);
      expect(
        screen.getAllByText("jane@example.com").length
      ).toBeGreaterThan(0);
      expect(screen.getAllByText("07700 900000").length).toBeGreaterThan(0);
    });

    it("calls onSubmit with the form payload when Confirm Booking is clicked", async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn().mockResolvedValue({ success: true });
      renderForm({ onSubmit });
      await fillAllSteps(user);

      await user.click(screen.getByText("Confirm Booking"));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: "Jane Doe",
          email: "jane@example.com",
          phone: "07700 900000",
          preferredTime: "14:00",
        })
      );
      // preferredDate is the futureDate(); just assert the shape carries it
      expect(onSubmit.mock.calls[0][0].preferredDate).toMatch(
        /^\d{4}-\d{2}-\d{2}$/
      );
    });

    it("preserves entered data when navigating back to step 2", async () => {
      const user = userEvent.setup();
      renderForm();
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: futureDate() } });
      await user.click(screen.getByText("Select a time slot"));
      await user.click(screen.getByText("10:00–11:00"));
      await user.click(screen.getByText("Next"));

      setInput("e.g. John Smith", "Persistent");
      setInput("e.g. john@example.com", "persist@example.com");
      setInput("e.g. 07700 900000", "07000 000001");

      await user.click(screen.getByText("Previous"));
      await user.click(screen.getByText("Next"));

      expect(screen.getByPlaceholderText("e.g. John Smith")).toHaveValue(
        "Persistent"
      );
      expect(screen.getByPlaceholderText("e.g. john@example.com")).toHaveValue(
        "persist@example.com"
      );
    });
  });
});
