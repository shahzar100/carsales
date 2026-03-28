import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorPage from "@/app/error";

describe("ErrorPage", () => {
  const mockError = new Error("Something broke") as Error & { digest?: string };
  const mockReset = jest.fn();

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders error message", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    expect(
      screen.getByText(/An unexpected error occurred/)
    ).toBeInTheDocument();
  });

  it("renders Try Again button", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("calls reset when Try Again is clicked", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByText("Try Again"));
    expect(mockReset).toHaveBeenCalled();
  });

  it("renders Back to Home link", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    const link = screen.getByText("Back to Home");
    expect(link).toHaveAttribute("href", "/");
  });

  it("shows error digest when present", () => {
    const errorWithDigest = new Error("Error") as Error & { digest?: string };
    errorWithDigest.digest = "abc123";
    render(<ErrorPage error={errorWithDigest} reset={mockReset} />);
    expect(screen.getByText("Error ID: abc123")).toBeInTheDocument();
  });

  it("does not show error digest when absent", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    expect(screen.queryByText(/Error ID/)).not.toBeInTheDocument();
  });
});
