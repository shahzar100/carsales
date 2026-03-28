import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FormButton,
  NextButton,
  PreviousButton,
  SubmitButton,
  Badge,
  InfoBanner,
  SelectionCard,
  CopyableCode,
  FormInput,
  FormTextarea,
  FormToggle,
  SummaryRow,
  SummaryCard,
} from "@/components/Form/FormPrimitives";

describe("FormButton", () => {
  it("renders children", () => {
    render(<FormButton>Click Me</FormButton>);
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<FormButton onClick={onClick}>Click</FormButton>);
    fireEvent.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<FormButton disabled>Disabled</FormButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows loading state", () => {
    render(
      <FormButton loading loadingText="Loading...">
        Submit
      </FormButton>
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders icon on left", () => {
    render(
      <FormButton icon={<span data-testid="icon">→</span>} iconPosition="left">
        Next
      </FormButton>
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});

describe("NextButton", () => {
  it("renders 'Next' text", () => {
    render(<NextButton onClick={jest.fn()} />);
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<NextButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});

describe("PreviousButton", () => {
  it("renders 'Previous' text", () => {
    render(<PreviousButton onClick={jest.fn()} />);
    expect(screen.getByText("Previous")).toBeInTheDocument();
  });
});

describe("SubmitButton", () => {
  it("renders default label", () => {
    render(<SubmitButton />);
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<SubmitButton label="Book Now" />);
    expect(screen.getByText("Book Now")).toBeInTheDocument();
  });

  it("is a submit button type", () => {
    render(<SubmitButton />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders icon", () => {
    render(
      <Badge icon={<span data-testid="badge-icon">★</span>}>Premium</Badge>
    );
    expect(screen.getByTestId("badge-icon")).toBeInTheDocument();
  });
});

describe("InfoBanner", () => {
  it("renders children", () => {
    render(<InfoBanner>Important notice</InfoBanner>);
    expect(screen.getByText("Important notice")).toBeInTheDocument();
  });

  it("renders with different variants", () => {
    const { rerender } = render(
      <InfoBanner variant="warning">Warning</InfoBanner>
    );
    expect(screen.getByText("Warning")).toBeInTheDocument();

    rerender(<InfoBanner variant="error">Error</InfoBanner>);
    expect(screen.getByText("Error")).toBeInTheDocument();

    rerender(<InfoBanner variant="success">Success</InfoBanner>);
    expect(screen.getByText("Success")).toBeInTheDocument();
  });
});

describe("SelectionCard", () => {
  it("renders title and description", () => {
    render(
      <SelectionCard
        selected={false}
        onSelect={jest.fn()}
        title="Option A"
        description="Description A"
      />
    );
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Description A")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = jest.fn();
    render(
      <SelectionCard selected={false} onSelect={onSelect} title="Option" />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("renders items list", () => {
    render(
      <SelectionCard
        selected={false}
        onSelect={jest.fn()}
        title="Option"
        items={["Item 1", "Item 2"]}
      />
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });
});

describe("CopyableCode", () => {
  it("renders value", () => {
    render(<CopyableCode value="BK-ABC123" />);
    expect(screen.getByText("BK-ABC123")).toBeInTheDocument();
  });

  it("renders custom title", () => {
    render(<CopyableCode value="test" title="Booking Reference" />);
    expect(screen.getByText("Booking Reference")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<CopyableCode value="test" description="Save this code" />);
    expect(screen.getByText("Save this code")).toBeInTheDocument();
  });
});

describe("FormInput", () => {
  it("renders label", () => {
    render(<FormInput label="Name" value="" onChange={jest.fn()} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("shows required asterisk", () => {
    render(<FormInput label="Email" value="" onChange={jest.fn()} required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("calls onChange on input", () => {
    const onChange = jest.fn();
    render(<FormInput label="Name" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "John" },
    });
    expect(onChange).toHaveBeenCalledWith("John");
  });
});

describe("FormTextarea", () => {
  it("renders label", () => {
    render(<FormTextarea label="Notes" value="" onChange={jest.fn()} />);
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("calls onChange on input", () => {
    const onChange = jest.fn();
    render(<FormTextarea label="Notes" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Test note" },
    });
    expect(onChange).toHaveBeenCalledWith("Test note");
  });
});

describe("FormToggle", () => {
  it("renders label", () => {
    render(<FormToggle label="Enable" checked={false} onChange={jest.fn()} />);
    expect(screen.getByText("Enable")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(
      <FormToggle
        label="Enable"
        description="Turn this on"
        checked={false}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText("Turn this on")).toBeInTheDocument();
  });

  it("toggles on click", () => {
    const onChange = jest.fn();
    render(<FormToggle label="Enable" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("has correct aria-checked", () => {
    render(<FormToggle label="Enable" checked={true} onChange={jest.fn()} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });
});

describe("SummaryRow", () => {
  it("renders label and value", () => {
    render(<SummaryRow label="Name" value="John Doe" />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders dash when no value", () => {
    render(<SummaryRow label="Name" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders children instead of value", () => {
    render(
      <SummaryRow label="Status">
        <span>Active</span>
      </SummaryRow>
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});

describe("SummaryCard", () => {
  it("renders title", () => {
    render(
      <SummaryCard>
        <SummaryRow label="Test" value="Value" />
      </SummaryCard>
    );
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });

  it("renders custom title", () => {
    render(
      <SummaryCard title="Booking Details">
        <SummaryRow label="Test" value="Value" />
      </SummaryCard>
    );
    expect(screen.getByText("Booking Details")).toBeInTheDocument();
  });
});
