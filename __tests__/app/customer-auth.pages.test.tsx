/**
 * Tests for the customer auth-related page shells:
 *   src/app/(main)/login/page.tsx
 *   src/app/(main)/register/page.tsx
 *   src/app/(main)/forgot-password/page.tsx
 *   src/app/(main)/reset-password/page.tsx
 *   src/app/(main)/account/page.tsx
 *
 * These are mostly server-side auth gates that route to a client form.
 * Tests verify:
 * - 🔒 the redirect side of the gate (signed in → /account; signed out → /login)
 * - 📋 token shape gate on reset-password (64-hex, regex enforced server-side)
 * - 📋 AuthShell/AccountDashboard receive the right child / props
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockAuth = jest.fn();
const mockRedirect = jest.fn(() => {
  throw new Error("REDIRECTED");
});

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Replace each form with a stub so the test focuses on the page wrapper
// (the forms themselves have their own tests).
jest.mock("@/components/Account/LoginForm", () => ({
  __esModule: true,
  default: () => <div data-testid="login-form" />,
}));
jest.mock("@/components/Account/RegisterForm", () => ({
  __esModule: true,
  default: () => <div data-testid="register-form" />,
}));
jest.mock("@/components/Account/ForgotPasswordForm", () => ({
  __esModule: true,
  default: () => <div data-testid="forgot-form" />,
}));
let resetFormProps: any = null;
jest.mock("@/components/Account/ResetPasswordForm", () => ({
  __esModule: true,
  default: (props: { token: string }) => {
    resetFormProps = props;
    return <div data-testid="reset-form" />;
  },
}));
let dashboardProps: any = null;
jest.mock("@/components/Account/AccountDashboard", () => ({
  __esModule: true,
  default: (props: { user: unknown }) => {
    dashboardProps = props;
    return <div data-testid="account-dashboard" />;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  resetFormProps = null;
  dashboardProps = null;
});

// ── LOGIN ─────────────────────────────────────────────────────
describe("(main)/login page", () => {
  it("🔒 signed-in users get redirected to /account (form is not rendered)", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@example.test" } });
    const LoginPage = (await import("@/app/(main)/login/page")).default;
    await expect(LoginPage()).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/account");
  });

  it("📋 signed-out users see the LoginForm inside AuthShell", async () => {
    mockAuth.mockResolvedValue(null);
    const LoginPage = (await import("@/app/(main)/login/page")).default;
    const ui = await LoginPage();
    render(ui);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    // Footer link to /register present.
    const reg = screen.getByText(/create an account/i).closest("a");
    expect(reg).toHaveAttribute("href", "/register");
  });
});

// ── REGISTER ──────────────────────────────────────────────────
describe("(main)/register page", () => {
  it("🔒 signed-in users get redirected to /account", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@example.test" } });
    const RegisterPage = (await import("@/app/(main)/register/page")).default;
    await expect(RegisterPage()).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/account");
  });

  it("📋 signed-out users see RegisterForm inside AuthShell + 'Sign in' footer", async () => {
    mockAuth.mockResolvedValue(null);
    const RegisterPage = (await import("@/app/(main)/register/page")).default;
    const ui = await RegisterPage();
    render(ui);
    expect(screen.getByTestId("register-form")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /create an account/i })
    ).toBeInTheDocument();
    const signin = screen.getByText(/sign in/i).closest("a");
    expect(signin).toHaveAttribute("href", "/login");
  });
});

// ── FORGOT-PASSWORD ──────────────────────────────────────────
describe("(main)/forgot-password page", () => {
  it("📋 always renders the ForgotPasswordForm inside AuthShell", async () => {
    const ForgotPage = (await import("@/app/(main)/forgot-password/page"))
      .default;
    const ui = ForgotPage();
    render(ui);
    expect(screen.getByTestId("forgot-form")).toBeInTheDocument();
    expect(screen.getByText(/forgot your password\?/i)).toBeInTheDocument();
    const back = screen.getByText(/back to sign in/i).closest("a");
    expect(back).toHaveAttribute("href", "/login");
  });
});

// ── RESET-PASSWORD ───────────────────────────────────────────
describe("(main)/reset-password page", () => {
  const validToken = "a".repeat(64); // 64 hex chars

  it("🔒 missing token → invalid-link error block, NOT the form", async () => {
    const ResetPage = (await import("@/app/(main)/reset-password/page"))
      .default;
    const ui = await ResetPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(screen.getByText(/this reset link is invalid/i)).toBeInTheDocument();
    expect(screen.queryByTestId("reset-form")).not.toBeInTheDocument();
  });

  it("🔒 malformed token (not 64-hex) → invalid-link error block", async () => {
    const ResetPage = (await import("@/app/(main)/reset-password/page"))
      .default;
    const ui = await ResetPage({
      searchParams: Promise.resolve({ token: "not-hex-not-64-long" }),
    });
    render(ui);
    expect(screen.getByText(/this reset link is invalid/i)).toBeInTheDocument();
    expect(screen.queryByTestId("reset-form")).not.toBeInTheDocument();
  });

  it("📋 valid token → ResetPasswordForm receives `token` prop", async () => {
    const ResetPage = (await import("@/app/(main)/reset-password/page"))
      .default;
    const ui = await ResetPage({
      searchParams: Promise.resolve({ token: validToken }),
    });
    render(ui);
    expect(screen.getByTestId("reset-form")).toBeInTheDocument();
    expect(resetFormProps).toEqual({ token: validToken });
    expect(
      screen.queryByText(/this reset link is invalid/i)
    ).not.toBeInTheDocument();
  });
});

// ── ACCOUNT ──────────────────────────────────────────────────
describe("(main)/account page", () => {
  it("🔒 signed-out → redirect to /login?callbackUrl=/account", async () => {
    mockAuth.mockResolvedValue(null);
    const AccountPage = (await import("@/app/(main)/account/page")).default;
    await expect(AccountPage()).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/login?callbackUrl=/account");
  });

  it("📋 signed-in → AccountDashboard receives the session user", async () => {
    mockAuth.mockResolvedValue({
      user: { name: "Alice", email: "alice@example.test" },
    });
    const AccountPage = (await import("@/app/(main)/account/page")).default;
    const ui = await AccountPage();
    render(ui);
    expect(screen.getByTestId("account-dashboard")).toBeInTheDocument();
    expect(dashboardProps).toEqual({
      user: { name: "Alice", email: "alice@example.test" },
    });
  });
});
