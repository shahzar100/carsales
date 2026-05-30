/**
 * PARTEXCHANGEFORM COMPONENT TESTS
 *
 * Part-exchange enquiry rendered inside a collapsible card. Unlike the
 * step-driven Form abstraction the customer-facing booking flows use,
 * this one is a single HTML form so the tests verify:
 *  - The "expand to fill" affordance gates the form fields.
 *  - All required inputs are present once expanded.
 *  - Submission POSTs to /api/bookings/part-exchange with the structured
 *    payload the route expects.
 *  - Success and failure paths render the right UI.
 *
 * The form talks to the network directly (no `onSubmit` injection),
 * so the global `fetch` is stubbed per-test.
 */
import React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import PartExchangeForm from "@/components/Car/PartExchangeForm";

// The form prefills name + email from the signed-in session via
// `useAccountContact` and the email input is read-only. The session is
// globally mocked to `unauthenticated`; the submission path needs an
// authenticated session so the email lands in the POST body.
beforeEach(() => {
  (useSession as unknown as jest.Mock).mockReturnValue({
    data: { user: { name: "Jane Doe", email: "jane@example.com" } },
    status: "authenticated",
  });
});

// PartExchangeForm renders <label> and <input> as siblings without
// `htmlFor`/`id` association, so RTL's getByLabelText can't find them.
// This helper walks from the label text to the form control in the same
// parent <div>. (Known a11y debt.)
const fieldByLabel = (label: string): HTMLElement => {
  const labelEl = screen.getByText(label);
  const field = labelEl.parentElement?.querySelector(
    "input, select, textarea"
  );
  if (!field) throw new Error(`No form control near label "${label}"`);
  return field as HTMLElement;
};

const fillForm = () => {
  fireEvent.change(fieldByLabel("Your name"), {
    target: { value: "Jane Doe" },
  });
  fireEvent.change(fieldByLabel("Phone"), {
    target: { value: "07700 900000" },
  });
  fireEvent.change(fieldByLabel("Email"), {
    target: { value: "jane@example.com" },
  });
  fireEvent.change(fieldByLabel("Registration (optional)"), {
    target: { value: "ab12 cde" },
  });
  fireEvent.change(fieldByLabel("Make"), {
    target: { value: "Ford" },
  });
  fireEvent.change(fieldByLabel("Model"), {
    target: { value: "Focus" },
  });
  fireEvent.change(fieldByLabel("Year"), {
    target: { value: "2018" },
  });
  fireEvent.change(fieldByLabel("Mileage"), {
    target: { value: "55000" },
  });
};

