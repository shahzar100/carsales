/**
 * USERFORM COMPONENT TESTS
 * Tests the 3-step user creation form:
 *  - Step 1: Account Details (username + email validation)
 *  - Step 2: Privilege Level (3 role SelectionCards)
 *  - Step 3: Review & Submit (summary, API call, generated password display)
 *  - Validates API submission payload + error handling
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
import UserForm from "@/components/Admin/Form/UserForm";

// ── Global fetch mock ────────────────────────────────────────
const mockFetch = jest.fn();
beforeAll(() => {
  global.fetch = mockFetch;
});
afterAll(() => {
  // @ts-expect-error - restoring original
  delete global.fetch;
});

/** Helper — reliable input value setter */
const setInput = (placeholder: string, value: string) => {
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value } });
};

describe("UserForm Component", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(cleanup);

  // ── Rendering ──────────────────────────────────────────────
  describe("Initial Render", () => {
    it("renders step 1 heading — Account Details", () => {
      render(<UserForm />);
      expect(
        screen.getByRole("heading", { name: "Account Details" })
      ).toBeInTheDocument();
    });

    it("shows all 3 step titles in the progress indicator", () => {
      render(<UserForm />);
      expect(
        screen.getAllByText("Account Details").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText("Privilege Level").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText("Review & Submit").length
      ).toBeGreaterThanOrEqual(1);
    });

    it("shows username and email inputs", () => {
      render(<UserForm />);
      expect(screen.getByPlaceholderText("e.g. jsmith")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g. john@example.com")
      ).toBeInTheDocument();
    });

    it("shows the setup-email info banner", () => {
      render(<UserForm />);
      expect(
        screen.getByText(/emailed a secure link to set their own password/i)
      ).toBeInTheDocument();
    });
  });

  // ── Step 1: Account Details Validation ─────────────────────
  describe("Step 1 — Account Details Validation", () => {
    it("blocks next when username is empty", () => {
      render(<UserForm />);
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("blocks next when username is too short", () => {
      render(<UserForm />);
      setInput("e.g. jsmith", "ab");
      setInput("e.g. john@example.com", "a@b.com");
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("blocks next when username has invalid characters", () => {
      render(<UserForm />);
      setInput("e.g. jsmith", "bad user!");
      setInput("e.g. john@example.com", "a@b.com");
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("blocks next when email is empty", () => {
      render(<UserForm />);
      setInput("e.g. jsmith", "validuser");
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("blocks next with invalid email format", () => {
      render(<UserForm />);
      setInput("e.g. jsmith", "validuser");
      setInput("e.g. john@example.com", "not-an-email");
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("advances to step 2 with valid data", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      setInput("e.g. jsmith", "johndoe");
      setInput("e.g. john@example.com", "john@example.com");
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Privilege Level" })
      ).toBeInTheDocument();
    });
  });

  // ── Step 2: Privilege Level ────────────────────────────────
  describe("Step 2 — Privilege Level Selection", () => {
    const goToStep2 = async (user: ReturnType<typeof userEvent.setup>) => {
      setInput("e.g. jsmith", "johndoe");
      setInput("e.g. john@example.com", "john@example.com");
      await user.click(screen.getByText("Next"));
    };

    it("shows 3 role cards — Staff, Manager, Admin", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep2(user);

      expect(screen.getByText("Staff")).toBeInTheDocument();
      expect(screen.getByText("Manager")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("blocks next when no role is selected", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep2(user);
      const nextButton = screen.getByText("Next").closest("button")!;
      expect(nextButton).toBeDisabled();
    });

    it("advances to step 3 after selecting a role", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep2(user);
      await user.click(screen.getByText("Staff"));
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Review & Submit" })
      ).toBeInTheDocument();
    });

    it("shows role descriptions", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep2(user);
      expect(
        screen.getByText("Basic access for day-to-day operations")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Manage inventory, bookings & customers")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Full system access — main administrator")
      ).toBeInTheDocument();
    });
  });

  // ── Step 3: Review & Submit ────────────────────────────────
  describe("Step 3 — Review & API Submission", () => {
    const goToStep3 = async (
      user: ReturnType<typeof userEvent.setup>,
      role = "Staff"
    ) => {
      setInput("e.g. jsmith", "testuser");
      setInput("e.g. john@example.com", "test@example.com");
      await user.click(screen.getByText("Next"));
      await user.click(screen.getByText(role));
      await user.click(screen.getByText("Next"));
    };

    it("shows summary card with correct data", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep3(user);

      expect(screen.getByText("testuser")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(
        screen.getByText("Set by the user via emailed link")
      ).toBeInTheDocument();
    });

    it("shows role-specific info banner for admin", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep3(user, "Admin");

      expect(
        screen.getByText(/full access to the entire system/i)
      ).toBeInTheDocument();
    });

    it("shows role-specific info banner for manager", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep3(user, "Manager");

      expect(
        screen.getByText(/can manage cars, bookings, and appointments/i)
      ).toBeInTheDocument();
    });

    it("shows role-specific info banner for staff", async () => {
      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep3(user, "Staff");

      expect(screen.getByText(/view-only access/i)).toBeInTheDocument();
    });

    it("submits the correct payload and confirms the user was created", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, emailSent: true }),
      });

      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep3(user);

      await user.click(screen.getByText("Create User"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            email: "test@example.com",
            role: "staff",
          }),
        });
      });

      // No password is shown — the new user receives a setup email instead.
      await waitFor(() => {
        expect(screen.getByText("User created")).toBeInTheDocument();
      });
    });

    it("surfaces the API error when creation fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Username already exists" }),
      });

      const user = userEvent.setup();
      render(<UserForm />);
      await goToStep3(user);

      await user.click(screen.getByText("Create User"));

      // Form.tsx surfaces the server's actual error message.
      await waitFor(() => {
        expect(
          screen.getByText("Username already exists")
        ).toBeInTheDocument();
      });
    });
  });

  // ── Data Persistence ───────────────────────────────────────
  describe("Data Persistence", () => {
    it("preserves data when navigating back to step 1", async () => {
      const user = userEvent.setup();
      render(<UserForm />);

      setInput("e.g. jsmith", "myuser");
      setInput("e.g. john@example.com", "my@email.com");
      await user.click(screen.getByText("Next"));

      // Go back
      await user.click(screen.getByText("Previous"));

      expect(screen.getByPlaceholderText("e.g. jsmith")).toHaveValue("myuser");
      expect(screen.getByPlaceholderText("e.g. john@example.com")).toHaveValue(
        "my@email.com"
      );
    });
  });
});
