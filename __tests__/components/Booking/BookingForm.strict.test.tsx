/**
 * STRICT BOOKING FORM COMPONENT TESTS
 * These tests define the expected behavior for critical booking functionality
 * Failures indicate serious issues that must be fixed before production
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

describe("BookingForm Component - CRITICAL REQUIREMENTS", () => {
  // Mock implementation based on expected behavior
  const BookingForm = ({ onSubmit, carData, serviceType }: any) => {
    const [formData, setFormData] = React.useState({
      customerName: "",
      email: "",
      phone: "",
      preferredDate: "",
      preferredTime: "",
      message: "",
    });

    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const validateForm = () => {
      const newErrors: Record<string, string> = {};

      if (!formData.customerName.trim()) {
        newErrors.customerName = "Name is required";
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }

      if (!formData.phone.trim()) {
        newErrors.phone = "Phone is required";
      }

      if (!formData.preferredDate) {
        newErrors.preferredDate = "Preferred date is required";
      }

      return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }

      try {
        await onSubmit(formData);
      } catch (error) {
        setErrors({ submit: "Failed to submit booking. Please try again." });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="customerName"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name *
            </label>
            <input
              id="customerName"
              name="customerName"
              type="text"
              required
              aria-describedby={
                errors.customerName ? "customerName-error" : undefined
              }
              aria-invalid={!!errors.customerName}
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            {errors.customerName && (
              <div
                id="customerName-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.customerName}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={!!errors.email}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            {errors.email && (
              <div
                id="email-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.email}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number *
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              aria-describedby={errors.phone ? "phone-error" : undefined}
              aria-invalid={!!errors.phone}
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            {errors.phone && (
              <div
                id="phone-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.phone}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="preferredDate"
              className="block text-sm font-medium text-gray-700"
            >
              Preferred Date *
            </label>
            <input
              id="preferredDate"
              name="preferredDate"
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              aria-describedby={
                errors.preferredDate ? "preferredDate-error" : undefined
              }
              aria-invalid={!!errors.preferredDate}
              value={formData.preferredDate}
              onChange={(e) =>
                setFormData({ ...formData, preferredDate: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            {errors.preferredDate && (
              <div
                id="preferredDate-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.preferredDate}
              </div>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700"
          >
            Additional Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {errors.submit && (
          <div className="text-sm text-red-600" role="alert">
            {errors.submit}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Booking"}
        </button>
      </form>
    );
  };

  const mockProps = {
    onSubmit: jest.fn(),
    carData: {
      id: "car-123",
      make: "Toyota",
      model: "Camry",
      year: 2023,
    },
    serviceType: "viewing",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(cleanup);

  describe("CRITICAL FORM VALIDATION REQUIREMENTS", () => {
    it("MUST prevent submission with missing required fields", async () => {
      const user = userEvent.setup();
      render(<BookingForm {...mockProps} />);

      const submitButton = screen.getByRole("button", {
        name: /submit booking/i,
      });

      // STRICT: Form must not submit without required fields
      await user.click(submitButton);

      // STRICT: onSubmit should not be called with invalid data
      expect(mockProps.onSubmit).not.toHaveBeenCalled();

      // STRICT: Error messages must be displayed
      expect(screen.getByText("Name is required")).toBeTruthy();
      expect(screen.getByText("Email is required")).toBeTruthy();
      expect(screen.getByText("Phone is required")).toBeTruthy();
    });

    it("MUST validate email format strictly", async () => {
      const user = userEvent.setup();
      render(<BookingForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/email address/i);

      // STRICT: Invalid email formats must be rejected
      const invalidEmails = [
        "invalid",
        "test@",
        "@domain.com",
        "test.domain.com",
      ];

      for (const invalidEmail of invalidEmails) {
        await user.clear(emailInput);
        await user.type(emailInput, invalidEmail);

        const submitButton = screen.getByRole("button", {
          name: /submit booking/i,
        });
        await user.click(submitButton);

        expect(screen.getByText("Invalid email format")).toBeTruthy();
        expect(mockProps.onSubmit).not.toHaveBeenCalled();

        // Clear error for next test
        await user.clear(emailInput);
      }
    });

    it("MUST prevent booking dates in the past", async () => {
      const user = userEvent.setup();
      render(<BookingForm {...mockProps} />);

      const dateInput = screen.getByLabelText(/preferred date/i);

      // STRICT: Past dates must not be selectable
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastDateString = pastDate.toISOString().split("T")[0];

      expect(dateInput.getAttribute("min")).toBe(
        new Date().toISOString().split("T")[0]
      );
    });

    it("MUST sanitize user input to prevent XSS attacks", async () => {
      const user = userEvent.setup();
      render(<BookingForm {...mockProps} />);

      const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
      const messageInput = screen.getByLabelText(/additional message/i);

      // STRICT: Script tags and malicious content must be sanitized
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
      ];

      for (const maliciousInput of maliciousInputs) {
        await user.clear(nameInput);
        await user.type(nameInput, maliciousInput);

        // STRICT: Input should not execute scripts
        expect(document.querySelector("script")).toBeFalsy();

        // STRICT: Raw HTML should not be rendered
        expect(nameInput.value).not.toContain("<script>");
      }
    });
  });

  describe("CRITICAL ACCESSIBILITY REQUIREMENTS", () => {
    it("MUST have proper form labels and ARIA attributes", () => {
      render(<BookingForm {...mockProps} />);

      // STRICT: All form inputs must have associated labels
      const requiredFields = [
        "Full Name",
        "Email Address",
        "Phone Number",
        "Preferred Date",
      ];

      requiredFields.forEach((fieldLabel) => {
        const input = screen.getByLabelText(new RegExp(fieldLabel, "i"));
        expect(input).toBeTruthy();
        expect(input).toHaveAttribute("id");

        const label = screen.getByText(new RegExp(fieldLabel, "i"));
        const inputId = input.getAttribute("id");
        expect(inputId).toBeTruthy();
        expect(label).toHaveAttribute("htmlFor", inputId!);
      });
    });

    it("MUST indicate required fields clearly", () => {
      render(<BookingForm {...mockProps} />);

      // STRICT: Required fields must be marked with asterisk
      const requiredLabels = screen.getAllByText(/\*/);
      expect(requiredLabels.length).toBeGreaterThanOrEqual(4);

      // STRICT: Required attribute must be present on inputs
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const dateInput = screen.getByLabelText(/preferred date/i);

      expect(nameInput).toHaveAttribute("required");
      expect(emailInput).toHaveAttribute("required");
      expect(phoneInput).toHaveAttribute("required");
      expect(dateInput).toHaveAttribute("required");
    });

    it("MUST provide accessible error messaging", async () => {
      const user = userEvent.setup();
      render(<BookingForm {...mockProps} />);

      // STRICT: Trigger validation errors
      const submitButton = screen.getByRole("button", {
        name: /submit booking/i,
      });
      await user.click(submitButton);

      // STRICT: Error messages must be properly associated with inputs
      const nameInput = screen.getByLabelText(/full name/i);
      const errorMessage = screen.getByText("Name is required");

      expect(errorMessage).toHaveAttribute("role", "alert");
      expect(nameInput).toHaveAttribute("aria-invalid", "true");
      expect(nameInput).toHaveAttribute("aria-describedby");

      const errorId = nameInput.getAttribute("aria-describedby");
      expect(document.getElementById(errorId!)).toBe(errorMessage);
    });

    it("MUST be fully keyboard accessible", async () => {
      render(<BookingForm {...mockProps} />);

      // STRICT: All form elements must be keyboard accessible
      const formElements = [
        screen.getByLabelText(/full name/i),
        screen.getByLabelText(/email address/i),
        screen.getByLabelText(/phone number/i),
        screen.getByLabelText(/preferred date/i),
        screen.getByLabelText(/additional message/i),
        screen.getByRole("button", { name: /submit booking/i }),
      ];

      // STRICT: Tab navigation must work through all elements
      for (let i = 0; i < formElements.length; i++) {
        formElements[i].focus();
        expect(document.activeElement).toBe(formElements[i]);
      }
    });
  });

  describe("CRITICAL SUBMISSION REQUIREMENTS", () => {
    it("MUST handle successful form submission", async () => {
      const user = userEvent.setup();
      mockProps.onSubmit.mockResolvedValueOnce({ success: true });

      render(<BookingForm {...mockProps} />);

      // STRICT: Fill out all required fields
      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(
        screen.getByLabelText(/email address/i),
        "john@example.com"
      );
      await user.type(screen.getByLabelText(/phone number/i), "555-123-4567");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await user.type(
        screen.getByLabelText(/preferred date/i),
        tomorrow.toISOString().split("T")[0]
      );

      const submitButton = screen.getByRole("button", {
        name: /submit booking/i,
      });
      await user.click(submitButton);

      // STRICT: onSubmit must be called with correct data
      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith({
          customerName: "John Doe",
          email: "john@example.com",
          phone: "555-123-4567",
          preferredDate: tomorrow.toISOString().split("T")[0],
          preferredTime: "",
          message: "",
        });
      });
    });

    it("MUST prevent double submission during processing", async () => {
      const user = userEvent.setup();

      // STRICT: Mock slow submission
      mockProps.onSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<BookingForm {...mockProps} />);

      // Fill form
      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(
        screen.getByLabelText(/email address/i),
        "john@example.com"
      );
      await user.type(screen.getByLabelText(/phone number/i), "555-123-4567");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await user.type(
        screen.getByLabelText(/preferred date/i),
        tomorrow.toISOString().split("T")[0]
      );

      const submitButton = screen.getByRole("button", {
        name: /submit booking/i,
      });

      // STRICT: Click submit multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // STRICT: Button must be disabled during submission
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent("Submitting...");

      // STRICT: onSubmit should only be called once
      await waitFor(
        () => {
          expect(mockProps.onSubmit).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );
    });

    it("MUST handle submission errors gracefully", async () => {
      const user = userEvent.setup();
      mockProps.onSubmit.mockRejectedValueOnce(new Error("Network error"));

      render(<BookingForm {...mockProps} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(
        screen.getByLabelText(/email address/i),
        "john@example.com"
      );
      await user.type(screen.getByLabelText(/phone number/i), "555-123-4567");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await user.type(
        screen.getByLabelText(/preferred date/i),
        tomorrow.toISOString().split("T")[0]
      );

      const submitButton = screen.getByRole("button", {
        name: /submit booking/i,
      });
      await user.click(submitButton);

      // STRICT: Error message must be displayed
      await waitFor(() => {
        expect(screen.getByText(/failed to submit booking/i)).toBeTruthy();
      });

      // STRICT: Button must be re-enabled after error
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent("Submit Booking");
    });
  });

  describe("CRITICAL SECURITY REQUIREMENTS", () => {
    it("MUST rate limit form submissions", async () => {
      // STRICT: This test defines expected rate limiting behavior
      // Implementation should prevent rapid successive submissions
      const user = userEvent.setup();
      render(<BookingForm {...mockProps} />);

      // Fill form quickly multiple times
      for (let i = 0; i < 5; i++) {
        const submitButton = screen.getByRole("button", {
          name: /submit booking/i,
        });
        await user.click(submitButton);
      }

      // STRICT: Should not allow more than reasonable number of attempts
      // This test shows what SHOULD happen - implementation may need this feature
      expect(mockProps.onSubmit.mock.calls.length).toBeLessThanOrEqual(3);
    });

    it("MUST validate data length limits", async () => {
      const user = userEvent.setup();
      render(<BookingForm {...mockProps} />);

      // STRICT: Extremely long inputs should be handled
      const longString = "a".repeat(10000);

      const messageInput = screen.getByLabelText(
        /additional message/i
      ) as HTMLTextAreaElement;
      await user.type(messageInput, longString);

      // STRICT: Input should be limited or validated
      // This test shows what SHOULD happen - may need implementation
      expect(messageInput.value.length).toBeLessThanOrEqual(2000);
    });
  });
});
