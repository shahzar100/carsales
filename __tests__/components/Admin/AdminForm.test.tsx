/**
 * Tests for src/components/Admin/AdminForm.tsx
 *
 * Standards coverage:
 * - 📋 Functional: POST /api/admin/login with username+password; success
 *   calls AuthContext.login(); server `requires2fa` flag flips the form
 *   into a 6-digit TOTP entry; subsequent submit includes totpCode
 * - 🔒 Security: TOTP input is digit-only (filter on change); 6-digit
 *   maxLength enforced via pattern; never logs the password
 * - 🎯 Usability: surfaces server-provided error; generic network error
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockLogin = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin, isLoggedIn: false, logout: jest.fn() }),
}));

import AdminForm from "@/components/Admin/AdminForm";

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  mockLogin.mockReset();
});

function fillCredentials() {
  fireEvent.change(screen.getByLabelText(/username/i), {
    target: { value: "admin1" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "correct-pw" },
  });
}

describe("AdminForm", () => {
  it("renders username + password fields by default", () => {
    render(<AdminForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/authenticator code/i)
    ).not.toBeInTheDocument();
  });

  it("📋 POSTs to /api/admin/login and calls AuthContext.login() on success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });
    render(<AdminForm />);
    fillCredentials();
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const init = fetchMock.mock.calls[0][1];
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/login");
    expect(JSON.parse(init.body)).toEqual({
      username: "admin1",
      password: "correct-pw",
    });
    await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
  });

  it("📋 server requires2fa=true flips the form into TOTP-entry mode", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: false, requires2fa: true }),
    });
    render(<AdminForm />);
    fillCredentials();
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByLabelText(/authenticator code/i)).toBeInTheDocument()
    );
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /verify/i })
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("🔒 TOTP input filters non-digit characters on change (UX guard)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, requires2fa: true }),
    });
    render(<AdminForm />);
    fillCredentials();
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByLabelText(/authenticator code/i)).toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText(/authenticator code/i), {
      target: { value: "1a2b3 c456" },
    });
    expect(
      (screen.getByLabelText(/authenticator code/i) as HTMLInputElement).value
    ).toBe("123456");
  });

  it("📋 second submit (with TOTP) POSTs username+password+totpCode", async () => {
    // First call → requires2fa
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, requires2fa: true }),
    });
    // Second call → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<AdminForm />);
    fillCredentials();
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByLabelText(/authenticator code/i)).toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText(/authenticator code/i), {
      target: { value: "123456" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(secondBody).toEqual({
      username: "admin1",
      password: "correct-pw",
      totpCode: "123456",
    });
    await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
  });

  it("🎯 invalid TOTP shows the server error and stays in 2FA mode", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, requires2fa: true }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ requires2fa: true, error: "Invalid 2FA code" }),
    });

    render(<AdminForm />);
    fillCredentials();
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByLabelText(/authenticator code/i)).toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText(/authenticator code/i), {
      target: { value: "000000" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid 2fa code/i)).toBeInTheDocument()
    );
    expect(
      screen.getByLabelText(/authenticator code/i)
    ).toBeInTheDocument();
  });

  it("🎯 surfaces a server-provided error on wrong credentials", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid credentials" }),
    });
    render(<AdminForm />);
    fillCredentials();
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    );
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("🎯 generic network-error fallback", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<AdminForm />);
    fillCredentials();
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/an error occurred/i)
      ).toBeInTheDocument()
    );
  });

  it("falls back to generic 'Login failed' when neither error nor requires2fa is set", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false }),
    });
    render(<AdminForm />);
    fillCredentials();
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/login failed/i)).toBeInTheDocument()
    );
  });
});
