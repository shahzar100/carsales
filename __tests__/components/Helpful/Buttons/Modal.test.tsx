import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Modal from "@/components/Helpful/Buttons/Modal";

describe("Modal", () => {
  it("renders children in portal", async () => {
    await act(async () => {
      render(
        <Modal onClose={jest.fn()}>
          <p>Modal content</p>
        </Modal>
      );
    });
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("renders title in default variant", async () => {
    await act(async () => {
      render(
        <Modal onClose={jest.fn()} title="Test Title">
          <p>Content</p>
        </Modal>
      );
    });
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders dialog role", async () => {
    await act(async () => {
      render(
        <Modal onClose={jest.fn()} title="Dialog">
          <p>Content</p>
        </Modal>
      );
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = jest.fn();
    await act(async () => {
      render(
        <Modal onClose={onClose} title="Test">
          <p>Content</p>
        </Modal>
      );
    });
    const closeBtn = screen.getByLabelText("Close");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on backdrop click", async () => {
    const onClose = jest.fn();
    await act(async () => {
      render(
        <Modal onClose={onClose} title="Test">
          <p>Content</p>
        </Modal>
      );
    });
    // Click the backdrop (the fixed overlay div)
    const backdrop = screen.getByRole("dialog").parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on Escape key", async () => {
    const onClose = jest.fn();
    await act(async () => {
      render(
        <Modal onClose={onClose} title="Test">
          <p>Content</p>
        </Modal>
      );
    });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("renders clean variant with close button", async () => {
    await act(async () => {
      render(
        <Modal onClose={jest.fn()} variant="clean">
          <p>Clean content</p>
        </Modal>
      );
    });
    expect(screen.getByText("Clean content")).toBeInTheDocument();
    expect(screen.getByLabelText("Close")).toBeInTheDocument();
  });

  it("applies size class", async () => {
    await act(async () => {
      render(
        <Modal onClose={jest.fn()} size="sm" title="Small">
          <p>Content</p>
        </Modal>
      );
    });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("sm:max-w-sm");
  });

  describe("focus trap (CODEBASE_ISSUES G3)", () => {
    it("🎯 Tab from the LAST focusable cycles back to the dialog's first (the close button)", async () => {
      await act(async () => {
        render(
          <Modal onClose={jest.fn()} title="Trap">
            <button data-testid="first">First</button>
            <button data-testid="last">Last</button>
          </Modal>
        );
      });
      // The Modal renders its own close button before the user's children,
      // so the dialog's first focusable is the close X (aria-label="Close").
      const closeBtn = screen.getByLabelText("Close");
      const last = screen.getByTestId("last");
      last.focus();
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(closeBtn);
    });

    it("🎯 Shift+Tab from the FIRST focusable (close button) cycles to the last", async () => {
      await act(async () => {
        render(
          <Modal onClose={jest.fn()} title="Trap">
            <button data-testid="first">First</button>
            <button data-testid="last">Last</button>
          </Modal>
        );
      });
      const closeBtn = screen.getByLabelText("Close");
      const last = screen.getByTestId("last");
      closeBtn.focus();
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(last);
    });

    it("🎯 non-Tab keys are passed through unchanged", async () => {
      await act(async () => {
        render(
          <Modal onClose={jest.fn()} title="Trap">
            <button data-testid="only">Only</button>
          </Modal>
        );
      });
      // Pressing a non-Tab key should not move focus or throw.
      const only = screen.getByTestId("only");
      only.focus();
      fireEvent.keyDown(document, { key: "ArrowDown" });
      expect(document.activeElement).toBe(only);
    });
  });
});
