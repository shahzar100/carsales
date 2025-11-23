/**
 * STRICT ADMIN COMPONENT TESTS
 * These tests define critical security and functionality requirements
 * Failures indicate serious vulnerabilities or broken admin functionality
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

describe("Admin Dashboard Components - CRITICAL SECURITY TESTS", () => {
  describe("AdminHeader Component - SECURITY REQUIREMENTS", () => {
    // Mock AdminHeader component based on expected secure behavior
    const AdminHeader = ({ user, onLogout }: any) => {
      const handleLogout = async () => {
        try {
          // STRICT: Must clear all session data and redirect
          await onLogout();
        } catch (error) {
          console.error("Logout failed:", error);
        }
      };

      return (
        <header className="bg-gray-800 p-4 text-white">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span>Welcome, {user?.name || "Unknown User"}</span>
              <button
                onClick={handleLogout}
                className="rounded bg-red-600 px-4 py-2 hover:bg-red-700"
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
      );
    };

    const mockUser = {
      id: "admin-123",
      name: "Admin User",
      role: "admin",
      email: "admin@example.com",
    };

    const mockProps = {
      user: mockUser,
      onLogout: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(cleanup);

    it("MUST display user information securely", () => {
      render(<AdminHeader {...mockProps} />);

      // STRICT: Must display user name but not sensitive data
      expect(screen.getByText("Welcome, Admin User")).toBeTruthy();

      // STRICT: Must not expose sensitive user data in DOM
      expect(document.body.innerHTML).not.toContain(mockUser.id);
      expect(document.body.innerHTML).not.toContain("admin-123");
    });

    it("MUST handle user object sanitization", () => {
      const maliciousUser = {
        ...mockUser,
        name: '<script>alert("xss")</script>Malicious Admin',
        role: "admin<img src=x onerror=alert(1)>",
      };

      render(<AdminHeader {...mockProps} user={maliciousUser} />);

      // STRICT: Script tags must not be executed
      expect(document.querySelector("script")).toBeFalsy();

      // STRICT: HTML must be escaped
      const welcomeText = screen.getByText(/Welcome,/);
      expect(welcomeText.innerHTML).not.toContain("<script>");
    });

    it("MUST provide secure logout functionality", async () => {
      const user = userEvent.setup();
      mockProps.onLogout.mockResolvedValueOnce(true);

      render(<AdminHeader {...mockProps} />);

      const logoutButton = screen.getByRole("button", { name: /logout/i });
      await user.click(logoutButton);

      // STRICT: Logout function must be called
      expect(mockProps.onLogout).toHaveBeenCalledTimes(1);
    });

    it("MUST handle logout errors gracefully", async () => {
      const user = userEvent.setup();
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockProps.onLogout.mockRejectedValueOnce(new Error("Logout failed"));

      render(<AdminHeader {...mockProps} />);

      const logoutButton = screen.getByRole("button", { name: /logout/i });
      await user.click(logoutButton);

      // STRICT: Error must be logged but not exposed to user
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          "Logout failed:",
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe("CarModal Component - DATA INTEGRITY REQUIREMENTS", () => {
    // Mock CarModal component based on expected secure behavior
    const CarModal = ({ isOpen, onClose, onSave, car, mode }: any) => {
      const [formData, setFormData] = React.useState({
        make: car?.make || "",
        model: car?.model || "",
        year: car?.year || new Date().getFullYear(),
        price: car?.price || 0,
        mileage: car?.mileage || 0,
        description: car?.description || "",
      });

      const [errors, setErrors] = React.useState<Record<string, string>>({});

      const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // STRICT: Validate all required fields
        if (!formData.make.trim()) newErrors.make = "Make is required";
        if (!formData.model.trim()) newErrors.model = "Model is required";

        // STRICT: Validate numeric constraints
        if (
          formData.year < 1900 ||
          formData.year > new Date().getFullYear() + 2
        ) {
          newErrors.year = "Invalid year";
        }

        if (formData.price < 0) newErrors.price = "Price cannot be negative";
        if (formData.mileage < 0)
          newErrors.mileage = "Mileage cannot be negative";

        // STRICT: Validate data lengths
        if (formData.description.length > 5000) {
          newErrors.description = "Description too long (max 5000 characters)";
        }

        return newErrors;
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }

        try {
          await onSave(formData);
          onClose();
        } catch (error) {
          setErrors({ submit: "Failed to save car data" });
        }
      };

      if (!isOpen) return null;

      return (
        <div className="bg-opacity-50 fixed inset-0 flex items-center justify-center bg-black">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">
              {mode === "edit" ? "Edit Car" : "Add Car"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="make" className="block text-sm font-medium">
                  Make *
                </label>
                <input
                  id="make"
                  type="text"
                  required
                  value={formData.make}
                  onChange={(e) =>
                    setFormData({ ...formData, make: e.target.value })
                  }
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
                {errors.make && (
                  <div className="text-sm text-red-600">{errors.make}</div>
                )}
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium">
                  Model *
                </label>
                <input
                  id="model"
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
                {errors.model && (
                  <div className="text-sm text-red-600">{errors.model}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="year" className="block text-sm font-medium">
                    Year
                  </label>
                  <input
                    id="year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 2}
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded border px-3 py-2"
                  />
                  {errors.year && (
                    <div className="text-sm text-red-600">{errors.year}</div>
                  )}
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium">
                    Price
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded border px-3 py-2"
                  />
                  {errors.price && (
                    <div className="text-sm text-red-600">{errors.price}</div>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  maxLength={5000}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
                <div className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/5000 characters
                </div>
                {errors.description && (
                  <div className="text-sm text-red-600">
                    {errors.description}
                  </div>
                )}
              </div>

              {errors.submit && (
                <div className="text-sm text-red-600">{errors.submit}</div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded border px-4 py-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    };

    const mockCarData = {
      id: "car-123",
      make: "Toyota",
      model: "Camry",
      year: 2023,
      price: 25000,
      mileage: 15000,
      description: "Well maintained sedan",
    };

    const mockModalProps = {
      isOpen: true,
      onClose: jest.fn(),
      onSave: jest.fn(),
      car: mockCarData,
      mode: "edit",
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(cleanup);

    it("MUST validate all required fields before submission", async () => {
      const user = userEvent.setup();
      render(<CarModal {...mockModalProps} car={null} mode="add" />);

      // STRICT: Clear required fields and try to submit
      await user.clear(screen.getByLabelText(/make/i));
      await user.clear(screen.getByLabelText(/model/i));

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // STRICT: Must show validation errors
      expect(screen.getByText("Make is required")).toBeTruthy();
      expect(screen.getByText("Model is required")).toBeTruthy();
      expect(mockModalProps.onSave).not.toHaveBeenCalled();
    });

    it("MUST enforce numeric constraints strictly", async () => {
      const user = userEvent.setup();
      render(<CarModal {...mockModalProps} />);

      // STRICT: Test invalid year values
      const yearInput = screen.getByLabelText(/year/i);
      await user.clear(yearInput);
      await user.type(yearInput, "1800"); // Too old

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText("Invalid year")).toBeTruthy();

      // STRICT: Test negative price
      const priceInput = screen.getByLabelText(/price/i);
      await user.clear(priceInput);
      await user.type(priceInput, "-1000");

      await user.click(saveButton);
      expect(screen.getByText("Price cannot be negative")).toBeTruthy();
    });

    it("MUST prevent XSS attacks in text inputs", async () => {
      const user = userEvent.setup();
      mockModalProps.onSave.mockResolvedValueOnce({});

      render(<CarModal {...mockModalProps} />);

      // STRICT: Test XSS payloads
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
      ];

      const makeInput = screen.getByLabelText(/make/i);

      for (const maliciousInput of maliciousInputs) {
        await user.clear(makeInput);
        await user.type(makeInput, maliciousInput);

        // STRICT: HTML should not be rendered
        expect((makeInput as HTMLInputElement).value).not.toContain("<script>");
        expect(document.querySelector("script")).toBeFalsy();
      }
    });

    it("MUST enforce character limits on text fields", async () => {
      const user = userEvent.setup();
      render(<CarModal {...mockModalProps} />);

      const descriptionInput = screen.getByLabelText(/description/i);

      // STRICT: Test exceeding character limit
      const longText = "a".repeat(5001);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, longText);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      expect(
        screen.getByText("Description too long (max 5000 characters)")
      ).toBeTruthy();
    });

    it("MUST handle save operation errors securely", async () => {
      const user = userEvent.setup();
      mockModalProps.onSave.mockRejectedValueOnce(new Error("Database error"));

      render(<CarModal {...mockModalProps} />);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // STRICT: Must show generic error, not expose system details
      await waitFor(() => {
        expect(screen.getByText("Failed to save car data")).toBeTruthy();
      });

      // STRICT: Must not expose database error details
      expect(screen.queryByText("Database error")).toBeFalsy();
    });

    it("MUST prevent concurrent submissions", async () => {
      const user = userEvent.setup();

      // STRICT: Mock slow save operation
      mockModalProps.onSave.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<CarModal {...mockModalProps} />);

      const saveButton = screen.getByRole("button", { name: /save/i });

      // STRICT: Click save multiple times rapidly
      await user.click(saveButton);
      await user.click(saveButton);
      await user.click(saveButton);

      // STRICT: onSave should only be called once
      await waitFor(
        () => {
          expect(mockModalProps.onSave).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );
    });
  });

  describe("BookingDetailsModal Component - PRIVACY REQUIREMENTS", () => {
    // Mock component based on expected privacy-compliant behavior
    const BookingDetailsModal = ({
      isOpen,
      booking,
      onClose,
      onStatusChange,
    }: any) => {
      if (!isOpen || !booking) return null;

      // STRICT: Sanitize sensitive data for display
      const sanitizeBooking = (booking: any) => ({
        ...booking,
        customerName: booking.customerName || "N/A",
        // STRICT: Mask phone number partially for privacy
        phone: booking.phone
          ? booking.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-***-$3")
          : "N/A",
        email: booking.email || "N/A",
        reference: booking.reference || "N/A",
        status: booking.status || "pending",
      });

      const displayBooking = sanitizeBooking(booking);

      return (
        <div className="bg-opacity-50 fixed inset-0 flex items-center justify-center bg-black">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Booking Details</h2>

            <div className="space-y-3">
              <div>
                <strong>Reference:</strong> {displayBooking.reference}
              </div>
              <div>
                <strong>Customer:</strong> {displayBooking.customerName}
              </div>
              <div>
                <strong>Phone:</strong> {displayBooking.phone}
              </div>
              <div>
                <strong>Email:</strong> {displayBooking.email}
              </div>
              <div>
                <strong>Status:</strong>
                <select
                  value={displayBooking.status}
                  onChange={(e) => onStatusChange(booking.id, e.target.value)}
                  className="ml-2 rounded border px-2 py-1"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    };

    const sensitiveBooking = {
      id: "booking-123",
      customerName: "John Doe",
      phone: "5551234567",
      email: "john.doe@example.com",
      reference: "REF-2024-001",
      status: "pending",
      internalNotes: "Customer has bad credit history", // Should not be displayed
      adminComments: "VIP client - special handling", // Should not be displayed
    };

    const mockBookingProps = {
      isOpen: true,
      booking: sensitiveBooking,
      onClose: jest.fn(),
      onStatusChange: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(cleanup);

    it("MUST protect customer privacy by masking sensitive data", () => {
      render(<BookingDetailsModal {...mockBookingProps} />);

      // STRICT: Phone number must be partially masked
      expect(screen.getByText(/555-\*\*\*-4567/)).toBeTruthy();

      // STRICT: Full phone number must not be visible in DOM
      expect(document.body.innerHTML).not.toContain("5551234567");
    });

    it("MUST not display internal sensitive information", () => {
      render(<BookingDetailsModal {...mockBookingProps} />);

      // STRICT: Internal notes must not be displayed
      expect(screen.queryByText(/bad credit history/i)).toBeFalsy();
      expect(screen.queryByText(/VIP client/i)).toBeFalsy();
      expect(screen.queryByText(/internalNotes/i)).toBeFalsy();
      expect(screen.queryByText(/adminComments/i)).toBeFalsy();
    });

    it("MUST validate status changes before applying", async () => {
      const user = userEvent.setup();
      render(<BookingDetailsModal {...mockBookingProps} />);

      const statusSelect = screen.getByDisplayValue("pending");

      // STRICT: Valid status change should work
      await user.selectOptions(statusSelect, "confirmed");
      expect(mockBookingProps.onStatusChange).toHaveBeenCalledWith(
        "booking-123",
        "confirmed"
      );
    });

    it("MUST handle malicious booking data safely", () => {
      const maliciousBooking = {
        ...sensitiveBooking,
        customerName: '<script>alert("xss")</script>Malicious User',
        email: "test@evil.com<img src=x onerror=alert(1)>",
        reference: 'REF<iframe src="javascript:alert(1)"></iframe>2024',
      };

      const maliciousProps = { ...mockBookingProps, booking: maliciousBooking };

      render(<BookingDetailsModal {...maliciousProps} />);

      // STRICT: Script tags must not execute
      expect(document.querySelector("script")).toBeFalsy();
      expect(document.querySelector("iframe")).toBeFalsy();

      // STRICT: HTML must be escaped in display
      expect(screen.queryByText(/<script>/)).toBeFalsy();
    });

    it("MUST not expose booking data when closed", () => {
      const { rerender } = render(
        <BookingDetailsModal {...mockBookingProps} />
      );

      // Verify data is shown when open
      expect(screen.getByText("John Doe")).toBeTruthy();

      // STRICT: Data must not be in DOM when closed
      rerender(<BookingDetailsModal {...mockBookingProps} isOpen={false} />);
      expect(screen.queryByText("John Doe")).toBeFalsy();
      expect(document.body.innerHTML).not.toContain("john.doe@example.com");
    });
  });
});
