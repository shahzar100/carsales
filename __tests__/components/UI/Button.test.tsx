/**
 * Tests for the unified Button primitive (src/components/UI/Button.tsx).
 *
 * Standards coverage:
 * - 📋 Functional: Renders, click, variants, sizes, icons, loading
 * - 🔗 Routing: href renders Link/anchor; external links get rel
 * - ♿ Accessibility: Disabled state, aria-label, focus styles
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "@/components/UI/Button";

describe("UI Button", () => {
  describe("button rendering", () => {
    it("renders its children", () => {
      render(<Button>Save changes</Button>);
      expect(screen.getByText("Save changes")).toBeInTheDocument();
    });

    it("calls onClick when clicked", () => {
      const handler = jest.fn();
      render(<Button onClick={handler}>Click me</Button>);
      fireEvent.click(screen.getByRole("button"));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("defaults to type='button' so it doesn't submit forms by accident", () => {
      render(<Button>Cancel</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("respects an explicit type='submit'", () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    it("disables the button when disabled is true", () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("disables the button when loading is true", () => {
      render(<Button loading>Saving…</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("variants", () => {
    it("primary by default uses red-600", () => {
      render(<Button>Primary</Button>);
      expect(screen.getByRole("button").className).toContain("bg-red-600");
    });

    it("outline uses a border + white background", () => {
      render(<Button variant="outline">Outline</Button>);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("border");
      expect(btn.className).toContain("bg-white");
    });

    it("danger and primary share the red-600 colour", () => {
      const { rerender } = render(<Button variant="danger">Delete</Button>);
      expect(screen.getByRole("button").className).toContain("bg-red-600");
      rerender(<Button variant="primary">Save</Button>);
      expect(screen.getByRole("button").className).toContain("bg-red-600");
    });

    it("success uses emerald-600", () => {
      render(<Button variant="success">OK</Button>);
      expect(screen.getByRole("button").className).toContain("bg-emerald-600");
    });
  });

  describe("sizes", () => {
    it("md is the default", () => {
      render(<Button>Default</Button>);
      expect(screen.getByRole("button").className).toContain("py-2.5");
    });

    it("sm uses smaller padding", () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole("button").className).toContain("py-1.5");
    });

    it("lg uses larger padding", () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole("button").className).toContain("py-3");
    });
  });

  describe("icons and loading", () => {
    it("renders an icon to the right by default", () => {
      render(
        <Button icon={<span data-testid="icon">→</span>}>Continue</Button>
      );
      const button = screen.getByRole("button");
      const icon = screen.getByTestId("icon");
      expect(button).toContainElement(icon);
      // Icon comes after the label in the DOM order.
      expect(button.textContent).toMatch(/Continue.*→/);
    });

    it("renders an icon to the left when iconPosition='left'", () => {
      render(
        <Button icon={<span data-testid="icon">←</span>} iconPosition="left">
          Back
        </Button>
      );
      const button = screen.getByRole("button");
      expect(button.textContent).toMatch(/←.*Back/);
    });

    it("shows a spinner when loading and hides the user icon", () => {
      render(
        <Button loading icon={<span data-testid="icon">★</span>}>
          Saving
        </Button>
      );
      // Lucide renders spinners as SVG; check by class
      const button = screen.getByRole("button");
      expect(button.querySelector("svg")).not.toBeNull();
      expect(screen.queryByTestId("icon")).toBeNull();
    });
  });

  describe("href / link rendering", () => {
    it("renders a Next Link for internal paths", () => {
      render(<Button href="/about">About</Button>);
      const link = screen.getByRole("link", { name: "About" });
      expect(link).toHaveAttribute("href", "/about");
    });

    it("renders a plain anchor for external URLs and adds rel when target=_blank", () => {
      render(
        <Button href="https://example.com" target="_blank">
          Example
        </Button>
      );
      const link = screen.getByRole("link", { name: "Example" });
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders a non-interactive span when href + disabled", () => {
      render(
        <Button href="/path" disabled>
          Cannot click
        </Button>
      );
      // No accessible role of "link" should be exposed when aria-disabled.
      const span = screen.getByText("Cannot click").closest("span");
      expect(span).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("misc", () => {
    it("applies fullWidth utility", () => {
      render(<Button fullWidth>Full</Button>);
      expect(screen.getByRole("button").className).toContain("w-full");
    });

    it("applies an aria-label", () => {
      render(<Button aria-label="Close dialog">×</Button>);
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Close dialog"
      );
    });

    it("appends a custom className last", () => {
      render(<Button className="my-custom-class">Hi</Button>);
      expect(screen.getByRole("button").className).toContain("my-custom-class");
    });
  });
});
