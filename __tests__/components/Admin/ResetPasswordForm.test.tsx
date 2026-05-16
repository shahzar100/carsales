/**
 * Tests for src/components/Admin/ResetPasswordForm.tsx
 *
 * Standards coverage:
 * - 🔒 Security: client-side gates — 12+ chars, mixed case + digit, match
 *   confirm; stricter than the customer-side form (8 chars), matching the
 *   admin /api/admin/users/reset-password route
 * - 📋 Functional: POST token + newPassword; success state then redirect
 *   to /admin/login after 2s
 * - 🎯 Usability: error messages distinguish each validation failure
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
  usePathname: () => "/admin/reset-password",
}));

import ResetPasswordForm from "@/components/Admin/ResetPasswordForm";

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

function changePw(value: string) {
  const pw = screen.getByLabelText("New password") as HTMLInputElement;
  // Drop the HTML5 minLength so we can submit shorter values for the
  // JS-side guard tests.
  pw.removeAttribute("minLength");
  fireEvent.change(pw, { target: { value } });
}
function changeConfirm(value: string) {
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value },
  });
}

describe("Admin ResetPasswordForm", () => {
  it("🔒 rejects password shorter than 12 characters", async () => {
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    changePw("Short1a");
    changeConfirm("Short1a");
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    await waitFor(() =>
      expect(
        screen.getByText(/at least 12 characters/i)
      ).toBeInTheDocument()
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("🔒 rejects password missing uppercase/lowercase/digit", async () => {
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    changePw("alllowercasenodigit");
    changeConfirm("alllowercasenodigit");
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    // The hint copy and the error banner both contain the same fragment —
    // accept >=2 matches once the banner appears (the hint alone is 1).
    await waitFor(() =>
      expect(
        screen.getAllByText(/uppercase, lowercase, and a digit/i).length
      ).toBeGreaterThan(1)
    );
  });

  it("🔒 rejects mismatched confirm", async () => {
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    changePw("GoodPassword1");
    changeConfirm("DifferentPwd1");
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    );
  });

  it("📋 valid password POSTs to /api/admin/users/reset-password", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    changePw("GoodPassword1");
    changeConfirm("GoodPassword1");
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const init = fetchMock.mock.calls[0][1];
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/admin/users/reset-password"
    );
    expect(JSON.parse(init.body)).toEqual({
      token: "a".repeat(64),
      newPassword: "GoodPassword1",
    });
  });

  it("✅ shows success state then router.push('/admin/login') after 2s", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    changePw("GoodPassword1");
    changeConfirm("GoodPassword1");
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/password updated/i)).toBeInTheDocument()
    );
    jest.advanceTimersByTime(2100);
    expect(mockPush).toHaveBeenCalledWith("/admin/login");
  });

  it("🎯 surfaces server error on success=false", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: "This reset link has expired",
      }),
    });
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    changePw("GoodPassword1");
    changeConfirm("GoodPassword1");
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    await waitFor(() =>
      expect(
        screen.getByText(/this reset link has expired/i)
      ).toBeInTheDocument()
    );
  });

  it("🎯 generic message on network error", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    changePw("GoodPassword1");
    changeConfirm("GoodPassword1");
    fireEvent.submit(
      screen.getByRole("button", { name: /set new password/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    );
  });
});
