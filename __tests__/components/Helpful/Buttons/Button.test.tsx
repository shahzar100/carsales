import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "@/components/Helpful/Buttons/Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when loading", () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders with primary variant by default", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("bg-red-600");
  });

  it("renders with outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("border");
  });

  it("renders with ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("text-gray-500");
  });

  it("renders with danger variant", () => {
    render(<Button variant="danger">Danger</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("bg-red-600");
  });

  it("renders with success variant", () => {
    render(<Button variant="success">Success</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("bg-green-600");
  });

  it("renders with different sizes", () => {
    const { rerender } = render(<Button size="sm">SM</Button>);
    expect(screen.getByRole("button")).toHaveClass("p-2");

    rerender(<Button size="lg">LG</Button>);
    expect(screen.getByRole("button")).toHaveClass("py-3");
  });

  it("renders with custom width class", () => {
    render(<Button customWidth="w-full">Full</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("defaults to button type", () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("can be submit type", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
