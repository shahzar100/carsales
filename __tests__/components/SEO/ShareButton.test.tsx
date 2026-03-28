import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ShareButton from "@/components/SEO/ShareButton";

// Mock Modal component
jest.mock("@/components/Helpful/Buttons/Modal", () => {
  return function MockModal({
    children,
    onClose,
  }: {
    children: React.ReactNode;
    onClose: () => void;
  }) {
    return (
      <div data-testid="modal" role="dialog">
        <button onClick={onClose} data-testid="close-modal">
          Close
        </button>
        {children}
      </div>
    );
  };
});

describe("ShareButton", () => {
  const defaultProps = {
    text: "Check out this car",
    title: "2023 Toyota Camry",
    url: "https://test.com/car/1",
  };

  it("renders share button", () => {
    render(<ShareButton {...defaultProps} />);
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });

  it("opens modal on click", () => {
    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /share/i }));
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("shows social platform buttons", () => {
    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /share/i }));
    expect(
      screen.getByRole("button", { name: /share on facebook/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /share on whatsapp/i })
    ).toBeInTheDocument();
  });

  it("shows copy link button", () => {
    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /share/i }));
    expect(screen.getByText("Copy link")).toBeInTheDocument();
  });

  it("shows utility options", () => {
    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /share/i }));
    expect(
      screen.getByRole("button", { name: /share via email/i })
    ).toBeInTheDocument();
  });

  it("renders in icon-only variant", () => {
    render(<ShareButton {...defaultProps} variant="icon" />);
    const button = screen.getByRole("button", { name: /share/i });
    expect(button).toBeInTheDocument();
    // Should not show "Share" text in icon-only mode
    expect(button).not.toHaveTextContent("Share");
  });

  it("renders in outline variant", () => {
    render(<ShareButton {...defaultProps} variant="outline" />);
    expect(screen.getByText("Share")).toBeInTheDocument();
  });

  it("opens social platforms in new window", () => {
    const windowOpen = jest.spyOn(window, "open").mockImplementation();
    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /share/i }));
    fireEvent.click(screen.getByRole("button", { name: /share on facebook/i }));
    expect(windowOpen).toHaveBeenCalled();
    windowOpen.mockRestore();
  });
});
