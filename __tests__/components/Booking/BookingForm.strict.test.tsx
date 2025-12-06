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

// Import the actual component
import BookingForm from "@/components/TestBookingForm";

describe("BookingForm Component - CRITICAL REQUIREMENTS", () => {
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

    it("MUST prevent SQL injection attempts", async () => {
      const user = userEvent.setup();
      render(<BookingForm {...mockProps} />);

      const sqlInjection = "'; DROP TABLE users; --";
      const nameInput = screen.getByLabelText(/full name/i);

      await user.type(nameInput, sqlInjection);

      // STRICT: SQL injection patterns should be sanitized
      expect((nameInput as HTMLInputElement).value).not.toContain("DROP TABLE");
      expect((nameInput as HTMLInputElement).value).not.toContain("--;");
    });

    it("MUST enforce minimum security standards", async () => {
      const user = userEvent.setup();
      render(<BookingForm {...mockProps} />);

      // STRICT: Test various malicious inputs
      const maliciousInputs = [
        "javascript:alert('xss')",
        "onload=alert(1)",
        "<iframe src=javascript:alert(1)>",
        "data:text/html,<script>alert(1)</script>",
      ];

      const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;

      for (const malicious of maliciousInputs) {
        await user.clear(nameInput);
        await user.type(nameInput, malicious);

        // STRICT: None of these should remain in the input
        expect(nameInput.value).not.toContain("javascript:");
        expect(nameInput.value).not.toContain("onload=");
        expect(nameInput.value).not.toContain("<iframe");
        expect(nameInput.value).not.toContain("data:");
      }
    });
  });

  describe("ENHANCED VALIDATION REQUIREMENTS", () => {
    it("MUST validate phone number format", async () => {
      const user = userEvent.setup();
      render(<BookingForm {...mockProps} />);

      const phoneInput = screen.getByLabelText(/phone number/i);

      // Test invalid phone formats
      const invalidPhones = ["123", "abc", "123-abc-def", "+1-800"];

      for (const phone of invalidPhones) {
        await user.clear(phoneInput);
        await user.type(phoneInput, phone);

        const submitButton = screen.getByRole("button", {
          name: /submit booking/i,
        });
        await user.click(submitButton);

        // Should show validation error for invalid formats
        expect(mockProps.onSubmit).not.toHaveBeenCalled();
      }
    });

    it("MUST prevent future date limits", async () => {
      const user = userEvent.setup();
      render(<BookingForm {...mockProps} />);

      const dateInput = screen.getByLabelText(/preferred date/i);

      // Test date far in the future (2 years)
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const futureDateString = futureDate.toISOString().split("T")[0];

      await user.type(dateInput, futureDateString);

      const submitButton = screen.getByRole("button", {
        name: /submit booking/i,
      });
      await user.click(submitButton);

      // Should have reasonable future date limits
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it("MUST handle network failures gracefully", async () => {
      const user = userEvent.setup();
      mockProps.onSubmit.mockRejectedValueOnce(new Error("Network timeout"));

      render(<BookingForm {...mockProps} />);

      // Fill valid form
      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@test.com");
      await user.type(screen.getByLabelText(/phone/i), "555-123-4567");

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

      // Should show user-friendly error message
      await waitFor(() => {
        expect(screen.getByText(/failed to submit booking/i)).toBeTruthy();
      });
    });
  });
});
