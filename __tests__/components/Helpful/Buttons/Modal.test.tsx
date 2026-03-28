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
});
