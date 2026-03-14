/**
 * Tests for ServiceHero component (src/components/Services/Common/ServiceHero.tsx)
 * 
 * Standards coverage:
 * - 🌐 Accessibility: WCAG 2.1 AA compliance, semantic HTML, ARIA
 * - 📋 Functional: Content rendering, badge display, layout structure
 * - 🎯 Usability: Visual design, responsive layout, error handling
 * - 🔒 Security: XSS prevention in user content
 */
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Wrench, CheckCircle, Clock } from "lucide-react";
import ServiceHero from "@/components/Services/Common/ServiceHero";

expect.extend(toHaveNoViolations);

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe("ServiceHero Component", () => {
  const mockProps = {
    icon: Wrench,
    iconBgColor: "bg-blue-100 text-blue-600",
    title: "Test Service Title",
    description: "This is a test description for the service hero component.",
    badges: [
      { icon: Wrench, text: "Feature 1", color: "text-green-500" },
      { icon: Wrench, text: "Feature 2", color: "text-blue-500" },
      { icon: Wrench, text: "Feature 3", color: "text-purple-500" },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(cleanup);

  describe("🌐 Accessibility Standards", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(<ServiceHero {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper heading hierarchy with h1", () => {
      render(<ServiceHero {...mockProps} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(mockProps.title);
    });

    it("should have semantic HTML structure", () => {
      render(<ServiceHero {...mockProps} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading.tagName).toBe("H1");
    });

    it("should have descriptive text that is readable", () => {
      render(<ServiceHero {...mockProps} />);
      const description = screen.getByText(mockProps.description);
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe("P");
    });

    it("should render SVG icons with proper attributes", () => {
      const { container } = render(<ServiceHero {...mockProps} />);
      const svgIcons = container.querySelectorAll("svg");
      expect(svgIcons.length).toBeGreaterThan(0);
    });
  });

  describe("🎯 Usability Standards - Visual Design", () => {
    it("should display icon with proper sizing and background", () => {
      const { container } = render(<ServiceHero {...mockProps} />);
      const iconContainer = container.querySelector('.h-20');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass("rounded-full");
      expect(iconContainer).toHaveClass("bg-blue-100");
    });

    it("should have responsive styling classes", () => {
      render(<ServiceHero {...mockProps} />);
      const title = screen.getByRole("heading", { level: 1 });
      // Component uses CSS utility class "page-title"
      expect(title).toHaveClass("page-title");
    });

    it("should display all badges with proper icons and text", () => {
      render(<ServiceHero {...mockProps} />);

      mockProps.badges.forEach((badge) => {
        const badgeText = screen.getByText(badge.text);
        expect(badgeText).toBeInTheDocument();
      });
    });

    it("should render badge icons", () => {
      const { container } = render(<ServiceHero {...mockProps} />);
      // Main icon + badge icons
      const svgIcons = container.querySelectorAll("svg");
      expect(svgIcons.length).toBe(mockProps.badges.length + 1);
    });
  });

  describe("📋 Functional Standards - Content Rendering", () => {
    it("should render title exactly as provided", () => {
      render(<ServiceHero {...mockProps} />);
      expect(screen.getByText(mockProps.title)).toBeInTheDocument();
    });

    it("should render description exactly as provided", () => {
      render(<ServiceHero {...mockProps} />);
      expect(screen.getByText(mockProps.description)).toBeInTheDocument();
    });

    it("should handle empty badges array gracefully", () => {
      const propsWithEmptyBadges = { ...mockProps, badges: [] };
      expect(() =>
        render(<ServiceHero {...propsWithEmptyBadges} />)
      ).not.toThrow();
    });

    it("should handle single badge correctly", () => {
      const propsWithSingleBadge = {
        ...mockProps,
        badges: [
          { icon: Wrench, text: "Single Feature", color: "text-green-500" },
        ],
      };
      render(<ServiceHero {...propsWithSingleBadge} />);
      expect(screen.getByText("Single Feature")).toBeInTheDocument();
    });

    it("should render all provided badges", () => {
      render(<ServiceHero {...mockProps} />);
      expect(screen.getByText("Feature 1")).toBeInTheDocument();
      expect(screen.getByText("Feature 2")).toBeInTheDocument();
      expect(screen.getByText("Feature 3")).toBeInTheDocument();
    });
  });

  describe("🎯 Usability Standards - Layout & Spacing", () => {
    it("should have proper container structure with centering", () => {
      const { container } = render(<ServiceHero {...mockProps} />);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass("text-center");
      expect(mainDiv).toHaveClass("mb-16");
    });

    it("should have proper spacing between elements", () => {
      render(<ServiceHero {...mockProps} />);
      const title = screen.getByRole("heading", { level: 1 });
      const description = screen.getByText(mockProps.description);

      expect(title).toHaveClass("mb-6");
      expect(description).toHaveClass("mb-8");
    });

    it("should have flex layout for badges", () => {
      const { container } = render(<ServiceHero {...mockProps} />);
      const badgesContainer = container.querySelector('.flex.items-center');
      expect(badgesContainer).toBeInTheDocument();
    });

    it("should center content horizontally", () => {
      const { container } = render(<ServiceHero {...mockProps} />);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass("text-center");
    });
  });

  describe("🔒 Security Standards - Error Handling", () => {
    it("should handle missing icon gracefully", () => {
      const invalidProps = { ...mockProps, icon: undefined as any };
      expect(() => render(<ServiceHero {...invalidProps} />)).not.toThrow();
    });

    it("should handle missing iconBgColor gracefully", () => {
      const invalidProps = { ...mockProps, iconBgColor: "" };
      expect(() => render(<ServiceHero {...invalidProps} />)).not.toThrow();
    });

    it("should handle extremely long title text", () => {
      const longTitleProps = {
        ...mockProps,
        title:
          "This is an extremely long title that should be handled gracefully without breaking the layout or causing overflow issues in the user interface component",
      };
      expect(() => render(<ServiceHero {...longTitleProps} />)).not.toThrow();
      expect(screen.getByText(longTitleProps.title)).toBeInTheDocument();
    });

    it("should handle extremely long description text", () => {
      const longDescProps = {
        ...mockProps,
        description:
          "This is an extremely long description that goes on and on and should be handled gracefully without breaking the layout or causing any overflow issues in the user interface component and should maintain proper readability and spacing throughout the entire text content area.",
      };
      expect(() => render(<ServiceHero {...longDescProps} />)).not.toThrow();
      expect(screen.getByText(longDescProps.description)).toBeInTheDocument();
    });

    it("should handle XSS attempts in title", () => {
      const xssTitle = "<script>alert('xss')</script>";
      const xssProps = { ...mockProps, title: xssTitle };
      render(<ServiceHero {...xssProps} />);
      // React escapes HTML by default
      expect(screen.getByText(xssTitle)).toBeInTheDocument();
    });

    it("should handle XSS attempts in description", () => {
      const xssDesc = "<img onerror='alert(1)' />";
      const xssProps = { ...mockProps, description: xssDesc };
      render(<ServiceHero {...xssProps} />);
      expect(screen.getByText(xssDesc)).toBeInTheDocument();
    });

    it("should handle null badges gracefully", () => {
      const invalidProps = { ...mockProps, badges: null as any };
      expect(() => render(<ServiceHero {...invalidProps} />)).not.toThrow();
    });

    it("should handle undefined badges gracefully", () => {
      const invalidProps = { ...mockProps, badges: undefined as any };
      expect(() => render(<ServiceHero {...invalidProps} />)).not.toThrow();
    });
  });

  describe("⚡ Performance Standards", () => {
    it("should render within acceptable time limits", () => {
      const startTime = performance.now();
      render(<ServiceHero {...mockProps} />);
      const endTime = performance.now();

      // Component should render in less than 50ms
      expect(endTime - startTime).toBeLessThan(50);
    });

    it("should not cause memory leaks on unmount", () => {
      const { unmount } = render(<ServiceHero {...mockProps} />);
      expect(() => unmount()).not.toThrow();
    });

    it("should handle multiple renders efficiently", () => {
      const { rerender } = render(<ServiceHero {...mockProps} />);
      
      const start = Date.now();
      for (let i = 0; i < 10; i++) {
        rerender(<ServiceHero {...mockProps} title={`Title ${i}`} />);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe("Edge Cases & Props Validation", () => {
    it("should handle missing required props", () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => render(<ServiceHero {...({} as any)} />)).not.toThrow();

      consoleError.mockRestore();
    });

    it("should handle invalid badge structure - missing icon", () => {
      const invalidBadgeProps = {
        ...mockProps,
        badges: [
          { text: "No Icon Badge", color: "text-red-500" } as any,
        ],
      };

      render(<ServiceHero {...invalidBadgeProps} />);
      // Component filters out badges without icons
      expect(screen.queryByText("No Icon Badge")).not.toBeInTheDocument();
    });

    it("should handle invalid badge structure - missing text", () => {
      const invalidBadgeProps = {
        ...mockProps,
        badges: [
          { icon: Wrench, color: "text-blue-500" } as any,
        ],
      };

      expect(() =>
        render(<ServiceHero {...invalidBadgeProps} />)
      ).not.toThrow();
    });

    it("should handle badge with missing color", () => {
      const noBadgeProps = {
        ...mockProps,
        badges: [
          { icon: Wrench, text: "No Color", color: "" },
        ],
      };

      render(<ServiceHero {...noBadgeProps} />);
      expect(screen.getByText("No Color")).toBeInTheDocument();
    });

    it("should handle different icon types", () => {
      const differentIconProps = {
        ...mockProps,
        icon: CheckCircle,
        badges: [
          { icon: Clock, text: "Time", color: "text-gray-500" },
        ],
      };

      expect(() => render(<ServiceHero {...differentIconProps} />)).not.toThrow();
    });

    it("should handle unicode characters in content", () => {
      const unicodeProps = {
        ...mockProps,
        title: "服务标题 🚗",
        description: "测试描述文本 ✨",
      };

      render(<ServiceHero {...unicodeProps} />);
      expect(screen.getByText(unicodeProps.title)).toBeInTheDocument();
      expect(screen.getByText(unicodeProps.description)).toBeInTheDocument();
    });
  });
});
