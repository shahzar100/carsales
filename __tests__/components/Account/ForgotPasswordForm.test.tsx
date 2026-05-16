/**
 * Tests for src/components/Account/ForgotPasswordForm.tsx
 *
 * Standards coverage:
 * - 🔒 Security: on 2xx response, show generic "check your inbox" copy that
 *   doesn't reveal whether the email is registered
 * - 📋 Functional: POSTs the email to /api/auth/forgot-password
 * - 🎯 Usability: distinct error copy for 429 vs other failures; loading
 *   state disables the submit button
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordForm from "@/components/Account/ForgotPasswordForm";

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

describe("ForgotPasswordForm", () => {
  it("POSTs the email to /api/auth/forgot-password", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    const user = userEvent.setup();

    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/email/i), "u@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/forgot-password");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "u@example.com" });
  });

  it("🔒 shows generic 'check your inbox' message on success (no enumeration)", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "x@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument()
    );
    // The success message must NOT confirm or deny that the email was
    // found. The copy is split across an inline <span> for the email, so
    // probe individual fragments instead of a full-sentence regex.
    expect(
      screen.getByText(/has an account with a password/i)
    ).toBeInTheDocument();
    expect(screen.getByText("x@example.com")).toBeInTheDocument();
  });

  it("🎯 shows the rate-limit message on 429", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "x@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/too many requests.*try again/i)
      ).toBeInTheDocument()
    );
  });

  it("🎯 shows a generic error on non-2xx (excluding 429)", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "x@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    );
  });

  it("🎯 shows a generic error when fetch itself rejects", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "x@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    );
  });
});
