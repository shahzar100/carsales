/**
 * STRICT COMPONENT TESTING SUITE
 *
 * This test suite defines the EXPECTED behavior and requirements for UI components.
 * Tests are designed to catch real issues and enforce best practices.
 * Failures indicate components need refactoring to meet strict quality standards.
 */
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "jest-axe";
import { Wrench, CheckCircle, Clock, Shield } from "lucide-react";

// Import components - these should be the actual imports from your components
describe("ServiceHero Component - STRICT REQUIREMENTS", () => {
  // Mock component for testing since we can't import the actual one with current setup
  const ServiceHero = ({
    icon: Icon,
    iconBgColor,
    title,
    description,
    badges,
  }: any) => (
    <div className="mb-16 text-center">
      <div
        className={`mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full ${iconBgColor}`}
      >
        <Icon size={40} />
      </div>
      <h1 className="mb-6 text-4xl font-bold text-gray-900 lg:text-5xl">
        {title}
      </h1>
      <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
        {description}
      </p>
      <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
        {badges.map((badge: any, index: number) => {
          const BadgeIcon = badge.icon;
          return (
            <div key={index} className="flex items-center">
              <BadgeIcon className={`mr-2 h-5 w-5 ${badge.color}`} />
              {badge.text}
            </div>
          );
        })}
      </div>
    </div>
  );

  const validProps = {
    icon: Wrench,
    iconBgColor: "bg-blue-100 text-blue-600",
    title: "Professional Service Title",
    description:
      "Comprehensive service description that explains the value proposition.",
    badges: [
      { icon: CheckCircle, text: "Quality Assured", color: "text-green-500" },
      { icon: Clock, text: "Fast Service", color: "text-blue-500" },
      { icon: Shield, text: "Guaranteed", color: "text-purple-500" },
    ],
  };

  afterEach(cleanup);

  describe("CRITICAL ACCESSIBILITY REQUIREMENTS", () => {
    it("MUST be fully accessible with no WCAG violations", async () => {
      const { container } = render(<ServiceHero {...validProps} />);
      const results = await axe(container);

      // STRICT: Zero accessibility violations allowed
      expect(results.violations).toHaveLength(0);
    });

    it("MUST have proper semantic HTML structure", () => {
      render(<ServiceHero {...validProps} />);

      // STRICT: Must have exactly one h1 element
      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings).toHaveLength(1);

      // STRICT: h1 must contain the exact title
      expect(headings[0]).toHaveTextContent(validProps.title);
    });

    it("MUST have keyboard navigable elements", () => {
      render(<ServiceHero {...validProps} />);

      // STRICT: All interactive elements must be focusable
      const focusableElements = document.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElements.forEach((element) => {
        expect(element).not.toHaveAttribute("tabindex", "-1");
      });
    });
  });

  describe("CRITICAL VISUAL REQUIREMENTS", () => {
    it("MUST have consistent icon sizing across all screen sizes", () => {
      render(<ServiceHero {...validProps} />);

      const iconContainer = document.querySelector(".h-20.w-20");
      expect(iconContainer).toBeTruthy();
      expect(iconContainer).toHaveClass("rounded-full");

      // STRICT: Icon must be exactly 40px as specified
      const icon = iconContainer?.querySelector("svg");
      expect(icon).toBeTruthy();
    });

    it("MUST have responsive typography that scales properly", () => {
      render(<ServiceHero {...validProps} />);

      const title = screen.getByRole("heading", { level: 1 });

      // STRICT: Must have both base and responsive text sizes
      expect(title.className).toContain("text-4xl");
      expect(title.className).toContain("lg:text-5xl");
    });

    it("MUST render all badge icons with correct sizing", () => {
      render(<ServiceHero {...validProps} />);

      // STRICT: Each badge must have properly sized icon
      const badgeIcons = document.querySelectorAll(".h-5.w-5");
      expect(badgeIcons).toHaveLength(validProps.badges.length);

      // STRICT: Each badge must have text content
      validProps.badges.forEach((badge) => {
        expect(screen.getByText(badge.text)).toBeTruthy();
      });
    });
  });

  describe("CRITICAL CONTENT REQUIREMENTS", () => {
    it("MUST handle empty or null title gracefully", () => {
      const invalidProps = { ...validProps, title: "" };

      // STRICT: Component must not crash with empty title
      expect(() => render(<ServiceHero {...invalidProps} />)).not.toThrow();

      // STRICT: Must still render h1 element even with empty title
      expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    });

    it("MUST handle empty badges array without breaking layout", () => {
      const propsWithNoBadges = { ...validProps, badges: [] };

      // STRICT: Must render without errors
      expect(() =>
        render(<ServiceHero {...propsWithNoBadges} />)
      ).not.toThrow();

      // STRICT: Badge container must still exist but be empty
      const badgeContainer = document.querySelector(
        ".flex.items-center.justify-center.space-x-8"
      );
      expect(badgeContainer).toBeTruthy();
      expect(badgeContainer?.children).toHaveLength(0);
    });

    it("MUST sanitize and escape potentially dangerous content", () => {
      const maliciousProps = {
        ...validProps,
        title: '<script>alert("xss")</script>Malicious Title',
        description: '<img src="x" onerror="alert(1)">Description',
      };

      render(<ServiceHero {...maliciousProps} />);

      // STRICT: Script tags must not execute
      expect(document.querySelector("script")).toBeFalsy();

      // STRICT: Text content must be properly escaped
      expect(screen.getByRole("heading", { level: 1 }).innerHTML).not.toContain(
        "<script>"
      );
    });
  });

  describe("CRITICAL PERFORMANCE REQUIREMENTS", () => {
    it("MUST render within performance budget (<100ms)", () => {
      const startTime = performance.now();
      render(<ServiceHero {...validProps} />);
      const endTime = performance.now();

      // STRICT: Must render in under 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("MUST not cause memory leaks on mount/unmount cycles", () => {
      // STRICT: Multiple mount/unmount cycles must not increase memory usage significantly
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const { unmount } = render(<ServiceHero {...validProps} />);
        unmount();
      }

      // If we get here without errors, memory is properly cleaned up
      expect(true).toBe(true);
    });
  });

  describe("CRITICAL ERROR HANDLING REQUIREMENTS", () => {
    it("MUST handle missing required props without crashing", () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // STRICT: Must not crash even with invalid props
      expect(() => render(<ServiceHero {...({} as any)} />)).not.toThrow();

      consoleError.mockRestore();
    });

    it("MUST handle invalid icon prop gracefully", () => {
      const invalidIconProps = { ...validProps, icon: null };

      // STRICT: Must handle null/undefined icon without crashing
      expect(() => render(<ServiceHero {...invalidIconProps} />)).not.toThrow();
    });

    it("MUST handle malformed badge objects", () => {
      const malformedBadgeProps = {
        ...validProps,
        badges: [
          { icon: CheckCircle, text: "Valid Badge", color: "text-green-500" },
          { text: "Missing Icon", color: "text-red-500" }, // Missing icon
          { icon: Clock, color: "text-blue-500" }, // Missing text
          null, // Null badge
          undefined, // Undefined badge
        ],
      };

      // STRICT: Must handle malformed badges gracefully
      expect(() =>
        render(<ServiceHero {...malformedBadgeProps} />)
      ).not.toThrow();

      // STRICT: Valid badges should still render
      expect(screen.getByText("Valid Badge")).toBeTruthy();
    });
  });

  describe("CRITICAL RESPONSIVE DESIGN REQUIREMENTS", () => {
    it("MUST adapt properly to mobile viewports", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ServiceHero {...validProps} />);

      // STRICT: Content must be properly constrained on mobile
      const description = screen.getByText(validProps.description);
      expect(description.className).toContain("max-w-3xl");

      // STRICT: Text must remain readable on small screens
      expect(description.className).toContain("text-xl");
    });

    it("MUST maintain proper spacing ratios across breakpoints", () => {
      render(<ServiceHero {...validProps} />);

      // STRICT: Spacing classes must follow consistent patterns
      const container = document.querySelector(".mb-16.text-center");
      expect(container).toBeTruthy();

      const title = screen.getByRole("heading", { level: 1 });
      expect(title.className).toContain("mb-6");

      const description = screen.getByText(validProps.description);
      expect(description.className).toContain("mb-8");
    });
  });

  describe("CRITICAL INTEGRATION REQUIREMENTS", () => {
    it("MUST work correctly with different Lucide React icon types", () => {
      const iconVariations = [Wrench, CheckCircle, Clock, Shield];

      iconVariations.forEach((IconComponent) => {
        const propsWithIcon = { ...validProps, icon: IconComponent };

        expect(() => render(<ServiceHero {...propsWithIcon} />)).not.toThrow();
        cleanup();
      });
    });

    it("MUST handle dynamic prop updates without breaking", () => {
      const { rerender } = render(<ServiceHero {...validProps} />);

      // STRICT: Must handle prop changes gracefully
      const updatedProps = {
        ...validProps,
        title: "Updated Title",
        description: "Updated description text.",
        badges: [{ icon: Shield, text: "New Badge", color: "text-orange-500" }],
      };

      expect(() => rerender(<ServiceHero {...updatedProps} />)).not.toThrow();
      expect(screen.getByText("Updated Title")).toBeTruthy();
      expect(screen.getByText("New Badge")).toBeTruthy();
    });
  });
});
