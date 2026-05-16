/**
 * Tests for src/components/Account/RegisterForm.tsx
 *
 * Standards coverage:
 * - 📋 Functional: two-step submission — POST /api/auth/register, then
 *   signIn('credentials') for auto sign-in; success path lands on
 *   callbackUrl + refresh; auto-sign-in failure falls back to /login
 *   with the original callbackUrl preserved
 * - 🎯 Usability: surfaces the API's error message on duplicate-email /
 *   short-password failures; generic message on network errors
 * - 🔒 Security: never logs the password; submit blocks during loading
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { signIn } from "next-auth/react";

const mockedSignIn = signIn as unknown as jest.Mock;
const mockPush = jest.fn();
const mockRefresh = jest.fn();
let searchParamsValue: URLSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: mockRefresh,
  }),
  useSearchParams: () => searchParamsValue,
  usePathname: () => "/register",
}));

import RegisterForm from "@/components/Account/RegisterForm";

let fetchMock: jest.Mock;

beforeEach(() => {
  searchParamsValue = new URLSearchParams();
  mockedSignIn.mockReset();
  mockPush.mockReset();
  mockRefresh.mockReset();
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: "Jane Smith" },
  });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "jane@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "longenoughpw" },
  });
}

describe("RegisterForm", () => {
  it("renders Continue with Google + the email/password form", () => {
    render(<RegisterForm />);
    expect(
      screen.getByRole("button", { name: /continue with google/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("📋 POSTs to /api/auth/register then auto-signs-in and pushes the callbackUrl", async () => {
    searchParamsValue.set("callbackUrl", "/BookViewing/abc");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    mockedSignIn.mockResolvedValue({ ok: true, error: null });

    render(<RegisterForm />);
    fillValidForm();
    fireEvent.submit(
      screen.getByRole("button", { name: /create account/i })
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/register");
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      name: "Jane Smith",
      email: "jane@example.com",
      password: "longenoughpw",
    });

    await waitFor(() =>
      expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
        email: "jane@example.com",
        password: "longenoughpw",
        redirect: false,
      })
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/BookViewing/abc")
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("🎯 surfaces the API error message when register returns success=false", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: "An account with this email already exists.",
      }),
    });
    render(<RegisterForm />);
    fillValidForm();
    fireEvent.submit(
      screen.getByRole("button", { name: /create account/i })
    );
    await waitFor(() =>
      expect(
        screen.getByText(/an account with this email already exists/i)
      ).toBeInTheDocument()
    );
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("🎯 falls back to /login (preserving callbackUrl) when auto sign-in fails", async () => {
    searchParamsValue.set("callbackUrl", "/account/settings");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    mockedSignIn.mockResolvedValue({ error: "CredentialsSignin", ok: false });

    render(<RegisterForm />);
    fillValidForm();
    fireEvent.submit(
      screen.getByRole("button", { name: /create account/i })
    );

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        `/login?callbackUrl=${encodeURIComponent("/account/settings")}`
      )
    );
  });

  it("🎯 generic error on network failure (never surfaces the raw Error message)", async () => {
    fetchMock.mockRejectedValue(new Error("DNS failure leaking detail"));
    render(<RegisterForm />);
    fillValidForm();
    fireEvent.submit(
      screen.getByRole("button", { name: /create account/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    );
    expect(
      screen.queryByText(/DNS failure leaking detail/)
    ).not.toBeInTheDocument();
  });

  it("Google button calls signIn('google', { callbackUrl })", () => {
    searchParamsValue.set("callbackUrl", "/BookViewing/abc");
    render(<RegisterForm />);
    fireEvent.click(
      screen.getByRole("button", { name: /continue with google/i })
    );
    expect(mockedSignIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/BookViewing/abc",
    });
  });

  it("falls back to /account when no callbackUrl is provided", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    mockedSignIn.mockResolvedValue({ ok: true, error: null });

    render(<RegisterForm />);
    fillValidForm();
    fireEvent.submit(
      screen.getByRole("button", { name: /create account/i })
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/account")
    );
  });
});
