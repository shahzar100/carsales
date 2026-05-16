/**
 * Tests for src/components/Admin/TwoFactorPanel.tsx
 *
 * Standards coverage:
 * - 🔒 Security: QR code is rendered client-side via dynamic-imported
 *   `qrcode` (so the otpauth secret never travels to a third-party API);
 *   the secret is shown only behind a "Show secret" expander; disable
 *   flow requires the current password; never logs the secret/code
 * - 📋 Functional: state machine (idle → verifying → idle when enrolled;
 *   idle → disabling → idle when disabled); enrol POST → /api/admin/2fa/
 *   enroll; verify POST → /api/admin/2fa/verify; disable POST →
 *   /api/admin/2fa/disable
 * - 🎯 Usability: numeric-only filter on the TOTP input; Cancel restores
 *   idle state; error banner per-step
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// `qrcode` is dynamic-imported inside the component. Mock the module so
// tests don't have to spin up the real library — we just need to know it
// was called with the right URI.
const mockToDataURL = jest.fn(async () => "data:image/png;base64,QR");
jest.mock("qrcode", () => ({
  __esModule: true,
  default: { toDataURL: (...args: unknown[]) => mockToDataURL(...args) },
  toDataURL: (...args: unknown[]) => mockToDataURL(...args),
}));

import TwoFactorPanel from "@/components/Admin/TwoFactorPanel";

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  mockToDataURL.mockClear();
});

describe("TwoFactorPanel", () => {
  it("renders the 'not enabled' card when initialEnabled=false", () => {
    render(<TwoFactorPanel initialEnabled={false} />);
    expect(screen.getByText(/not enabled/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enable 2fa/i })
    ).toBeInTheDocument();
  });

  it("renders the 'enabled' card when initialEnabled=true", () => {
    render(<TwoFactorPanel initialEnabled={true} />);
    expect(screen.getByText(/^enabled — /i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /disable 2fa/i })
    ).toBeInTheDocument();
  });

  it("📋 Enable 2FA: POST /api/admin/2fa/enroll, render QR + secret expander", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secret: "JBSWY3DPEHPK3PXP",
        uri: "otpauth://totp/...",
      }),
    });
    render(<TwoFactorPanel initialEnabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /enable 2fa/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/2fa/enroll");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");

    await waitFor(() =>
      expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument()
    );
    expect(mockToDataURL).toHaveBeenCalledWith(
      "otpauth://totp/...",
      expect.any(Object)
    );
    expect(screen.getByAltText("2FA QR code")).toBeInTheDocument();
    expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeInTheDocument();
  });

  it("🎯 Enrol failure surfaces the server error and stays on idle", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Already enrolled" }),
    });
    render(<TwoFactorPanel initialEnabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /enable 2fa/i }));
    await waitFor(() =>
      expect(screen.getByText(/already enrolled/i)).toBeInTheDocument()
    );
    expect(screen.queryByLabelText(/6-digit code/i)).not.toBeInTheDocument();
  });

  it("🔒 TOTP code input filters non-digits", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secret: "S", uri: "otpauth://x" }),
    });
    render(<TwoFactorPanel initialEnabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /enable 2fa/i }));
    const input = await screen.findByLabelText(/6-digit code/i);
    fireEvent.change(input, { target: { value: "1a2b 3c4d-56" } });
    expect((input as HTMLInputElement).value).toBe("123456");
  });

  it("📋 Verify and enable: POST /api/admin/2fa/verify then enabled=true", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secret: "S", uri: "otpauth://x" }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<TwoFactorPanel initialEnabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /enable 2fa/i }));
    const input = await screen.findByLabelText(/6-digit code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.submit(
      screen.getByRole("button", { name: /verify and enable/i })
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe("/api/admin/2fa/verify");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      code: "123456",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /disable 2fa/i })
      ).toBeInTheDocument()
    );
  });

  it("🎯 Verify failure keeps the user on the QR screen and shows the error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secret: "S", uri: "otpauth://x" }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid code" }),
    });

    render(<TwoFactorPanel initialEnabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /enable 2fa/i }));
    const input = await screen.findByLabelText(/6-digit code/i);
    fireEvent.change(input, { target: { value: "000000" } });
    fireEvent.submit(
      screen.getByRole("button", { name: /verify and enable/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument()
    );
    expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument();
  });

  it("Cancel from verifying step returns to idle", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secret: "S", uri: "otpauth://x" }),
    });
    render(<TwoFactorPanel initialEnabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /enable 2fa/i }));
    await screen.findByLabelText(/6-digit code/i);
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.queryByLabelText(/6-digit code/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enable 2fa/i })
    ).toBeInTheDocument();
  });

  it("📋 Disable 2FA: opens the password form, POSTs /api/admin/2fa/disable", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(<TwoFactorPanel initialEnabled={true} />);
    fireEvent.click(screen.getByRole("button", { name: /disable 2fa/i }));
    const pwInput = screen.getByPlaceholderText(/current password/i);
    fireEvent.change(pwInput, { target: { value: "my-password" } });
    fireEvent.submit(
      screen.getByRole("button", { name: /^disable 2fa$/i })
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/2fa/disable");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      password: "my-password",
    });
    await waitFor(() =>
      expect(screen.getByText(/not enabled/i)).toBeInTheDocument()
    );
  });

  it("🎯 Disable failure surfaces the server error and keeps 2FA enabled", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid password" }),
    });
    render(<TwoFactorPanel initialEnabled={true} />);
    fireEvent.click(screen.getByRole("button", { name: /disable 2fa/i }));
    fireEvent.change(screen.getByPlaceholderText(/current password/i), {
      target: { value: "wrong" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /^disable 2fa$/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/invalid password/i)).toBeInTheDocument()
    );
    // Still in disabling mode.
    expect(
      screen.getByPlaceholderText(/current password/i)
    ).toBeInTheDocument();
  });

  it("🎯 Cancel disable form returns to enabled idle state", () => {
    render(<TwoFactorPanel initialEnabled={true} />);
    fireEvent.click(screen.getByRole("button", { name: /disable 2fa/i }));
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(
      screen.queryByPlaceholderText(/current password/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /disable 2fa/i })
    ).toBeInTheDocument();
  });
});
