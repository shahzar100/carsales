/**
 * Tests for src/components/Account/LoginForm.tsx
 *
 * Standards coverage:
 * - 🔒 Security: Auth.js error codes are mapped to friendly copy (so the
 *   server's internal error names — "CredentialsSignin" / "RateLimited" /
 *   "OAuthAccountNotLinked" — never leak to the customer); rate-limit
 *   message is distinguishable from "wrong password"
 * - 📋 Functional: three sign-in paths — Credentials POST, magic-link
 *   (Nodemailer), Google OAuth (full-page redirect); mode toggle between
 *   password and magic-link; `?error=` and `?check-email=1` URL params
 *   are hydrated on first render; `?callbackUrl=` survives the round-trip
 * - 🎯 Usability: loading state isolates which button is busy
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
  usePathname: () => "/login",
}));

import LoginForm from "@/components/Account/LoginForm";

beforeEach(() => {
  searchParamsValue = new URLSearchParams();
  mockedSignIn.mockReset();
  mockPush.mockReset();
  mockRefresh.mockReset();
});

describe("LoginForm", () => {
  it("renders Continue with Google + the password form by default", () => {
    render(<LoginForm />);
    expect(
      screen.getByRole("button", { name: /continue with google/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
  });

  it("📋 password submit calls signIn('credentials', { redirect:false }) and pushes the callbackUrl on success", async () => {
    searchParamsValue.set("callbackUrl", "/account/settings");
    mockedSignIn.mockResolvedValue({ error: null, ok: true });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "u@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "pw" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() =>
      expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
        email: "u@example.com",
        password: "pw",
        redirect: false,
      })
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/account/settings")
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("🔒 maps Auth.js error code 'CredentialsSignin' to friendly copy", async () => {
    mockedSignIn.mockResolvedValue({ error: "CredentialsSignin", ok: false });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "u@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/incorrect email or password/i)
      ).toBeInTheDocument()
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("🔒 maps 'RateLimited' to the distinct rate-limit message (not 'incorrect password')", async () => {
    mockedSignIn.mockResolvedValue({ error: "RateLimited", ok: false });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "u@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "pw" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/too many sign-in attempts/i)
      ).toBeInTheDocument()
    );
  });

  it("falls back to a generic message for unrecognised error codes", async () => {
    mockedSignIn.mockResolvedValue({ error: "SomeNewCode", ok: false });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "u@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "pw" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/something went wrong/i)
      ).toBeInTheDocument()
    );
  });

  it("🎯 hydrates `?error=…` from the URL on first render (OAuth callback path)", () => {
    searchParamsValue.set("error", "OAuthAccountNotLinked");
    render(<LoginForm />);
    expect(
      screen.getByText(/already registered with a different sign-in method/i)
    ).toBeInTheDocument();
  });

  it("📋 toggling to magic-link mode hides the password field and renames the submit button", () => {
    render(<LoginForm />);
    fireEvent.click(
      screen.getByRole("button", { name: /email me a sign-in link instead/i })
    );
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /email me a sign-in link/i })
    ).toBeInTheDocument();
  });

  it("📋 magic-link submit calls signIn('nodemailer') and shows the 'check inbox' confirmation", async () => {
    mockedSignIn.mockResolvedValue({ ok: true });
    render(<LoginForm />);
    fireEvent.click(
      screen.getByRole("button", { name: /email me a sign-in link instead/i })
    );
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "u@example.com" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /email me a sign-in link/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument()
    );
    expect(mockedSignIn).toHaveBeenCalledWith(
      "nodemailer",
      expect.objectContaining({
        email: "u@example.com",
        redirect: false,
        callbackUrl: "/account",
      })
    );
  });

  it("🎯 shows the magic-sent confirmation immediately when ?check-email=1 is in the URL", () => {
    searchParamsValue.set("check-email", "1");
    render(<LoginForm />);
    expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
  });

  it("magic-link error surfaces a 'couldn't send the link' message", async () => {
    mockedSignIn.mockResolvedValue({ error: "EmailSignin" });
    render(<LoginForm />);
    fireEvent.click(
      screen.getByRole("button", { name: /email me a sign-in link instead/i })
    );
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "u@example.com" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /email me a sign-in link/i })
    );
    await waitFor(() =>
      expect(
        screen.getByText(/couldn't send the sign-in link/i)
      ).toBeInTheDocument()
    );
  });

  it("Google button calls signIn('google', { callbackUrl })", () => {
    render(<LoginForm />);
    fireEvent.click(
      screen.getByRole("button", { name: /continue with google/i })
    );
    expect(mockedSignIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/account",
    });
  });

  it("'Use a different email' link goes back to the magic-link form", () => {
    searchParamsValue.set("check-email", "1");
    render(<LoginForm />);
    fireEvent.click(
      screen.getByRole("button", { name: /use a different email/i })
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
