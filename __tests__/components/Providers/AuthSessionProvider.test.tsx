/**
 * Tests for src/components/Providers/AuthSessionProvider.tsx
 *
 * Standards coverage:
 * - 📋 Functional: pass-through wrapper around next-auth's SessionProvider
 *   that owns the `"use client"` directive (so importing it into a server
 *   layout doesn't trip the client/server boundary). Just verify it
 *   renders children — anything more is testing next-auth itself.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import AuthSessionProvider from "@/components/Providers/AuthSessionProvider";

describe("AuthSessionProvider", () => {
  it("renders children inside the SessionProvider", () => {
    render(
      <AuthSessionProvider>
        <div data-testid="child">child</div>
      </AuthSessionProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
