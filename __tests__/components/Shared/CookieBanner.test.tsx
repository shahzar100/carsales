/**
 * Tests for src/components/Shared/CookieBanner.tsx
 *
 * Standards coverage:
 * - 📋 Functional: shown only when consent isn't yet stored; Accept all /
 *   Reject all / Save custom persist both the coarse `cookie-consent` flag
 *   and the per-category `cookie-preferences` JSON
 * - 🔒 Security: necessary cookies are always on and can't be toggled
 *   off; Escape key persists `rejected` (fail-safe — don't grant consent
 *   from a missed click)
 * - 🎯 Usability: hidden once a choice has been made (no re-prompting)
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CookieBanner from "@/components/Shared/CookieBanner";

beforeEach(() => {
  localStorage.clear();
});

describe("CookieBanner", () => {
  it("renders when no consent is stored", () => {
    render(<CookieBanner />);
    expect(screen.getByText(/we use cookies/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /accept all/i })
    ).toBeInTheDocument();
  });

  it("🎯 hides itself when consent is already stored", () => {
    localStorage.setItem("cookie-consent", "accepted");
    const { container } = render(<CookieBanner />);
    expect(container.textContent).toBe("");
  });

  it("📋 Accept all persists 'accepted' and all categories=true", () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole("button", { name: /accept all/i }));
    expect(localStorage.getItem("cookie-consent")).toBe("accepted");
    const prefs = JSON.parse(
      localStorage.getItem("cookie-preferences") ?? "{}"
    );
    expect(prefs).toMatchObject({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      version: 1,
    });
    expect(prefs.timestamp).toEqual(expect.any(String));
  });

  it("🔒 Reject all persists 'rejected' with only necessary=true", () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole("button", { name: /reject all/i }));
    expect(localStorage.getItem("cookie-consent")).toBe("rejected");
    const prefs = JSON.parse(
      localStorage.getItem("cookie-preferences") ?? "{}"
    );
    expect(prefs).toMatchObject({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  });

  it("📋 opens the per-category panel when Customize is clicked", () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole("button", { name: /customize/i }));
    expect(
      screen.getByText(/cookie preferences/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/functional cookies/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/analytics cookies/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/marketing cookies/i)
    ).toBeInTheDocument();
  });

  it("🔒 the 'necessary' toggle is checked and disabled (always on)", () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole("button", { name: /customize/i }));
    const necessary = screen.getByLabelText(
      /strictly necessary cookies/i
    ) as HTMLInputElement;
    expect(necessary).toBeChecked();
    expect(necessary).toBeDisabled();
  });

  it("📋 toggling analytics flips its checkbox", () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole("button", { name: /customize/i }));
    const analytics = screen.getByLabelText(
      /analytics cookies/i
    ) as HTMLInputElement;
    expect(analytics).not.toBeChecked();
    fireEvent.click(analytics);
    expect(analytics).toBeChecked();
  });

  it("📋 Save preferences persists 'customized' + selected categories", () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole("button", { name: /customize/i }));
    fireEvent.click(screen.getByLabelText(/analytics cookies/i));
    fireEvent.click(
      screen.getByRole("button", { name: /save preferences/i })
    );
    expect(localStorage.getItem("cookie-consent")).toBe("customized");
    const prefs = JSON.parse(
      localStorage.getItem("cookie-preferences") ?? "{}"
    );
    expect(prefs).toMatchObject({
      necessary: true,
      analytics: true,
      functional: false,
      marketing: false,
    });
  });

  it("🔒 Escape key fail-safe rejects all (Day 4 — never grant consent from a missed click)", () => {
    render(<CookieBanner />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(localStorage.getItem("cookie-consent")).toBe("rejected");
  });

  it("🎯 has dialog semantics with the title as the labelled-by target", () => {
    render(<CookieBanner />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute(
      "aria-labelledby",
      "cookie-banner-title"
    );
  });

  it("renders the Privacy Policy link inside the body copy", () => {
    render(<CookieBanner />);
    const link = screen.getByText(/read our privacy policy/i).closest("a");
    expect(link).toHaveAttribute("href", "/privacy");
  });
});
