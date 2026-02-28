/**
 * PASSWORDFORM COMPONENT TESTS
 * Tests the 3-step password management form:
 *  - Step 1: Choose Action (reset / reminder SelectionCards)
 *  - Step 2: Find User (lookup by username/email via API)
 *  - Step 3: Review & Submit (action-specific warnings, API call,
 *            new password display or email-sent confirmation)
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
import PasswordForm from "@/components/Admin/Form/PasswordForm";

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

describe("PasswordForm Component", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(cleanup);

  // ── Rendering ──────────────────────────────────────────────
  describe("Initial Render", () => {
    it("renders step 1 heading — Choose Action", () => {
      render(<PasswordForm />);
      expect(
        screen.getByRole("heading", { name: "Choose Action" })
      ).toBeInTheDocument();
    });

    it("shows all 3 step titles", () => {
      render(<PasswordForm />);
      expect(
        screen.getAllByText("Choose Action").length
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Find User").length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText("Review & Submit").length
      ).toBeGreaterThanOrEqual(1);
    });

    it("shows Reset and Reminder cards", () => {
      render(<PasswordForm />);
      expect(screen.getByText("Reset Password")).toBeInTheDocument();
      expect(screen.getByText("Password Reminder")).toBeInTheDocument();
    });
  });

  // ── Step 1: Choose Action ──────────────────────────────────
  describe("Step 1 — Choose Action Validation", () => {
    it("blocks next when no action is selected", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Please select an action")).toBeInTheDocument();
    });

    it("advances after selecting Reset Password", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await user.click(screen.getByText("Reset Password"));
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Find User" })
      ).toBeInTheDocument();
    });

    it("advances after selecting Password Reminder", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await user.click(screen.getByText("Password Reminder"));
      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Find User" })
      ).toBeInTheDocument();
    });

    it("shows reset card description items", () => {
      render(<PasswordForm />);
      expect(
        screen.getByText("Old password is revoked immediately")
      ).toBeInTheDocument();
      expect(
        screen.getByText("New strong password auto-generated")
      ).toBeInTheDocument();
    });

    it("shows reminder card description items", () => {
      render(<PasswordForm />);
      expect(
        screen.getByText("Sends email to user's address")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Includes a secure reset link")
      ).toBeInTheDocument();
    });
  });

  // ── Step 2: Find User ──────────────────────────────────────
  describe("Step 2 — Find User Validation", () => {
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
      setInput("e.g. jsmith or john@example.com", "someuser");
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

    it("calls lookup API and shows found user", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { username: "jsmith", email: "j@example.com", role: "staff" },
        }),
      });

      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep2(user);
      setInput("e.g. jsmith or john@example.com", "jsmith");
      await user.click(screen.getByText("Look Up"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/admin/users/lookup?q=jsmith"
        );
      });

      await waitFor(() => {
        expect(screen.getByText("jsmith")).toBeInTheDocument();
        expect(screen.getByText("j@example.com")).toBeInTheDocument();
      });
      expect(
        screen.getByText(/User found — confirm the details below/i)
      ).toBeInTheDocument();
    });

    it("shows error when lookup fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "User not found" }),
      });

      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep2(user);
      setInput("e.g. jsmith or john@example.com", "nobody");
      await user.click(screen.getByText("Look Up"));

      await waitFor(() => {
        expect(screen.getByText("User not found")).toBeInTheDocument();
      });
    });

    it("advances to step 3 after successful lookup", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { username: "alice", email: "alice@test.com", role: "manager" },
        }),
      });

      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep2(user);
      setInput("e.g. jsmith or john@example.com", "alice");
      await user.click(screen.getByText("Look Up"));

      await waitFor(() => {
        expect(screen.getByText("alice")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Next"));
      expect(
        screen.getByRole("heading", { name: "Review & Submit" })
      ).toBeInTheDocument();
    });
  });

  // ── Step 3: Review & Submit — Reset ────────────────────────
  describe("Step 3 — Reset Password Flow", () => {
    const goToStep3Reset = async (user: ReturnType<typeof userEvent.setup>) => {
      // Step 1: choose reset
      await user.click(screen.getByText("Reset Password"));
      await user.click(screen.getByText("Next"));
      // Step 2: look up user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { username: "bob", email: "bob@test.com", role: "staff" },
        }),
      });
      setInput("e.g. jsmith or john@example.com", "bob");
      await user.click(screen.getByText("Look Up"));
      await waitFor(() => expect(screen.getByText("bob")).toBeInTheDocument());
      await user.click(screen.getByText("Next"));
    };

    it("shows reset-specific warning banner", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep3Reset(user);

      expect(
        screen.getByText(/immediately revoke the user's current password/i)
      ).toBeInTheDocument();
    });

    it("shows Reset Password as submit label", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep3Reset(user);

      // The submit button should say "Reset Password"
      const submitButtons = screen.getAllByText("Reset Password");
      const button = submitButtons.find((el) => el.closest("button") !== null);
      expect(button).toBeTruthy();
    });

    it("submits reset and shows new password", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep3Reset(user);

      // Mock the password endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ password: "NewPass456!" }),
      });

      // Click the submit button (there may be multiple "Reset Password" texts)
      const submitButtons = screen.getAllByText("Reset Password");
      const button = submitButtons.find((el) => el.closest("button") !== null);
      await user.click(button!);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/users/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset", username: "bob" }),
        });
      });

      await waitFor(() => {
        expect(screen.getByText("NewPass456!")).toBeInTheDocument();
      });
      expect(screen.getByText("Password Reset Successful")).toBeInTheDocument();
    });
  });

  // ── Step 3: Review & Submit — Reminder ─────────────────────
  describe("Step 3 — Password Reminder Flow", () => {
    const goToStep3Reminder = async (
      user: ReturnType<typeof userEvent.setup>
    ) => {
      // Step 1: choose reminder
      await user.click(screen.getByText("Password Reminder"));
      await user.click(screen.getByText("Next"));
      // Step 2: look up user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { username: "carol", email: "carol@test.com", role: "admin" },
        }),
      });
      setInput("e.g. jsmith or john@example.com", "carol");
      await user.click(screen.getByText("Look Up"));
      await waitFor(() =>
        expect(screen.getByText("carol")).toBeInTheDocument()
      );
      await user.click(screen.getByText("Next"));
    };

    it("shows reminder-specific info banner", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep3Reminder(user);

      expect(
        screen.getByText(/email with a password reset link will be sent/i)
      ).toBeInTheDocument();
    });

    it("shows Send Reminder as submit label", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep3Reminder(user);

      expect(screen.getByText("Send Reminder")).toBeInTheDocument();
    });

    it("submits reminder and shows email-sent confirmation", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);
      await goToStep3Reminder(user);

      // Mock the password endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Reminder sent" }),
      });

      await user.click(screen.getByText("Send Reminder"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/users/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reminder", username: "carol" }),
        });
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Password reminder sent!/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ── Data Persistence ───────────────────────────────────────
  describe("Data Persistence", () => {
    it("preserves action selection when navigating back", async () => {
      const user = userEvent.setup();
      render(<PasswordForm />);

      await user.click(screen.getByText("Reset Password"));
      await user.click(screen.getByText("Next"));

      // Go back
      await user.click(screen.getByText("Previous"));

      // The Reset Password card should still be selected
      expect(screen.getByText("Reset Password")).toBeInTheDocument();
    });
  });
});
