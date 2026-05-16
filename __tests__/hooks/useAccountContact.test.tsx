/**
 * Tests for src/hooks/useAccountContact.ts
 *
 * Standards coverage:
 * - 📋 Functional: hook returns session name/email, falling back to ""
 * - 🔒 Security: the value comes from useSession(), never from local input —
 *   so a stale form state can't trick the server into mis-attributing a booking
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useAccountContact } from "@/hooks/useAccountContact";

// next-auth/react is globally mocked in jest.setup.component.js; we just
// override the per-test return value via `useSession`.
const mockedUseSession = useSession as unknown as jest.Mock;

function Probe() {
  const { name, email } = useAccountContact();
  return (
    <div>
      <span data-testid="name">{name}</span>
      <span data-testid="email">{email}</span>
    </div>
  );
}

describe("useAccountContact", () => {
  beforeEach(() => {
    mockedUseSession.mockReset();
  });

  it("returns empty strings when there is no session yet", () => {
    mockedUseSession.mockReturnValue({ data: null, status: "loading" });
    render(<Probe />);
    expect(screen.getByTestId("name")).toHaveTextContent("");
    expect(screen.getByTestId("email")).toHaveTextContent("");
  });

  it("returns name and email when a session is present", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "Jane Doe", email: "jane@example.com" } },
      status: "authenticated",
    });
    render(<Probe />);
    expect(screen.getByTestId("name")).toHaveTextContent("Jane Doe");
    expect(screen.getByTestId("email")).toHaveTextContent("jane@example.com");
  });

  it("falls back to '' for either field independently", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { email: "x@example.com" } },
      status: "authenticated",
    });
    render(<Probe />);
    expect(screen.getByTestId("name")).toHaveTextContent("");
    expect(screen.getByTestId("email")).toHaveTextContent("x@example.com");
  });

  it("does not crash when the user object is missing entirely", () => {
    mockedUseSession.mockReturnValue({ data: {}, status: "authenticated" });
    expect(() => render(<Probe />)).not.toThrow();
    expect(screen.getByTestId("name")).toHaveTextContent("");
    expect(screen.getByTestId("email")).toHaveTextContent("");
  });
});
