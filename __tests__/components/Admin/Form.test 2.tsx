/**
 * FORM COMPONENT TESTS
 * Tests the reusable multi-stage Form component:
 *  - Step rendering & navigation (next / previous)
 *  - Validation gating (blocks next if invalid)
 *  - Step indicator states (active / completed / pending)
 *  - Submit flow with loading state
 */
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Form, { FormStep } from "@/components/Form/Form";

// ── Helpers ──────────────────────────────────────────────────
const buildSteps = (overrides: Partial<FormStep>[] = []): FormStep[] => {
  const defaults: FormStep[] = [
    {
      title: "Step One",
      description: "First step description",
      content: <div data-testid="step-1-content">Step 1 content</div>,
      validate: () => true,
    },
    {
      title: "Step Two",
      description: "Second step description",
      content: <div data-testid="step-2-content">Step 2 content</div>,
      validate: () => true,
    },
    {
      title: "Step Three",
      description: "Third step description",
      content: <div data-testid="step-3-content">Step 3 content</div>,
    },
  ];

  return defaults.map((step, i) => ({ ...step, ...overrides[i] }));
};

describe("Form Component — Multi-Stage Navigation", () => {
  let onSubmit: jest.Mock;

  beforeEach(() => {
    onSubmit = jest.fn();
  });

  afterEach(cleanup);

  // ── Rendering ────────────────────────────────────────────
  describe("Initial Render", () => {
    it("renders the first step content by default", () => {
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);
      expect(screen.getByTestId("step-1-content")).toBeInTheDocument();
      expect(screen.queryByTestId("step-2-content")).not.toBeInTheDocument();
    });

    it("shows all step titles in the progress indicator", () => {
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);
      expect(screen.getByText("Step One")).toBeInTheDocument();
      expect(screen.getByText("Step Two")).toBeInTheDocument();
      expect(screen.getByText("Step Three")).toBeInTheDocument();
    });

    it("displays the step counter as 'Step 1 of 3'", () => {
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });

    it("shows Next button on non-last steps and not Submit", () => {
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.queryByText("Submit")).not.toBeInTheDocument();
    });

    it("disables the Previous button on the first step", () => {
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);
      const prevButton = screen.getByText("Previous").closest("button")!;
      expect(prevButton).toBeDisabled();
    });
  });

  // ── Navigation ───────────────────────────────────────────
  describe("Step Navigation", () => {
    it("advances to next step when Next is clicked", async () => {
      const user = userEvent.setup();
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);

      await user.click(screen.getByText("Next"));

      expect(screen.getByTestId("step-2-content")).toBeInTheDocument();
      expect(screen.queryByTestId("step-1-content")).not.toBeInTheDocument();
      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    });

    it("goes back to previous step when Previous is clicked", async () => {
      const user = userEvent.setup();
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);

      await user.click(screen.getByText("Next"));
      expect(screen.getByTestId("step-2-content")).toBeInTheDocument();

      await user.click(screen.getByText("Previous"));
      expect(screen.getByTestId("step-1-content")).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });

    it("enables Previous button after advancing past step 1", async () => {
      const user = userEvent.setup();
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);

      await user.click(screen.getByText("Next"));
      const prevButton = screen.getByText("Previous").closest("button")!;
      expect(prevButton).not.toBeDisabled();
    });

    it("shows the Submit button on the last step", async () => {
      const user = userEvent.setup();
      render(
        <Form steps={buildSteps()} onSubmit={onSubmit} submitLabel="Save" />
      );

      // Go to step 3
      await user.click(screen.getByText("Next"));
      await user.click(screen.getByText("Next"));

      expect(screen.getByText("Save")).toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });
  });

  // ── Validation ───────────────────────────────────────────
  describe("Step Validation", () => {
    it("blocks navigation when validation fails", async () => {
      const user = userEvent.setup();
      const steps = buildSteps([{ validate: () => "Field X is required" }]);
      render(<Form steps={steps} onSubmit={onSubmit} />);

      await user.click(screen.getByText("Next"));

      // Should stay on step 1
      expect(screen.getByTestId("step-1-content")).toBeInTheDocument();
      expect(screen.getByText("Field X is required")).toBeInTheDocument();
    });

    it("clears validation error when going back", async () => {
      const user = userEvent.setup();
      let shouldFail = true;
      const steps = buildSteps([
        { validate: () => true },
        { validate: () => (shouldFail ? "Error on step 2" : true) },
      ]);
      render(<Form steps={steps} onSubmit={onSubmit} />);

      // Go to step 2
      await user.click(screen.getByText("Next"));
      // Try to go to step 3 (fails)
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Error on step 2")).toBeInTheDocument();

      // Go back — error should clear
      await user.click(screen.getByText("Previous"));
      expect(screen.queryByText("Error on step 2")).not.toBeInTheDocument();
    });

    it("allows navigation when validation passes", async () => {
      const user = userEvent.setup();
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);

      await user.click(screen.getByText("Next"));
      expect(screen.getByTestId("step-2-content")).toBeInTheDocument();
    });

    it("steps without validate() always pass", async () => {
      const user = userEvent.setup();
      const steps: FormStep[] = [
        {
          title: "A",
          content: <div data-testid="a">A</div>,
          // no validate
        },
        {
          title: "B",
          content: <div data-testid="b">B</div>,
        },
      ];
      render(<Form steps={steps} onSubmit={onSubmit} />);

      await user.click(screen.getByText("Next"));
      expect(screen.getByTestId("b")).toBeInTheDocument();
    });
  });

  // ── Submission ───────────────────────────────────────────
  describe("Form Submission", () => {
    it("calls onSubmit when the submit button is clicked on the last step", async () => {
      const user = userEvent.setup();
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);

      // Navigate to last step
      await user.click(screen.getByText("Next"));
      await user.click(screen.getByText("Next"));

      // Submit
      await user.click(screen.getByText("Submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it("uses the custom submitLabel text", async () => {
      const user = userEvent.setup();
      render(
        <Form
          steps={buildSteps()}
          onSubmit={onSubmit}
          submitLabel="Create User"
        />
      );

      await user.click(screen.getByText("Next"));
      await user.click(screen.getByText("Next"));

      expect(screen.getByText("Create User")).toBeInTheDocument();
    });

    it("blocks submit when last-step validation fails", async () => {
      const user = userEvent.setup();
      const steps = buildSteps([
        {},
        {},
        { validate: () => "Status is required" },
      ]);
      render(<Form steps={steps} onSubmit={onSubmit} />);

      await user.click(screen.getByText("Next"));
      await user.click(screen.getByText("Next"));
      await user.click(screen.getByText("Submit"));

      expect(screen.getByText("Status is required")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("shows a generic error message when onSubmit throws", async () => {
      const user = userEvent.setup();
      onSubmit.mockRejectedValueOnce(new Error("server error"));
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);

      await user.click(screen.getByText("Next"));
      await user.click(screen.getByText("Next"));
      await user.click(screen.getByText("Submit"));

      await waitFor(() => {
        expect(
          screen.getByText("Something went wrong. Please try again.")
        ).toBeInTheDocument();
      });
    });
  });

  // ── Step indicator ───────────────────────────────────────
  describe("Step Progress Indicator", () => {
    it("marks completed steps with a check icon", async () => {
      const user = userEvent.setup();
      render(<Form steps={buildSteps()} onSubmit={onSubmit} />);

      await user.click(screen.getByText("Next"));

      // The first step button should now contain a check (SVG)
      const stepButtons = screen.getAllByRole("button");
      // Step 1 circle is the first one, should have the check class
      const step1Circle = stepButtons[0]; // first step button
      // Completed step circles get emerald colouring
      expect(step1Circle.className).toContain("emerald");
    });
  });
});
