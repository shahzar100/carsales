import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Dropdown from "@/components/Form/Dropdown";

// Mock scrollIntoView since jsdom doesn't support it
HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock Helpful Modal
jest.mock("@/components/Helpful/Buttons/Modal", () => {
  return function MockModal({ children }: { children: React.ReactNode }) {
    return <div data-testid="modal">{children}</div>;
  };
});

const options = [
  { value: "toyota", label: "Toyota" },
  { value: "bmw", label: "BMW" },
  { value: "honda", label: "Honda" },
];

describe("Dropdown", () => {
  it("renders with label", () => {
    render(<Dropdown label="Make" options={options} />);
    expect(screen.getByText("Make")).toBeInTheDocument();
  });

  it("shows required asterisk when required", () => {
    render(<Dropdown label="Make" options={options} required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("displays placeholder when no value selected", () => {
    render(
      <Dropdown options={options} placeholder="Choose a make" />
    );
    expect(screen.getByText("Choose a make")).toBeInTheDocument();
  });

  it("displays selected option label", () => {
    render(<Dropdown options={options} value="bmw" />);
    expect(screen.getByText("BMW")).toBeInTheDocument();
  });

  it("opens dropdown on click", () => {
    render(<Dropdown options={options} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("shows all options when open", () => {
    render(<Dropdown options={options} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Toyota")).toBeInTheDocument();
    expect(screen.getByText("BMW")).toBeInTheDocument();
    expect(screen.getByText("Honda")).toBeInTheDocument();
  });

  it("calls onChange when option selected", () => {
    const onChange = jest.fn();
    render(<Dropdown options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("BMW"));
    expect(onChange).toHaveBeenCalledWith("bmw");
  });

  it("closes after selection", () => {
    const onChange = jest.fn();
    render(<Dropdown options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Honda"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows error message", () => {
    render(
      <Dropdown options={options} error="Please select a make" />
    );
    expect(screen.getByText("Please select a make")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Dropdown options={options} disabled />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("does not open when disabled", () => {
    render(<Dropdown options={options} disabled />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows 'No options available' when empty", () => {
    render(<Dropdown options={[]} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("No options available")).toBeInTheDocument();
  });

  it("has proper ARIA attributes", () => {
    render(<Dropdown options={options} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-haspopup", "listbox");
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});
