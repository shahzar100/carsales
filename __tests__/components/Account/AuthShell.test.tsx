/**
 * Tests for src/components/Account/AuthShell.tsx
 *
 * Standards coverage:
 * - 📋 Functional: title/subtitle render, children slot renders inside the
 *   card, footer link href is wired through
 * - 🎯 Usability: footer prompt + linkText are read together so screen
 *   readers see "Need an account? Create one →" not "Need an account?"
 *   then a disconnected "Create one".
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import AuthShell from "@/components/Account/AuthShell";

describe("AuthShell", () => {
  it("renders title and subtitle", () => {
    render(
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to continue"
        footer={{ prompt: "Need an account?", linkText: "Register", href: "/register" }}
      >
        <div>form</div>
      </AuthShell>
    );
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
  });

  it("renders children inside the card slot", () => {
    render(
      <AuthShell
        title="x"
        subtitle="y"
        footer={{ prompt: "z", linkText: "a", href: "/" }}
      >
        <form data-testid="inner-form">hello</form>
      </AuthShell>
    );
    expect(screen.getByTestId("inner-form")).toBeInTheDocument();
  });

  it("renders the footer prompt and a link with the right href", () => {
    render(
      <AuthShell
        title="t"
        subtitle="s"
        footer={{
          prompt: "Need an account?",
          linkText: "Create one",
          href: "/register",
        }}
      >
        <div />
      </AuthShell>
    );
    expect(screen.getByText("Need an account?")).toBeInTheDocument();
    const link = screen.getByText("Create one").closest("a");
    expect(link).toHaveAttribute("href", "/register");
  });
});
