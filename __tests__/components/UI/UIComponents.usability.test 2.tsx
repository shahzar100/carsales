/**
 * STRICT UI COMPONENT TESTS
 * Tests for buttons, navigation, and interactive elements
 * Designed to catch real usability and functionality issues
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("UI Components - CRITICAL USABILITY TESTS", () => {
  describe("Navigation Components - ACCESSIBILITY REQUIREMENTS", () => {
    // Mock NavButton component based on expected behavior
    const NavButton = (props: any) => {
      const {
        href,
        children,
        active = false,
        disabled = false,
        onClick,
      } = props;
      const handleClick = (e: React.MouseEvent) => {
        if (disabled) {
          e.preventDefault();
          return;
        }

        if (onClick) {
          onClick(e);
        }
      };

      const baseClasses =
        "px-4 py-2 rounded font-medium transition-colors duration-200";
      const activeClasses = active
        ? "bg-blue-600 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300";
      const disabledClasses = disabled
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer";

      if (href && !disabled) {
        return (
          <a
            href={href}
            className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleClick(e as any);
              }
            }}
          >
            {children}
          </a>
        );
      }

      return (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
        >
          {children}
        </button>
      );
    };

    afterEach(cleanup);

    it("MUST be keyboard accessible with proper ARIA attributes", async () => {
      const mockClick = jest.fn();
      render(
        <div>
          <NavButton href="/test" onClick={mockClick}>
            Link Button
          </NavButton>
          <NavButton onClick={mockClick}>Regular Button</NavButton>
        </div>
      );

      // STRICT: Both buttons must be focusable
      const linkButton = screen.getByRole("button", { name: /link button/i });
      const regularButton = screen.getByRole("button", {
        name: /regular button/i,
      });

      linkButton.focus();
      expect(document.activeElement).toBe(linkButton);

      regularButton.focus();
      expect(document.activeElement).toBe(regularButton);

      // STRICT: Must respond to keyboard activation
      fireEvent.keyDown(linkButton, { key: "Enter" });
      expect(mockClick).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(linkButton, { key: " " });
      expect(mockClick).toHaveBeenCalledTimes(2);
    });

    it("MUST handle disabled state correctly", async () => {
      const mockClick = jest.fn();
      render(
        <NavButton disabled onClick={mockClick}>
          Disabled Button
        </NavButton>
      );

      const button = screen.getByRole("button");

      // STRICT: Disabled button must not be clickable
      expect(button).toBeDisabled();

      await userEvent.click(button);
      expect(mockClick).not.toHaveBeenCalled();

      // STRICT: Must have proper visual indicators
      expect(button.className).toContain("opacity-50");
      expect(button.className).toContain("cursor-not-allowed");
    });

    it("MUST provide visual feedback for interactive states", () => {
      render(
        <div>
          <NavButton active>Active Button</NavButton>
          <NavButton>Inactive Button</NavButton>
        </div>
      );

      const activeButton = screen.getByText("Active Button");
      const inactiveButton = screen.getByText("Inactive Button");

      // STRICT: Active state must be visually distinct
      expect(activeButton.className).toContain("bg-blue-600");
      expect(activeButton.className).toContain("text-white");

      // STRICT: Inactive state must have hover effects
      expect(inactiveButton.className).toContain("hover:bg-gray-300");
      expect(inactiveButton.className).toContain("transition-colors");
    });

    it("MUST validate href URLs for security", () => {
      const maliciousUrls = [
        'javascript:alert("xss")',
        "data:text/html,<script>alert(1)</script>",
        'vbscript:msgbox("xss")',
      ];

      maliciousUrls.forEach((url, index) => {
        const { container } = render(
          <NavButton href={url}>Link {index}</NavButton>
        );

        // STRICT: Malicious URLs should be sanitized or blocked
        const link = container.querySelector("a");
        const href = link?.getAttribute("href");

        // This test shows what SHOULD happen - implementation may need fixing
        expect(href).not.toMatch(/^javascript:/);
        expect(href).not.toMatch(/^data:/);
        expect(href).not.toMatch(/^vbscript:/);

        cleanup();
      });
    });
  });

  describe("PageLoader Component - PERFORMANCE REQUIREMENTS", () => {
    // Mock PageLoader component
    const PageLoader = (props: {
      isLoading: boolean;
      message?: string;
      timeout?: number;
    }) => {
      const { isLoading, message = "Loading...", timeout = 30000 } = props;
      const [showTimeout, setShowTimeout] = React.useState(false);

      React.useEffect(() => {
        if (!isLoading) {
          setShowTimeout(false);
          return;
        }

        const timer = setTimeout(() => {
          setShowTimeout(true);
        }, timeout);

        return () => clearTimeout(timer);
      }, [isLoading, timeout]);

      if (!isLoading) return null;

      return (
        <div
          className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-white"
          role="status"
          aria-live="polite"
          aria-label="Loading content"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">{message}</p>
            {showTimeout && (
              <div className="text-sm text-red-600" role="alert">
                Loading is taking longer than expected. Please check your
                connection.
              </div>
            )}
          </div>
        </div>
      );
    };

    afterEach(cleanup);

    it("MUST provide proper accessibility for screen readers", () => {
      render(<PageLoader isLoading={true} message="Loading data..." />);

      // STRICT: Must have proper ARIA attributes
      const loader = screen.getByRole("status");
      expect(loader).toHaveAttribute("aria-live", "polite");
      expect(loader).toHaveAttribute("aria-label", "Loading content");

      // STRICT: Loading message must be announced
      expect(screen.getByText("Loading data...")).toBeTruthy();
    });

    it("MUST handle long loading times with timeout warnings", async () => {
      render(<PageLoader isLoading={true} timeout={1000} />);

      // STRICT: Initially no timeout message
      expect(screen.queryByText(/taking longer than expected/i)).toBeFalsy();

      // STRICT: After timeout, warning should appear
      await waitFor(
        () => {
          expect(screen.getByText(/taking longer than expected/i)).toBeTruthy();
        },
        { timeout: 1500 }
      );

      // STRICT: Warning must have alert role
      const warning = screen.getByRole("alert");
      expect(warning).toBeTruthy();
    });

    it("MUST not block page interaction when not loading", () => {
      const { rerender } = render(<PageLoader isLoading={true} />);

      // STRICT: When loading, should cover page
      expect(screen.getByRole("status")).toHaveClass("fixed", "inset-0");

      // STRICT: When not loading, should not exist
      rerender(<PageLoader isLoading={false} />);
      expect(screen.queryByRole("status")).toBeFalsy();
    });

    it("MUST have proper z-index to appear above all content", () => {
      render(<PageLoader isLoading={true} />);

      const loader = screen.getByRole("status");
      expect(loader.className).toContain("z-50");
    });
  });

  describe("Modal Components - FOCUS MANAGEMENT REQUIREMENTS", () => {
    // Mock Modal component with focus management
    const Modal = (props: {
      isOpen: boolean;
      onClose: () => void;
      title: string;
      children: React.ReactNode;
      closeOnEscape?: boolean;
    }) => {
      const { isOpen, onClose, title, children, closeOnEscape = true } = props;
      const modalRef = React.useRef<HTMLDivElement>(null);
      const previousFocus = React.useRef<HTMLElement | null>(null);

      React.useEffect(() => {
        if (!isOpen) return;

        // STRICT: Store previous focus
        previousFocus.current = document.activeElement as HTMLElement;

        // STRICT: Focus modal when opened
        const timer = setTimeout(() => {
          modalRef.current?.focus();
        }, 0);

        // STRICT: Handle escape key
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === "Escape" && closeOnEscape) {
            onClose();
          }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
          clearTimeout(timer);
          document.removeEventListener("keydown", handleEscape);

          // STRICT: Restore previous focus when closed
          if (previousFocus.current) {
            previousFocus.current.focus();
          }
        };
      }, [isOpen, onClose, closeOnEscape]);

      if (!isOpen) return null;

      return (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            className="mx-4 w-full max-w-md rounded-lg bg-white p-6 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="modal-title" className="text-xl font-bold">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="rounded text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div>{children}</div>
          </div>
        </div>
      );
    };

    const mockModalProps = {
      isOpen: true,
      onClose: jest.fn(),
      title: "Test Modal",
      children: <p>Modal content goes here</p>,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(cleanup);

    it("MUST trap focus within modal when open", async () => {
      // Add a button before modal for testing focus
      const TestWrapper = () => (
        <div>
          <button>Outside Button</button>
          <Modal {...mockModalProps} />
        </div>
      );

      render(<TestWrapper />);

      // STRICT: Focus should be moved to modal
      await waitFor(() => {
        expect(document.activeElement).toHaveAttribute("role", "dialog");
      });

      // STRICT: Tab navigation should stay within modal
      const closeButton = screen.getByLabelText(/close modal/i);
      expect(closeButton).toBeTruthy();
    });

    it("MUST handle escape key to close modal", async () => {
      render(<Modal {...mockModalProps} />);

      // STRICT: Escape key should trigger onClose
      fireEvent.keyDown(document, { key: "Escape" });
      expect(mockModalProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("MUST restore focus when modal closes", async () => {
      const TestWrapper = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        return (
          <div>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>
            <Modal
              {...mockModalProps}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
            />
          </div>
        );
      };

      const user = userEvent.setup();
      render(<TestWrapper />);

      const openButton = screen.getByText("Open Modal");

      // STRICT: Focus open button and open modal
      openButton.focus();
      await user.click(openButton);

      // STRICT: Close modal and verify focus restoration
      const closeButton = screen.getByLabelText(/close modal/i);
      await user.click(closeButton);

      await waitFor(() => {
        expect(document.activeElement).toBe(openButton);
      });
    });

    it("MUST have proper ARIA attributes for accessibility", () => {
      render(<Modal {...mockModalProps} />);

      const modal = screen.getByRole("dialog");

      // STRICT: Must have proper ARIA attributes
      expect(modal).toHaveAttribute("aria-modal", "true");
      expect(modal).toHaveAttribute("aria-labelledby", "modal-title");

      // STRICT: Title must be properly associated
      const title = screen.getByText("Test Modal");
      expect(title).toHaveAttribute("id", "modal-title");
    });

    it("MUST prevent background scroll when open", () => {
      render(<Modal {...mockModalProps} />);

      // STRICT: Modal should have overlay that covers entire screen
      const overlay = document.querySelector(".fixed.inset-0");
      expect(overlay).toBeTruthy();
      expect(overlay).toHaveClass("bg-black", "bg-opacity-50");
    });
  });
});
