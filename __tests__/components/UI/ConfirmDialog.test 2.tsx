/**
 * Tests for the accessible ConfirmDialog primitive.
 *
 * Standards coverage:
 * - 📋 Functional: Confirm and cancel handlers fire
 * - ♿ Accessibility: dialog role, ESC closes, Cancel button is auto-focused
 *   so accidental Enter presses don't fire the destructive action
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfirmDialog from "@/components/UI/ConfirmDialog";

describe("ConfirmDialog", () => {
  const baseProps = {
    title: "Delete car?",
    description: "This permanently removes the listing.",
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title and description", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByText("Delete car?")).toBeInTheDocument();
    expect(
      screen.getByText("This permanently removes the listing.")
    ).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is clicked", async () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = jest.fn();
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("auto-focuses Cancel so a stray Enter doesn't trigger the destructive action", async () => {
    render(<ConfirmDialog {...baseProps} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    });
  });

  it("renders custom labels", () => {
    render(
      <ConfirmDialog
        {...baseProps}
        confirmLabel="Yes, cancel booking"
        cancelLabel="Keep booking"
      />
    );
    expect(
      screen.getByRole("button", { name: "Yes, cancel booking" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Keep booking" })
    ).toBeInTheDocument();
  });

  it("disables the buttons while loading", () => {
    render(
      <ConfirmDialog {...baseProps} confirmLabel="Delete" loading={true} />
    );
    expect(screen.getByRole("button", { name: /Delete/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("calls onCancel when ESC is pressed", () => {
    const onCancel = jest.fn();
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses the danger variant by default (red confirm button)", () => {
    render(<ConfirmDialog {...baseProps} confirmLabel="Delete" />);
    const confirmBtn = screen.getByRole("button", { name: "Delete" });
    expect(confirmBtn.className).toContain("bg-red-600");
  });

  it("info variant uses the primary (red) confirm button", () => {
    render(
      <ConfirmDialog
        {...baseProps}
        variant="info"
        confirmLabel="Continue"
      />
    );
    expect(screen.getByRole("button", { name: "Continue" }).className).toContain(
      "bg-red-600"
    );
  });

  it("renders a dialog role for screen readers", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
