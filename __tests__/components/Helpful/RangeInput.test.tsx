import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RangeInput from "@/components/Helpful/RangeInput";

describe("RangeInput", () => {
  const defaultProps = {
    label: "Price (£)",
    minValue: null as number | null,
    maxValue: null as number | null,
    onMinChange: jest.fn(),
    onMaxChange: jest.fn(),
  };

  it("renders label", () => {
    render(<RangeInput {...defaultProps} />);
    expect(screen.getByText("Price (£)")).toBeInTheDocument();
  });

  it("renders min and max inputs", () => {
    render(<RangeInput {...defaultProps} />);
    expect(screen.getByPlaceholderText("Min")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Max")).toBeInTheDocument();
  });

  it("calls onMinChange with parsed number", () => {
    const onMinChange = jest.fn();
    render(<RangeInput {...defaultProps} onMinChange={onMinChange} />);
    fireEvent.change(screen.getByPlaceholderText("Min"), {
      target: { value: "5000" },
    });
    expect(onMinChange).toHaveBeenCalledWith(5000);
  });

  it("calls onMaxChange with parsed number", () => {
    const onMaxChange = jest.fn();
    render(<RangeInput {...defaultProps} onMaxChange={onMaxChange} />);
    fireEvent.change(screen.getByPlaceholderText("Max"), {
      target: { value: "10000" },
    });
    expect(onMaxChange).toHaveBeenCalledWith(10000);
  });

  it("calls setter with null when cleared", () => {
    const onMinChange = jest.fn();
    render(
      <RangeInput {...defaultProps} minValue={5000} onMinChange={onMinChange} />
    );
    fireEvent.change(screen.getByPlaceholderText("Min"), {
      target: { value: "" },
    });
    expect(onMinChange).toHaveBeenCalledWith(null);
  });

  it("renders custom placeholders", () => {
    render(
      <RangeInput {...defaultProps} minPlaceholder="From" maxPlaceholder="To" />
    );
    expect(screen.getByPlaceholderText("From")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("To")).toBeInTheDocument();
  });

  it("displays current values", () => {
    render(<RangeInput {...defaultProps} minValue={1000} maxValue={5000} />);
    expect(screen.getByDisplayValue("1000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5000")).toBeInTheDocument();
  });
});
