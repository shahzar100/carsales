/**
 * USERFORM COMPONENT TESTS
 * Tests the 3-step admin user creation form:
 *  - Step 1: Account Details (username + email) validation
 *  - Step 2: Privilege Level selection (staff / manager / admin)
 *  - Step 3: Review & Submit → generated password display
 *  - API submission via fetch to /api/admin/users
 */
import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserForm from "@/components/Admin/Form/UserForm";

// ── Mock fetch ───────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("UserForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });
  afterEach(cleanup);

  // ── Rendering ──────────────────────────────────────────────
  describe("Initial Render", () => {
    it("renders step 1 — Account Details", () => {
      render(<UserForm />);
      expect(screen.getByText("Account Details")).toBeInTheDocument();
      expect(screen.getByText("Username")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("shows all 3 step titles", () => {
      render(<UserForm />);
      expect(screen.getByText("Account Details")).toBeInTheDocument();
      expect(screen.getByText("Privilege Level")).toBeInTheDocument();
      expect(screen.getByText("Review & Submit")).toBeInTheDocument();
    });

    it("shows the info banner about auto-generated password", () => {
      render(<UserForm />);
      expect(
        screen.getByText(/A strong password will be automatically generated/i)
      ).toBeInTheDocument();
    });

    it("shows step counter as 'Step 1 of 3'", () => {
      render(<UserForm />);
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });
  });

  // ── Step 1: Account Details Validation ─────────────────────
  describe("Step 1 — Account Details Validation", () => {
    it("blocks next when username is empty", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Username is required")).toBeInTheDocument();
    });

    it("blocks next when username is too short", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await user.type(screen.getByPlaceholderText("e.g. jsmith"), "ab");
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByText("Username must be at least 3 characters")
      ).toBeInTheDocument();
    });

    it("blocks next when username has invalid characters", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await user.type(screen.getByPlaceholderText("e.g. jsmith"), "user name!");
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByText(
          "Username can only contain letters, numbers, and underscores"
        )
      ).toBeInTheDocument();
    });

    it("blocks next when email is empty", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await user.type(screen.getByPlaceholderText("e.g. jsmith"), "testuser");
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    it("blocks next when email is invalid", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await user.type(screen.getByPlaceholderText("e.g. jsmith"), "testuser");
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "not-valid"
      );
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });

    it("advances to step 2 with valid username and email", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await user.type(screen.getByPlaceholderText("e.g. jsmith"), "jsmith");
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "john@test.com"
      );
      await user.click(screen.getByText("Next"));

      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      expect(screen.getByText("Staff")).toBeInTheDocument();
      expect(screen.getByText("Manager")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });
  });

  // ── Step 2: Privilege Level ────────────────────────────────
  describe("Step 2 — Privilege Level Selection", () => {
    const goToStep2 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByPlaceholderText("e.g. jsmith"), "jsmith");
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "john@test.com"
      );
      await user.click(screen.getByText("Next"));
    };

    it("blocks next when no role is selected", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep2(user);

      await user.click(screen.getByText("Next"));
      expect(
        screen.getByText("Please select a privilege level")
      ).toBeInTheDocument();
    });

    it("displays three role cards with descriptions", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep2(user);

      expect(screen.getByText("Staff")).toBeInTheDocument();
      expect(
        screen.getByText("Basic access for day-to-day operations")
      ).toBeInTheDocument();
      expect(screen.getByText("Manager")).toBeInTheDocument();
      expect(
        screen.getByText("Manage inventory, bookings & customers")
      ).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(
        screen.getByText("Full system access — main administrator")
      ).toBeInTheDocument();
    });

    it("advances to step 3 after selecting a role", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep2(user);

      await user.click(screen.getByText("Manager"));
      await user.click(screen.getByText("Next"));

      expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    });
  });

  // ── Step 3: Review & Submit ────────────────────────────────
  describe("Step 3 — Review & Submit", () => {
    const goToStep3 = async (
      user: ReturnType<typeof userEvent.setup>,
      role = "Staff"
    ) => {
      await user.type(screen.getByPlaceholderText("e.g. jsmith"), "jsmith");
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "john@test.com"
      );
      await user.click(screen.getByText("Next"));
      await user.click(screen.getByText(role));
      await user.click(screen.getByText("Next"));
    };

    it("shows summary of entered data", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep3(user, "Manager");

      expect(screen.getByText("jsmith")).toBeInTheDocument();
      expect(screen.getByText("john@test.com")).toBeInTheDocument();
      expect(screen.getByText("Auto-generated on submit")).toBeInTheDocument();
    });

    it("shows the Create User submit button", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep3(user);

      expect(screen.getByText("Create User")).toBeInTheDocument();
    });

    it("shows role-specific info banner for admin", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep3(user, "Admin");

      expect(
        screen.getByText(
          /have full access to the entire system including user management and settings/
        )
      ).toBeInTheDocument();
    });

    it("shows role-specific info banner for manager", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep3(user, "Manager");

      expect(
        screen.getByText(
          /can manage cars, bookings, and appointments but cannot manage other users/
        )
      ).toBeInTheDocument();
    });

    it("shows role-specific info banner for staff", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep3(user, "Staff");

      expect(
        screen.getByText(
          /have view-only access and cannot make changes to the system/
        )
      ).toBeInTheDocument();
    });
  });

  // ── Submission ─────────────────────────────────────────────
  describe("API Submission", () => {
    const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
      // Step 1
      await user.type(screen.getByPlaceholderText("e.g. jsmith"), "jsmith");
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "john@test.com"
      );
      await user.click(screen.getByText("Next"));
      // Step 2
      await user.click(screen.getByText("Staff"));
      await user.click(screen.getByText("Next"));
      // Step 3 — submit
      await user.click(screen.getByText("Create User"));
    };

    it("sends correct data to /api/admin/users on submit", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          password: "Abcd-1234-Efgh-5678",
        }),
      });
      render(<UserForm />);

      await fillAndSubmit(user);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "jsmith",
            email: "john@test.com",
            role: "staff",
          }),
        });
      });
    });

    it("displays the generated password after successful submission", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          password: "Xk9!-mNp2-#aB7-Qw4R",
        }),
      });
      render(<UserForm />);

      await fillAndSubmit(user);

      await waitFor(() => {
        expect(
          screen.getByText("User Created Successfully")
        ).toBeInTheDocument();
        expect(screen.getByText("Xk9!-mNp2-#aB7-Qw4R")).toBeInTheDocument();
      });
    });

    it("shows error message when API returns an error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: "A user with that username already exists",
        }),
      });
      render(<UserForm />);

      await fillAndSubmit(user);

      await waitFor(() => {
        expect(
          screen.getByText("Something went wrong. Please try again.")
        ).toBeInTheDocument();
      });
    });
  });

  // ── Data Persistence ───────────────────────────────────────
  describe("Data Persistence", () => {
    it("preserves username when navigating back from step 2", async () => {
      const user = userEvent.setup();
      render(<UserForm />);

      await user.type(screen.getByPlaceholderText("e.g. jsmith"), "testuser");
      await user.type(
        screen.getByPlaceholderText("e.g. john@example.com"),
        "test@test.com"
      );
      await user.click(screen.getByText("Next"));

      // Go back
      await user.click(screen.getByText("Previous"));

      expect(screen.getByPlaceholderText("e.g. jsmith")).toHaveValue(
        "testuser"
      );
      expect(screen.getByPlaceholderText("e.g. john@example.com")).toHaveValue(
        "test@test.com"
      );
    });
  });
});
