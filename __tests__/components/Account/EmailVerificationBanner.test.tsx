/**
 * Tests for src/components/Account/EmailVerificationBanner.tsx
 *
 * Standards coverage:
 * - 📋 Functional: fetches /api/account/profile; renders only when
 *   emailVerified=false; ?verified=1 shows success, ?verified=expired
 *   shows expired copy; resend posts to /api/auth/verify-email
 * - 🎯 Usability: fails open — network or non-2xx profile lookup hides the
 *   banner (don't nag a user we can't verify)
 */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Global jest.setup.component.js mocks useSearchParams() with an empty
// URLSearchParams. Override so each test can simulate ?verified=1 etc.
const searchParamsValue: URLSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => searchParamsValue,
  usePathname: () => "/account",
}));

import EmailVerificationBanner from "@/components/Account/EmailVerificationBanner";

let fetchMock: jest.Mock;

beforeEach(() => {
  for (const k of Array.from(searchParamsValue.keys())) {
    searchParamsValue.delete(k);
  }
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

describe("EmailVerificationBanner", () => {
  it("renders nothing while the profile request is in flight", () => {
    fetchMock.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<EmailVerificationBanner />);
    expect(container.textContent).toBe("");
  });

  it("renders nothing once the profile reports emailVerified=true", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { emailVerified: true } }),
    });
    const { container } = render(<EmailVerificationBanner />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });

  it("renders the warning banner when emailVerified=false", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { emailVerified: false } }),
    });
    render(<EmailVerificationBanner />);
    await waitFor(() =>
      expect(
        screen.getByText(/please verify your email/i)
      ).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: /resend verification email/i })
    ).toBeInTheDocument();
  });

  it("renders the 'expired link' banner when ?verified=expired", async () => {
    searchParamsValue.set("verified", "expired");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { emailVerified: false } }),
    });
    render(<EmailVerificationBanner />);
    await waitFor(() =>
      expect(
        screen.getByText(/that verification link has expired/i)
      ).toBeInTheDocument()
    );
  });

  it("renders the success banner when ?verified=1 (and profile not unverified)", async () => {
    searchParamsValue.set("verified", "1");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { emailVerified: true } }),
    });
    render(<EmailVerificationBanner />);
    await waitFor(() =>
      expect(
        screen.getByText(/email address has been verified/i)
      ).toBeInTheDocument()
    );
  });

  it("🎯 fails open: hides the banner when the profile lookup fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const { container } = render(<EmailVerificationBanner />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });

  it("resend button POSTs to /api/auth/verify-email and shows 'Sent'", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { emailVerified: false } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { verified: false } }),
      });

    render(<EmailVerificationBanner />);
    const btn = await screen.findByRole("button", {
      name: /resend verification email/i,
    });
    fireEvent.click(btn);
    await waitFor(() =>
      expect(screen.getByText(/sent — check your inbox/i)).toBeInTheDocument()
    );
    const lastCall = fetchMock.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe("/api/auth/verify-email");
    expect(lastCall?.[1]).toMatchObject({ method: "POST" });
  });

  it("shows the error message when the resend POST fails", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { emailVerified: false } }),
      })
      .mockRejectedValueOnce(new Error("offline"));

    render(<EmailVerificationBanner />);
    const btn = await screen.findByRole("button", {
      name: /resend verification email/i,
    });
    fireEvent.click(btn);
    await waitFor(() =>
      expect(screen.getByText(/couldn't send — try again/i)).toBeInTheDocument()
    );
  });
});
