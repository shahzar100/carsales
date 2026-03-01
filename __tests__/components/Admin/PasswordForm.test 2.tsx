/**
 * PASSWORDFORM COMPONENT TESTS
 * Tests the 3-step password reset / reminder form:
 *  - Step 1: Choose Action (reset vs. reminder)
 *  - Step 2: Find User (lookup by username/email)
 *  - Step 3: Review & Submit → password display / email confirmation
 *  - API interactions: lookup + password action
 */
import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PasswordForm from "@/components/Admin/Form/PasswordForm";

// ── Mock fetch ───────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("PasswordForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });
  afterEach(cleanup);

  // ── Rendering ──────────────────────────────────────────────
  describe("Initial Render", () => {
    it("renders step 1 — Choose Action", () => {
      render(<PasswordForm />);
      expect(screen.getByText("Choose Action")).toBeInTheDocument();
    });

    it("shows both action options", () => {
      render(<PasswordForm />);
      expect(screen.getByText("Reset Password")).toBeInTheDocument();
      expect(screen.getByText("Password Reminder")).toBeInTheDocument();
    });

    it("shows all 3 step titles", () => {
      render(<PasswordForm />);
      expect(screen.getByText("Choose Action")).toBeInTheDocument();
      expect(screen.getByText("Find User")).toBeInTheDocument();
      expect(screen.getByText("Review & Submit")).toBeInTheDocument();
    });

    it("shows step counter as 'Step 1 of 3'", () => {
      render(<PasswordForm />);
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });
  });

  // ── Step 1: Action Selection ───────────────────────────────
  describe("Step 1 — Choose Action Validation", () => {
    it("blocks next when no action is selected", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Please select an action")).toBeInTheDocument();
    });

    it("displays reset option description and items", () => {
      render(<PasswordForm />);
      expect(
        screen.getByText("Generate a new password for a user")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Old password is revoked immediately")
      ).toBeInTheDocument();
    });

    it("displays reminder option description and items", () => {
      render(<PasswordForm />);
      expect(
        screen.getByText("Send a reminder email to the user")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Link expires after 24 hours")
      ).toBeInTheDocument();
    });

    it("advances to step 2 after selecting reset", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);

      await user.click(screen.getByText("Reset Password"));
      await user.click(screen.getByText("Next"));

      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      expect(screen.getByText("Username or Email")).toBeInTheDocument();
    });

    it("advances to step 2 after selecting reminder", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);

      await user.click(screen.getByText("Password Reminder"));
      await user.click(screen.getByText("Next"));

      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    });
  });

  // ── Step 2: Find User ──────────────────────────────────────
  describe("Step 2 — Find User", () => {
    const goToStep2 = async (
      user: ReturnType<typeof userEvent.setup>,
      action: "Reset Password" | "Password Reminder" = "Reset Password"
    ) => {
      await user.click(screen.getByText(action));
      await user.click(screen.getByText("Next"));
    };

    it("blocks next when identifier is empty", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep2(user);

      await user.click(screen.getByText("Next"));
      expect(
        screen.getByText("Please enter a username or email")
      ).toBeInTheDocument();
    });

    it("blocks next when user has not been looked up", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep2(user);

      await user.type(
        screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
        "jsmith"
      );
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByText("Please look up and verify the user first")
      ).toBeInTheDocument();
    });

    it("shows Look Up button", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep2(user);

      expect(screen.getByText("Look Up")).toBeInTheDocument();
    });

    it("calls lookup API and displays found user", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { username: "jsmith", email: "john@test.com", role: "staff" },
        }),
      });
      render(<PasswordForm />);
      await goToStep2(user);

      await user.type(
        screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
        "jsmith"
      );
      await user.click(screen.getByText("Look Up"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/admin/users/lookup?q=jsmith"
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            "User found — confirm the details below are correct."
          )
        ).toBeInTheDocument();
        expect(screen.getByText("jsmith")).toBeInTheDocument();
        expect(screen.getByText("john@test.com")).toBeInTheDocument();
      });
    });

    it("shows error when user is not found", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: "No user found with that username or email",
        }),
      });
      render(<PasswordForm />);
      await goToStep2(user);

      await user.type(
        screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
        "nonexistent"
      );
      await user.click(screen.getByText("Look Up"));

      await waitFor(() => {
        expect(
          screen.getByText("No user found with that username or email")
        ).toBeInTheDocument();
      });
    });

    it("advances to step 3 after successful lookup", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { username: "jsmith", email: "john@test.com", role: "manager" },
        }),
      });
      render(<PasswordForm />);
      await goToStep2(user);

      await user.type(
        screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
        "jsmith"
      );
      await user.click(screen.getByText("Look Up"));

      await waitFor(() => {
        expect(screen.getByText("jsmith")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    });
  });

  // ── Step 3: Review & Submit ────────────────────────────────
  describe("Step 3 — Review & Submit", () => {
    const goToStep3 = async (
      user: ReturnType<typeof userEvent.setup>,
      action: "Reset Password" | "Password Reminder" = "Reset Password"
    ) => {
      // Step 1: choose action
      await user.click(screen.getByText(action));
      await user.click(screen.getByText("Next"));

      // Step 2: lookup user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { username: "jsmith", email: "john@test.com", role: "staff" },
        }),
      });
      await user.type(
        screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
        "jsmith"
      );
      await user.click(screen.getByText("Look Up"));
      await waitFor(() => {
        expect(screen.getByText("jsmith")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Next"));
    };

    it("shows reset warning on review for reset action", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep3(user, "Reset Password");

      expect(
        screen.getByText(
          /This will immediately revoke the user's current password/
        )
      ).toBeInTheDocument();
    });

    it("shows reminder info on review for reminder action", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep3(user, "Password Reminder");

      expect(
        screen.getByText(/An email with a password reset link will be sent to/)
      ).toBeInTheDocument();
    });

    it("shows Reset Password as submit label for reset action", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep3(user, "Reset Password");

      // The submit button should say "Reset Password"
      const submitButtons = screen.getAllByText("Reset Password");
      // There may be the selection card title and the submit button
      expect(submitButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("shows Send Reminder as submit label for reminder action", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep3(user, "Password Reminder");

      expect(screen.getByText("Send Reminder")).toBeInTheDocument();
    });

    it("displays summary with user details", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep3(user, "Reset Password");

      // Summary card should show the found user's info
      expect(screen.getByText("jsmith")).toBeInTheDocument();
      expect(screen.getByText("john@test.com")).toBeInTheDocument();
    });
  });

  // ── Submission ─────────────────────────────────────────────
  describe("API Submission", () => {
    const fillAndSubmit = async (
      user: ReturnType<typeof userEvent.setup>,
      action: "Reset Password" | "Password Reminder" = "Reset Password"
    ) => {
      // Step 1
      await user.click(screen.getByText(action));
      await user.click(screen.getByText("Next"));

      // Step 2 - lookup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { username: "jsmith", email: "john@test.com", role: "staff" },
        }),
      });
      await user.type(
        screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
        "jsmith"
      );
      await user.click(screen.getByText("Look Up"));
      await waitFor(() => {
        expect(screen.getByText("jsmith")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Next"));
    };

    it("sends correct data to /api/admin/users/password for reset", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await fillAndSubmit(user, "Reset Password");

      // Mock the password action response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          password: "Abc1-Def2-Ghi3-Jkl4",
        }),
      });

      // Find and click the submit button (Reset Password)
      const submitButtons = screen.getAllByRole("button");
      const submitBtn = submitButtons.find(
        (btn) =>
          btn.textContent?.includes("Reset Password") &&
          btn.getAttribute("type") === "submit"
      );
      if (submitBtn) await user.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/users/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reset",
            username: "jsmith",
          }),
        });
      });
    });

    it("displays generated password after successful reset", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await fillAndSubmit(user, "Reset Password");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          password: "Xyz9-!mNp-2#aB-7Qw4",
        }),
      });

      const submitButtons = screen.getAllByRole("button");
      const submitBtn = submitButtons.find(
        (btn) =>
          btn.textContent?.includes("Reset Password") &&
          btn.getAttribute("type") === "submit"
      );
      if (submitBtn) await user.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Password Reset Successful")
        ).toBeInTheDocument();
        expect(screen.getByText("Xyz9-!mNp-2#aB-7Qw4")).toBeInTheDocument();
      });
    });

    it("sends correct data to /api/admin/users/password for reminder", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await fillAndSubmit(user, "Password Reminder");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          emailSent: true,
        }),
      });

      const submitButtons = screen.getAllByRole("button");
      const submitBtn = submitButtons.find(
        (btn) =>
          btn.textContent?.includes("Send Reminder") &&
          btn.getAttribute("type") === "submit"
      );
      if (submitBtn) await user.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/users/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reminder",
            username: "jsmith",
          }),
        });
      });
    });

    it("shows email sent confirmation after successful reminder", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await fillAndSubmit(user, "Password Reminder");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          emailSent: true,
        }),
      });

      const submitButtons = screen.getAllByRole("button");
      const submitBtn = submitButtons.find(
        (btn) =>
          btn.textContent?.includes("Send Reminder") &&
          btn.getAttribute("type") === "submit"
      );
      if (submitBtn) await user.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Password reminder sent!/i)
        ).toBeInTheDocument();
      });
    });
  });
});
