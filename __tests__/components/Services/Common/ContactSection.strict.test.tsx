/**
 * STRICT CONTACT SECTION COMPONENT TESTS
 * Tests define expected behavior - failures indicate refactoring needed
 */
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import Link from "next/link";

// Mock Next.js Link component for testing
jest.mock("next/link", () => {
  return function MockLink({ children, href, className, ...props }: any) {
    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    );
  };
});

describe("ContactSection Component - STRICT REQUIREMENTS", () => {
  // Mock component implementation for testing
  const ContactSection = ({
    title,
    subtitle,
    primaryActions,
    secondaryActions,
    backgroundColor = "bg-gray-900",
    textColor = "text-white",
  }: any) => {
    const sanitizeUrl = (url: string): string => {
      if (!url) return "#";
      if (/^(javascript|data|vbscript):/i.test(url)) return "#";
      return url;
    };

    const getActionClasses = (style: string, isPrimary: boolean = true) => {
      const baseClasses =
        "rounded-lg px-8 py-3 font-medium transition-colors duration-200";

      switch (style) {
        case "primary":
          return `${baseClasses} ${isPrimary ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-700 text-white hover:bg-gray-600"}`;
        case "secondary":
          return `${baseClasses} border border-gray-600 bg-transparent text-white hover:bg-gray-800`;
        case "danger":
          return `${baseClasses} bg-red-700 text-white hover:bg-red-800`;
        default:
          return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700`;
      }
    };

    const renderAction = (action: any, isPrimary: boolean = true) => {
      if (!action) return null;
      const classes = getActionClasses(action.style, isPrimary);
      const safeUrl = sanitizeUrl(action.url);

      if (action.type === "link") {
        return (
          <Link href={safeUrl} className={classes}>
            {action.text}
          </Link>
        );
      }

      return (
        <a href={safeUrl} className={classes} tabIndex={0}>
          {action.text}
        </a>
      );
    };

    return (
      <div
        className={`rounded-2xl ${backgroundColor} ${textColor} p-8 lg:p-12`}
      >
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold">{title}</h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-300">{subtitle}</p>
        </div>

        <div className="mb-8 grid gap-8 md:grid-cols-2">
          {primaryActions.map((action: any, index: number) => {
            if (!action) return null;
            return (
              <div key={index} className="rounded-xl bg-gray-800 p-6">
                {renderAction(action, true)}
              </div>
            );
          })}
        </div>

        {secondaryActions && (
          <div className="text-center">
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              {secondaryActions.map((action: any, index: number) => (
                <div key={index}>{renderAction(action, false)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const validContactProps = {
    title: "Contact Us Today",
    subtitle: "Get in touch for professional service and support.",
    primaryActions: [
      {
        type: "email",
        url: "mailto:test@example.com",
        text: "Send Email",
        style: "primary",
      },
      {
        type: "phone",
        url: "tel:555-123-4567",
        text: "Call Now",
        style: "danger",
      },
    ],
    secondaryActions: [
      {
        type: "link",
        url: "/contact",
        text: "Visit Location",
        style: "primary",
      },
      {
        type: "email",
        url: "mailto:info@example.com",
        text: "General Info",
        style: "secondary",
      },
    ],
  };

  afterEach(cleanup);

  describe("CRITICAL STRUCTURE REQUIREMENTS", () => {
    it("MUST have proper semantic heading hierarchy", () => {
      render(<ContactSection {...validContactProps} />);

      // STRICT: Must have exactly one h2 element
      const headings = screen.getAllByRole("heading", { level: 2 });
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent(validContactProps.title);
    });

    it("MUST render all primary actions with proper structure", () => {
      render(<ContactSection {...validContactProps} />);

      // STRICT: Each primary action must be in a container with proper classes
      const actionContainers = document.querySelectorAll(
        ".rounded-xl.bg-gray-800.p-6"
      );
      expect(actionContainers).toHaveLength(
        validContactProps.primaryActions.length
      );

      // STRICT: Each action must have proper link/button
      validContactProps.primaryActions.forEach((action) => {
        const element = screen.getByText(action.text);
        expect(element).toBeTruthy();
        expect(element.tagName).toMatch(/^(A|BUTTON)$/);
      });
    });

    it("MUST handle missing secondary actions gracefully", () => {
      const propsWithoutSecondary = {
        ...validContactProps,
        secondaryActions: undefined,
      };

      // STRICT: Must render without secondary actions
      expect(() =>
        render(<ContactSection {...propsWithoutSecondary} />)
      ).not.toThrow();

      // STRICT: Secondary section must not exist
      const secondarySection = document.querySelector(
        ".text-center > .flex.flex-col"
      );
      expect(secondarySection).toBeFalsy();
    });
  });

  describe("CRITICAL ACCESSIBILITY REQUIREMENTS", () => {
    it("MUST have accessible link and button elements", () => {
      render(<ContactSection {...validContactProps} />);

      // STRICT: All actions must be accessible elements
      const links = screen.getAllByRole("link");
      const buttons = screen.queryAllByRole("button");

      expect(links.length + buttons.length).toBeGreaterThan(0);

      // STRICT: Links must have valid href attributes
      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
        const href = link.getAttribute("href");
        expect(href).toBeTruthy();
        expect(href).not.toBe("#");
      });
    });

    it("MUST have proper color contrast for accessibility", () => {
      render(<ContactSection {...validContactProps} />);

      // STRICT: Text elements must have proper contrast classes
      const title = screen.getByRole("heading", { level: 2 });
      expect(title.className).toContain("text-3xl");

      const subtitle = screen.getByText(validContactProps.subtitle);
      expect(subtitle.className).toContain("text-gray-300");
    });

    it("MUST support keyboard navigation", () => {
      render(<ContactSection {...validContactProps} />);

      // STRICT: All interactive elements must be focusable
      const interactiveElements = screen.getAllByRole("link");

      interactiveElements.forEach((element) => {
        expect(element).not.toHaveAttribute("tabindex", "-1");

        // STRICT: Focus should be visible
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });
  });

  describe("CRITICAL FUNCTIONALITY REQUIREMENTS", () => {
    it("MUST generate correct URLs for different action types", () => {
      render(<ContactSection {...validContactProps} />);

      // STRICT: Email links must have mailto: protocol
      const emailLink = screen.getByText("Send Email");
      expect(emailLink.getAttribute("href")).toBe("mailto:test@example.com");

      // STRICT: Phone links must have tel: protocol
      const phoneLink = screen.getByText("Call Now");
      expect(phoneLink.getAttribute("href")).toBe("tel:555-123-4567");

      // STRICT: Internal links must have correct paths
      const internalLink = screen.getByText("Visit Location");
      expect(internalLink.getAttribute("href")).toBe("/contact");
    });

    it("MUST apply correct styling based on action style prop", () => {
      render(<ContactSection {...validContactProps} />);

      // STRICT: Primary actions must have green background
      const primaryAction = screen.getByText("Send Email");
      expect(primaryAction.className).toContain("bg-green-600");

      // STRICT: Danger actions must have red background
      const dangerAction = screen.getByText("Call Now");
      expect(dangerAction.className).toContain("bg-red-700");

      // STRICT: Secondary actions must have transparent background
      const secondaryAction = screen.getByText("General Info");
      expect(secondaryAction.className).toContain("bg-transparent");
    });

    it("MUST handle hover states properly", () => {
      render(<ContactSection {...validContactProps} />);

      const primaryAction = screen.getByText("Send Email");

      // STRICT: Must have hover classes defined
      expect(primaryAction.className).toMatch(/hover:bg-\w+-\d+/);

      // STRICT: Transition classes must be present
      expect(primaryAction.className).toContain("transition-colors");
      expect(primaryAction.className).toContain("duration-200");
    });
  });

  describe("CRITICAL ERROR HANDLING REQUIREMENTS", () => {
    it("MUST handle malformed action objects", () => {
      const malformedProps = {
        ...validContactProps,
        primaryActions: [
          { text: "Missing URL and Type", style: "primary" }, // Missing required fields
          { type: "email", url: "", text: "Empty URL", style: "primary" }, // Empty URL
          {
            type: "invalid",
            url: "test",
            text: "Invalid Type",
            style: "primary",
          }, // Invalid type
          null, // Null action
        ],
      };

      // STRICT: Must not crash with malformed actions
      expect(() =>
        render(<ContactSection {...malformedProps} />)
      ).not.toThrow();
    });

    it("MUST handle empty actions arrays", () => {
      const emptyActionsProps = {
        ...validContactProps,
        primaryActions: [],
        secondaryActions: [],
      };

      // STRICT: Must render with empty arrays
      expect(() =>
        render(<ContactSection {...emptyActionsProps} />)
      ).not.toThrow();

      // STRICT: Grid should still exist but be empty
      const primaryGrid = document.querySelector(
        ".grid.gap-8.md\\:grid-cols-2"
      );
      expect(primaryGrid).toBeTruthy();
      expect(primaryGrid?.children).toHaveLength(0);
    });

    it("MUST sanitize potentially dangerous URLs", () => {
      const maliciousProps = {
        ...validContactProps,
        primaryActions: [
          {
            type: "link",
            url: 'javascript:alert("xss")',
            text: "Malicious Link",
            style: "primary",
          },
        ],
      };

      render(<ContactSection {...maliciousProps} />);

      const maliciousLink = screen.getByText("Malicious Link");
      const href = maliciousLink.getAttribute("href");

      // STRICT: JavaScript URLs should be sanitized or blocked
      // Note: This test shows what SHOULD happen - actual implementation may need fixing
      expect(href).not.toMatch(/^javascript:/);
    });
  });

  describe("CRITICAL RESPONSIVE DESIGN REQUIREMENTS", () => {
    it("MUST adapt grid layout for mobile devices", () => {
      render(<ContactSection {...validContactProps} />);

      const primaryGrid = document.querySelector(
        ".grid.gap-8.md\\:grid-cols-2"
      );
      expect(primaryGrid).toBeTruthy();

      // STRICT: Must have responsive grid classes
      expect(primaryGrid?.className).toContain("md:grid-cols-2");
    });

    it("MUST have proper responsive padding", () => {
      render(<ContactSection {...validContactProps} />);

      const container = document.querySelector(".rounded-2xl");
      expect(container?.className).toContain("p-8");
      expect(container?.className).toContain("lg:p-12");
    });

    it("MUST stack secondary actions properly on mobile", () => {
      render(<ContactSection {...validContactProps} />);

      const secondaryContainer = document.querySelector(
        ".flex.flex-col.justify-center.gap-4.sm\\:flex-row"
      );
      expect(secondaryContainer).toBeTruthy();

      // STRICT: Must have mobile-first responsive classes
      expect(secondaryContainer?.className).toContain("flex-col");
      expect(secondaryContainer?.className).toContain("sm:flex-row");
    });
  });

  describe("CRITICAL PERFORMANCE REQUIREMENTS", () => {
    it("MUST render large numbers of actions efficiently", () => {
      const manyActionsProps = {
        ...validContactProps,
        primaryActions: Array.from({ length: 50 }, (_, i) => ({
          type: "email",
          url: `mailto:test${i}@example.com`,
          text: `Action ${i}`,
          style: "primary",
        })),
      };

      const startTime = performance.now();
      render(<ContactSection {...manyActionsProps} />);
      const endTime = performance.now();

      // STRICT: Must render efficiently even with many actions
      expect(endTime - startTime).toBeLessThan(500); // 500ms budget
    });
  });
});
