import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Form from "@/components/Form/Form";

// Mock FormPrimitives
jest.mock("@/components/Form/FormPrimitives", () => ({
  NextButton: ({
    onClick,
    disabled,
  }: {
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} data-testid="next-btn">
      Next
    </button>
  ),
  PreviousButton: ({
    onClick,
    disabled,
  }: {
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} data-testid="prev-btn">
      Previous
    </button>
  ),
  SubmitButton: ({
    label,
    loading,
    disabled,
  }: {
    label?: string;
    loading?: boolean;
    disabled?: boolean;
  }) => (
    <button
      type="submit"
      disabled={disabled || loading}
      data-testid="submit-btn"
    >
      {loading ? "Submitting..." : label || "Submit"}
    </button>
  ),
}));

describe("Form", () => {
  const createSteps = () => [
    {
      title: "Step 1",
      description: "First step",
      content: <div>Step 1 Content</div>,
    },
    {
      title: "Step 2",
      description: "Second step",
      content: <div>Step 2 Content</div>,
    },
    {
      title: "Step 3",
      description: "Third step",
      content: <div>Step 3 Content</div>,
    },
  ];

  it("renders the first step by default", () => {
    render(<Form steps={createSteps()} onSubmit={jest.fn()} />);
    expect(screen.getByText("Step 1 Content")).toBeInTheDocument();
    // "Step 1" appears both in stepper label and heading
    expect(screen.getAllByText("Step 1").length).toBeGreaterThanOrEqual(2);
  });

  it("shows step counter", () => {
    render(<Form steps={createSteps()} onSubmit={jest.fn()} />);
    expect(
      screen.getByText(
        (content) =>
          content.includes("1") &&
          content.includes("of") &&
          content.includes("3")
      )
    ).toBeInTheDocument();
  });

  it("disables previous button on first step", () => {
    render(<Form steps={createSteps()} onSubmit={jest.fn()} />);
    expect(screen.getByTestId("prev-btn")).toBeDisabled();
  });

  it("advances to next step on Next click", () => {
    render(<Form steps={createSteps()} onSubmit={jest.fn()} />);
    fireEvent.click(screen.getByTestId("next-btn"));
    expect(screen.getByText("Step 2 Content")).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) =>
          content.includes("2") &&
          content.includes("of") &&
          content.includes("3")
      )
    ).toBeInTheDocument();
  });

  it("goes back to previous step", () => {
    render(<Form steps={createSteps()} onSubmit={jest.fn()} />);
    fireEvent.click(screen.getByTestId("next-btn"));
    fireEvent.click(screen.getByTestId("prev-btn"));
    expect(screen.getByText("Step 1 Content")).toBeInTheDocument();
  });

  it("shows submit button on last step", () => {
    render(<Form steps={createSteps()} onSubmit={jest.fn()} />);
    fireEvent.click(screen.getByTestId("next-btn"));
    fireEvent.click(screen.getByTestId("next-btn"));
    expect(screen.getByTestId("submit-btn")).toBeInTheDocument();
  });

  it("calls onSubmit when form is submitted", async () => {
    const onSubmit = jest.fn();
    render(<Form steps={createSteps()} onSubmit={onSubmit} />);

    // Navigate to last step
    fireEvent.click(screen.getByTestId("next-btn"));
    fireEvent.click(screen.getByTestId("next-btn"));

    // Submit
    fireEvent.click(screen.getByTestId("submit-btn"));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("disables next button when validation fails", () => {
    const steps = [
      {
        title: "Step 1",
        content: <div>Content</div>,
        validate: () => "Please fill required fields" as string | true,
      },
      { title: "Step 2", content: <div>Step 2</div> },
    ];

    render(<Form steps={steps} onSubmit={jest.fn()} />);
    // Next button should be disabled when validation fails
    expect(screen.getByTestId("next-btn")).toBeDisabled();
  });

  it("does not advance when validation fails", () => {
    const steps = [
      {
        title: "Step 1",
        content: <div>Step 1 Content</div>,
        validate: () => "Error" as string | true,
      },
      { title: "Step 2", content: <div>Step 2 Content</div> },
    ];

    render(<Form steps={steps} onSubmit={jest.fn()} />);
    fireEvent.click(screen.getByTestId("next-btn"));
    expect(screen.getByText("Step 1 Content")).toBeInTheDocument();
    expect(screen.queryByText("Step 2 Content")).not.toBeInTheDocument();
  });

  it("renders step descriptions", () => {
    render(<Form steps={createSteps()} onSubmit={jest.fn()} />);
    // Description appears in both stepper label and content area
    expect(screen.getAllByText("First step").length).toBeGreaterThanOrEqual(1);
  });

  it("uses custom submit label", () => {
    const steps = [{ title: "Only Step", content: <div>Content</div> }];
    render(<Form steps={steps} onSubmit={jest.fn()} submitLabel="Book Now" />);
    expect(screen.getByTestId("submit-btn")).toHaveTextContent("Book Now");
  });
});
