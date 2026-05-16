/**
 * Tests for src/components/Account/ResetPasswordForm.tsx
 *
 * Standards coverage:
 * - 🔒 Security: client-side gate ensures password is 8+ chars and matches
 *   confirm — the server is the ultimate authority but we don't ship a
 *   short password
 * - 📋 Functional: POSTs token + newPassword; on success bounces to /login
 * - 🎯 Usability: distinct error messages for mismatch, too short, server
 *   error, network error
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/reset-password",
}));

import ResetPasswordForm from "@/components/Account/ResetPasswordForm";

let fetchMock: jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  mockPush.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("ResetPasswordForm", () => {
  it("🔒 rejects mismatched passwords before any network call", async () => {
    render(<ResetPasswordForm token={"x".repeat(64)} />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "longenough" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "different" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument()
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("🔒 rejects passwords shorter than 8 characters", async () => {
    render(<ResetPasswordForm token={"x".repeat(64)} />);
    // Bypass the HTML5 minLength gate by setting value programmatically and
    // submitting; the component still re-checks length in JS.
    const pw = screen.getByLabelText("New password") as HTMLInputElement;
    const cf = screen.getByLabelText(/confirm new password/i) as HTMLInputElement;
    pw.removeAttribute("minLength");
    cf.removeAttribute("minLength");
    fireEvent.change(pw, { target: { value: "short" } });
    fireEvent.change(cf, { target: { value: "short" } });
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    await waitFor(() =>
      expect(
        screen.getByText(/at least 8 characters/i)
      ).toBeInTheDocument()
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs token + newPassword on a valid submission", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "longenoughpw" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "longenoughpw" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/reset-password");
    expect(JSON.parse(init.body)).toEqual({
      token: "a".repeat(64),
      newPassword: "longenoughpw",
    });
  });

  it("✅ shows the success state and bounces to /login after 2s", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "longenoughpw" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "longenoughpw" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );

    await waitFor(() =>
      expect(screen.getByText(/password updated/i)).toBeInTheDocument()
    );
    expect(
      screen.getByText(/taking you to the sign-in page/i)
    ).toBeInTheDocument();

    // Advance the 2-second timer and verify the redirect.
    jest.advanceTimersByTime(2100);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("🎯 relays the server's error message when success=false", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: "This reset link is invalid or has expired.",
      }),
    });
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "longenoughpw" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "longenoughpw" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    await waitFor(() =>
      expect(
        screen.getByText(/this reset link is invalid or has expired/i)
      ).toBeInTheDocument()
    );
  });

  it("🎯 shows a generic error on network failure", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "longenoughpw" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "longenoughpw" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    );
  });
});
