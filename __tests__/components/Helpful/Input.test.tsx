import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Input from "@/components/Helpful/Input";

describe("Input", () => {
  it("renders with default type text", () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "text");
  });

  it("renders placeholder", () => {
    const onChange = jest.fn();
    render(<Input placeholder="Enter value" onChange={onChange} />);
    expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
  });

  it("renders with value", () => {
    const onChange = jest.fn();
    render(<Input value="test" onChange={onChange} />);
    expect(screen.getByDisplayValue("test")).toBeInTheDocument();
  });

  it("calls onChange when text is entered", () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "hello" },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it("renders with custom type", () => {
    const onChange = jest.fn();
    const { container } = render(<Input type="email" onChange={onChange} />);
    expect(container.querySelector("input")).toHaveAttribute("type", "email");
  });
});
