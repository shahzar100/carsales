/**
 * Tests for src/components/Account/BookingAuthGate.tsx
 *
 * Standards coverage:
 * - 🔒 Security: children render only for an authenticated session — the
 *   gate is the UX match for the auth-gated API routes (booking handlers
 *   reject unauthenticated POSTs anyway).
 * - 🎯 Usability: loading state shown while session resolves; sign-in /
 *   register CTAs both carry a callbackUrl back to the current path so
 *   the visitor lands back on the form after signing in.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";

// The global jest.setup.component.js mocks usePathname() as a plain
// function returning "/". Override it for this suite so we can vary the
// pathname per-test.
let mockedPathnameValue: string | null = "/BookCarViewing";
jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter() {
      return {
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      };
    },
    useSearchParams() {
      return new URLSearchParams();
    },
    usePathname() {
      return mockedPathnameValue;
    },
  };
});

import BookingAuthGate from "@/components/Account/BookingAuthGate";

const mockedUseSession = useSession as unknown as jest.Mock;

describe("BookingAuthGate", () => {
  beforeEach(() => {
    mockedUseSession.mockReset();
    mockedPathnameValue = "/BookCarViewing";
  });

  it("🎯 shows a loading spinner while the session is resolving", () => {
    mockedUseSession.mockReturnValue({ data: null, status: "loading" });
    render(
      <BookingAuthGate>
        <div data-testid="secret">protected form</div>
      </BookingAuthGate>
    );
    // sr-only fallback text is the testable signal here.
    expect(
      screen.getByText(/Checking your account/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId("secret")).not.toBeInTheDocument();
  });

  it("🔒 hides children and shows sign-in CTAs when unauthenticated", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    render(
      <BookingAuthGate>
        <div data-testid="secret">protected form</div>
      </BookingAuthGate>
    );
    expect(screen.queryByTestId("secret")).not.toBeInTheDocument();
    expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument();
  });

  it("🎯 sign-in and register CTAs carry the current pathname as callbackUrl", () => {
    mockedPathnameValue = "/BookViewing/abc123";
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    render(
      <BookingAuthGate>
        <div data-testid="secret">x</div>
      </BookingAuthGate>
    );
    const signIn = screen.getByText("Sign in").closest("a");
    const register = screen.getByText("Create an account").closest("a");
    const expectedCallback = encodeURIComponent("/BookViewing/abc123");
    expect(signIn).toHaveAttribute(
      "href",
      `/login?callbackUrl=${expectedCallback}`
    );
    expect(register).toHaveAttribute(
      "href",
      `/register?callbackUrl=${expectedCallback}`
    );
  });

  it("renders custom heading and message when provided", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    render(
      <BookingAuthGate
        heading="Custom Heading"
        message="Custom message body."
      >
        <div>x</div>
      </BookingAuthGate>
    );
    expect(screen.getByText("Custom Heading")).toBeInTheDocument();
    expect(screen.getByText("Custom message body.")).toBeInTheDocument();
  });

  it("falls back to '/' for callbackUrl when usePathname returns null", () => {
    mockedPathnameValue = null;
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    render(
      <BookingAuthGate>
        <div>x</div>
      </BookingAuthGate>
    );
    const signIn = screen.getByText("Sign in").closest("a");
    expect(signIn?.getAttribute("href")).toBe(
      `/login?callbackUrl=${encodeURIComponent("/")}`
    );
  });

  it("✅ renders children verbatim when authenticated", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { email: "u@example.com" } },
      status: "authenticated",
    });
    render(
      <BookingAuthGate>
        <div data-testid="secret">protected form</div>
      </BookingAuthGate>
    );
    expect(screen.getByTestId("secret")).toBeInTheDocument();
    expect(
      screen.queryByText(/sign in to continue/i)
    ).not.toBeInTheDocument();
  });
});