describe("PartExchangeForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    cleanup();
    (global.fetch as jest.Mock).mockReset();
  });

  // ── Collapsible behaviour ────────────────────────────────────
  describe("Collapsed state", () => {
    it("renders the header collapsed by default", () => {
      render(<PartExchangeForm carId="car-1" carLabel="BMW 320d" />);
      expect(
        screen.getByText("Part-Exchange your current car")
      ).toBeInTheDocument();
      // No form fields visible yet
      expect(screen.queryByLabelText("Your name")).not.toBeInTheDocument();
    });

    it("includes the car label in the helper copy", () => {
      render(<PartExchangeForm carId="car-1" carLabel="BMW 320d" />);
      expect(
        screen.getByText(/against this BMW 320d/)
      ).toBeInTheDocument();
    });

    it("expands when the header is clicked", async () => {
      const user = userEvent.setup();
      render(<PartExchangeForm carId="car-1" carLabel="BMW 320d" />);
      await user.click(screen.getByText("Part-Exchange your current car"));
      expect(fieldByLabel("Your name")).toBeInTheDocument();
      expect(fieldByLabel("Email")).toBeInTheDocument();
      expect(fieldByLabel("Phone")).toBeInTheDocument();
      expect(fieldByLabel("Make")).toBeInTheDocument();
      expect(fieldByLabel("Model")).toBeInTheDocument();
    });

    it("collapses again on second click", async () => {
      const user = userEvent.setup();
      render(<PartExchangeForm carId="car-1" carLabel="BMW 320d" />);
      const header = screen.getByText("Part-Exchange your current car");
      await user.click(header);
      expect(fieldByLabel("Your name")).toBeInTheDocument();
      await user.click(header);
      expect(screen.queryByText("Your name")).not.toBeInTheDocument();
    });
  });

  // ── Field uppercasing ────────────────────────────────────────
  describe("Field behaviour", () => {
    it("uppercases the registration input as the user types", async () => {
      const user = userEvent.setup();
      render(<PartExchangeForm carId="car-1" carLabel="BMW 320d" />);
      await user.click(screen.getByText("Part-Exchange your current car"));
      const reg = fieldByLabel(
        "Registration (optional)"
      ) as HTMLInputElement;
      fireEvent.change(reg, { target: { value: "ab12 cde" } });
      expect(reg.value).toBe("AB12 CDE");
    });

    it("renders the four condition options", async () => {
      const user = userEvent.setup();
      render(<PartExchangeForm carId="car-1" carLabel="BMW 320d" />);
      await user.click(screen.getByText("Part-Exchange your current car"));
      const select = fieldByLabel("Condition") as HTMLSelectElement;
      expect(
        Array.from(select.options).map((o) => o.value)
      ).toEqual(["Excellent", "Good", "Fair", "Poor"]);
      expect(select.value).toBe("Good"); // default
    });
  });

  // ── Submit flow ──────────────────────────────────────────────
  describe("Submission", () => {
    it("POSTs to /api/bookings/part-exchange with the structured payload", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { enquiryReference: "PX-ABC123" },
        }),
      });

      render(<PartExchangeForm carId="car-99" carLabel="BMW 320d" />);
      await user.click(screen.getByText("Part-Exchange your current car"));
      fillForm();
      await user.click(screen.getByText("Request a valuation"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe("/api/bookings/part-exchange");
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body).toMatchObject({
        customerInfo: {
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "07700 900000",
        },
        vehicle: {
          registration: "AB12 CDE",
          make: "Ford",
          model: "Focus",
          year: 2018,
          mileage: 55000,
          condition: "Good",
        },
        interestedInCarId: "car-99",
        interestedInCarLabel: "BMW 320d",
      });
    });

    it("renders the success card when the API returns a reference", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { enquiryReference: "PX-WIN1" },
        }),
      });

      render(<PartExchangeForm carId="car-1" carLabel="BMW 320d" />);
      await user.click(screen.getByText("Part-Exchange your current car"));
      fillForm();
      await user.click(screen.getByText("Request a valuation"));

      await waitFor(() => {
        expect(screen.getByText("Enquiry sent")).toBeInTheDocument();
      });
      expect(screen.getByText("PX-WIN1")).toBeInTheDocument();
    });

    it("surfaces the API error message on failure", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: "Rate limited" }),
      });

      render(<PartExchangeForm carId="car-1" carLabel="BMW 320d" />);
      await user.click(screen.getByText("Part-Exchange your current car"));
      fillForm();
      await user.click(screen.getByText("Request a valuation"));

      await waitFor(() => {
        expect(screen.getByText("Rate limited")).toBeInTheDocument();
      });
      // Stays on the form (not the success card)
      expect(screen.queryByText("Enquiry sent")).not.toBeInTheDocument();
    });

    it("falls back to a network-error banner if fetch rejects", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("ECONNRESET")
      );

      render(<PartExchangeForm carId="car-1" carLabel="BMW 320d" />);
      await user.click(screen.getByText("Part-Exchange your current car"));
      fillForm();
      await user.click(screen.getByText("Request a valuation"));

      await waitFor(() => {
        expect(
          screen.getByText("Network error. Please try again.")
        ).toBeInTheDocument();
      });
    });
  });
});
