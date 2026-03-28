import React from "react";
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("renders 404 heading", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders not found message", () => {
    render(<NotFound />);
    expect(
      screen.getByText("This page could not be found.")
    ).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<NotFound />);
    expect(
      screen.getByText(/doesn't exist or has been moved/)
    ).toBeInTheDocument();
  });

  it("renders Back to Home link pointing to /", () => {
    render(<NotFound />);
    const link = screen.getByText("Back to Home");
    expect(link).toHaveAttribute("href", "/");
  });
});
