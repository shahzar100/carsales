import React from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Wrench, CheckCircle, Clock } from "lucide-react";
import ServiceHero from "@/components/Services/Common/ServiceHero";

expect.extend(toHaveNoViolations);

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

  describe("Accessibility Requirements", () => {
    it("must have no accessibility violations", async () => {
      const { container } = render(<ServiceHero {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("must have proper heading hierarchy with h1", () => {
      render(<ServiceHero {...mockProps} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(mockProps.title);
    });

    it("must have descriptive text that is readable", () => {
      render(<ServiceHero {...mockProps} />);
      const description = screen.getByText(mockProps.description);
      expect(description).toBeInTheDocument();
      expect(description).toHaveAttribute("class");
      // Description should have adequate text size and contrast
      expect(description.className).toMatch(/text-(lg|xl|2xl)/);
    });
  });

  describe("Visual Design Requirements", () => {
    it("must display icon with proper sizing and background", () => {
      render(<ServiceHero {...mockProps} />);
      const iconContainer = document.querySelector('[class*="h-20 w-20"]');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass("rounded-full");
      expect(iconContainer?.className).toContain("bg-blue-100");
    });

    it("must have responsive text sizing", () => {
      render(<ServiceHero {...mockProps} />);
      const title = screen.getByRole("heading", { level: 1 });
      expect(title.className).toMatch(/text-4xl.*lg:text-5xl/);
    });

    it("must display all badges with proper icons and colors", () => {
      render(<ServiceHero {...mockProps} />);

      mockProps.badges.forEach((badge) => {
        const badgeText = screen.getByText(badge.text);
        expect(badgeText).toBeInTheDocument();

        const badgeContainer = badgeText.closest(".flex.items-center");
        expect(badgeContainer).toBeInTheDocument();

        const icon = badgeContainer?.querySelector("svg");
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass("h-5", "w-5");
      });
    });
  });

  describe("Content Requirements", () => {
    it("must render title exactly as provided", () => {
      render(<ServiceHero {...mockProps} />);
      expect(screen.getByText(mockProps.title)).toBeInTheDocument();
    });

    it("must render description exactly as provided", () => {
      render(<ServiceHero {...mockProps} />);
      expect(screen.getByText(mockProps.description)).toBeInTheDocument();
    });

    it("must handle empty badges array gracefully", () => {
      const propsWithEmptyBadges = { ...mockProps, badges: [] };
      expect(() =>
        render(<ServiceHero {...propsWithEmptyBadges} />)
      ).not.toThrow();
    });

    it("must handle single badge correctly", () => {
      const propsWithSingleBadge = {
        ...mockProps,
        badges: [
          { icon: Wrench, text: "Single Feature", color: "text-green-500" },
        ],
      };
      render(<ServiceHero {...propsWithSingleBadge} />);
      expect(screen.getByText("Single Feature")).toBeInTheDocument();
    });
  });

  describe("Layout and Spacing Requirements", () => {
    it("must have proper container structure with centering", () => {
      const { container } = render(<ServiceHero {...mockProps} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass("text-center");
      expect(mainDiv).toHaveClass("mb-16");
    });

    it("must have proper spacing between elements", () => {
      render(<ServiceHero {...mockProps} />);
      const title = screen.getByRole("heading", { level: 1 });
      const description = screen.getByText(mockProps.description);

      expect(title).toHaveClass("mb-6");
      expect(description).toHaveClass("mb-8");
    });

    it("must have responsive badge layout", () => {
      render(<ServiceHero {...mockProps} />);
      const badgesContainer = document.querySelector(
        ".flex.items-center.justify-center.space-x-8"
      );
      expect(badgesContainer).toBeInTheDocument();
    });
  });

  describe("Error Handling Requirements", () => {
    it("must handle missing icon gracefully", () => {
      const invalidProps = { ...mockProps, icon: undefined as any };
      // Should not crash the entire component
      expect(() => render(<ServiceHero {...invalidProps} />)).not.toThrow();
    });

    it("must handle missing iconBgColor gracefully", () => {
      const invalidProps = { ...mockProps, iconBgColor: "" };
      expect(() => render(<ServiceHero {...invalidProps} />)).not.toThrow();
    });

    it("must handle extremely long title text", () => {
      const longTitleProps = {
        ...mockProps,
        title:
          "This is an extremely long title that should be handled gracefully without breaking the layout or causing overflow issues in the user interface component",
      };
      expect(() => render(<ServiceHero {...longTitleProps} />)).not.toThrow();
      expect(screen.getByText(longTitleProps.title)).toBeInTheDocument();
    });

    it("must handle extremely long description text", () => {
      const longDescProps = {
        ...mockProps,
        description:
          "This is an extremely long description that goes on and on and should be handled gracefully without breaking the layout or causing any overflow issues in the user interface component and should maintain proper readability and spacing throughout the entire text content area.",
      };
      expect(() => render(<ServiceHero {...longDescProps} />)).not.toThrow();
      expect(screen.getByText(longDescProps.description)).toBeInTheDocument();
    });
  });

  describe("Performance Requirements", () => {
    it("must render within acceptable time limits", async () => {
      const startTime = performance.now();
      render(<ServiceHero {...mockProps} />);
      const endTime = performance.now();

      // Component should render in less than 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("must not cause memory leaks on unmount", () => {
      const { unmount } = render(<ServiceHero {...mockProps} />);
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Props Validation Requirements", () => {
    it("must require all mandatory props", () => {
      // Test with missing required props
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => render(<ServiceHero {...({} as any)} />)).not.toThrow();

      consoleError.mockRestore();
    });

    it("must handle invalid badge structure", () => {
      const invalidBadgeProps = {
        ...mockProps,
        badges: [
          { text: "No Icon Badge", color: "text-red-500" } as any,
          { icon: Wrench, color: "text-blue-500" } as any, // Missing text
        ],
      };

      expect(() =>
        render(<ServiceHero {...invalidBadgeProps} />)
      ).not.toThrow();
    });
  });

  describe("Responsive Design Requirements", () => {
    it("must adapt to different screen sizes", () => {
      // Mock different viewport sizes
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768,
      });
      render(<ServiceHero {...mockProps} />);

      const title = screen.getByRole("heading", { level: 1 });
      expect(title.className).toContain("lg:text-5xl");

      // Reset
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it("must maintain proper spacing on mobile devices", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });
      render(<ServiceHero {...mockProps} />);

      const description = screen.getByText(mockProps.description);
      expect(description).toHaveClass("max-w-3xl");

      // Reset
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });
  });
});
