/**
 * Unit tests for the Toast component
 * Tests rendering, progress bar, auto-dismiss, manual close, action buttons
 */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Toast from "@/components/Toast/Toast";
import { Toast as ToastType } from "@/contexts/types";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  X: ({
    className,
    ...props
  }: React.SVGProps<SVGSVGElement> & { className?: string }) => (
    <svg data-testid="x-icon" className={className} {...props} />
  ),
  CheckCircle: ({
    className,
    ...props
  }: React.SVGProps<SVGSVGElement> & { className?: string }) => (
    <svg data-testid="check-circle-icon" className={className} {...props} />
  ),
  XCircle: ({
    className,
    ...props
  }: React.SVGProps<SVGSVGElement> & { className?: string }) => (
    <svg data-testid="x-circle-icon" className={className} {...props} />
  ),
  AlertTriangle: ({
    className,
    ...props
  }: React.SVGProps<SVGSVGElement> & { className?: string }) => (
    <svg data-testid="alert-triangle-icon" className={className} {...props} />
  ),
  Info: ({
    className,
    ...props
  }: React.SVGProps<SVGSVGElement> & { className?: string }) => (
    <svg data-testid="info-icon" className={className} {...props} />
  ),
}));

const createToast = (overrides: Partial<ToastType> = {}): ToastType => ({
  id: "test-toast-1",
  type: "success",
  title: "Test Toast",
  message: "This is a test message",
  duration: 5000,
  ...overrides,
});

describe("Toast", () => {
  let onRemove: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    onRemove = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render the toast title", () => {
      render(<Toast toast={createToast()} onRemove={onRemove} />);
      expect(screen.getByText("Test Toast")).toBeInTheDocument();
    });

    it("should render the toast message", () => {
      render(<Toast toast={createToast()} onRemove={onRemove} />);
      expect(screen.getByText("This is a test message")).toBeInTheDocument();
    });

    it("should not render message when not provided", () => {
      render(
        <Toast
          toast={createToast({ message: undefined })}
          onRemove={onRemove}
        />
      );
      expect(
        screen.queryByText("This is a test message")
      ).not.toBeInTheDocument();
    });

    it("should have role='alert' for accessibility", () => {
      render(<Toast toast={createToast()} onRemove={onRemove} />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should render close button with correct aria-label", () => {
      render(<Toast toast={createToast()} onRemove={onRemove} />);
      expect(screen.getByLabelText("Close notification")).toBeInTheDocument();
    });
  });

  describe("Toast types", () => {
    it("should render success icon for success type", () => {
      render(
        <Toast toast={createToast({ type: "success" })} onRemove={onRemove} />
      );
      expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument();
    });

    it("should render error icon for error type", () => {
      render(
        <Toast toast={createToast({ type: "error" })} onRemove={onRemove} />
      );
      expect(screen.getByTestId("x-circle-icon")).toBeInTheDocument();
    });

    it("should render warning icon for warning type", () => {
      render(
        <Toast toast={createToast({ type: "warning" })} onRemove={onRemove} />
      );
      expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument();
    });

    it("should render info icon for info type", () => {
      render(
        <Toast toast={createToast({ type: "info" })} onRemove={onRemove} />
      );
      expect(screen.getByTestId("info-icon")).toBeInTheDocument();
    });
  });

  describe("Close behavior", () => {
    it("should call onRemove after clicking close and waiting for exit animation", () => {
      render(<Toast toast={createToast()} onRemove={onRemove} />);

      fireEvent.click(screen.getByLabelText("Close notification"));
      // Should not be called immediately (300ms exit animation)
      expect(onRemove).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onRemove).toHaveBeenCalledWith("test-toast-1");
    });

    it("should not call onRemove twice on multiple clicks", () => {
      render(<Toast toast={createToast()} onRemove={onRemove} />);
      const closeButton = screen.getByLabelText("Close notification");
      fireEvent.click(closeButton);
      fireEvent.click(closeButton); // guarded by isRemoving

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe("Action button", () => {
    it("should render action button when action is provided", () => {
      const actionOnClick = jest.fn();
      render(
        <Toast
          toast={createToast({
            action: { label: "Undo", onClick: actionOnClick },
          })}
          onRemove={onRemove}
        />
      );

      expect(screen.getByText("Undo")).toBeInTheDocument();
    });

    it("should call action onClick when action button is clicked", () => {
      const actionOnClick = jest.fn();
      render(
        <Toast
          toast={createToast({
            action: { label: "Undo", onClick: actionOnClick },
          })}
          onRemove={onRemove}
        />
      );

      fireEvent.click(screen.getByText("Undo"));
      expect(actionOnClick).toHaveBeenCalledTimes(1);
    });

    it("should not render action button when no action is provided", () => {
      render(<Toast toast={createToast()} onRemove={onRemove} />);
      expect(screen.queryByText("Undo")).not.toBeInTheDocument();
    });
  });

  describe("Progress bar", () => {
    it("should render progress bar for non-persistent toasts with duration", () => {
      const { container } = render(
        <Toast toast={createToast({ duration: 5000 })} onRemove={onRemove} />
      );
      // Progress bar has a style attribute with width
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("should not render progress bar for persistent toasts", () => {
      const { container } = render(
        <Toast
          toast={createToast({ persistent: true, duration: 5000 })}
          onRemove={onRemove}
        />
      );
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).not.toBeInTheDocument();
    });

    it("should not render progress bar when duration is 0", () => {
      const { container } = render(
        <Toast toast={createToast({ duration: 0 })} onRemove={onRemove} />
      );
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).not.toBeInTheDocument();
    });
  });

  describe("Visibility animation", () => {
    it("should animate in after 50ms delay", () => {
      render(<Toast toast={createToast()} onRemove={onRemove} />);
      const alertEl = screen.getByRole("alert");
      // Initially has translate-x-full (not visible)
      expect(alertEl.className).toContain("translate-x-full");

      act(() => {
        jest.advanceTimersByTime(50);
      });

      // After 50ms, has translate-x-0 (visible)
      expect(alertEl.className).toContain("translate-x-0");
    });
  });
});
