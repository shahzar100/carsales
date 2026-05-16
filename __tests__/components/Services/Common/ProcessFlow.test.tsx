/**
 * Tests for src/components/Services/Common/ProcessFlow.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import ProcessFlow from "@/components/Services/Common/ProcessFlow";

const steps = [
  { step: 1, title: "Book online", description: "Pick a slot in under a minute." },
  { step: 2, title: "Bring the car", description: "Drop it off at the showroom." },
  { step: 3, title: "Pick it up", description: "We'll let you know when it's ready." },
];

describe("ProcessFlow", () => {
  it("renders the title and each step's title, number, description", () => {
    render(<ProcessFlow title="How it works" steps={steps} />);
    expect(screen.getByText("How it works")).toBeInTheDocument();
    for (const s of steps) {
      expect(screen.getByText(String(s.step))).toBeInTheDocument();
      expect(screen.getByText(s.title)).toBeInTheDocument();
      expect(screen.getByText(s.description)).toBeInTheDocument();
    }
  });

  it("applies dark-mode classes when dark=true", () => {
    const { container } = render(
      <ProcessFlow title="Dark" steps={steps} dark />
    );
    // Title gets the white text class in dark mode.
    expect(container.innerHTML).toContain("text-white");
    expect(container.innerHTML).toContain("text-gray-400");
  });

  it("honours a custom accentColor in light mode", () => {
    const { container } = render(
      <ProcessFlow
        title="Custom"
        steps={steps}
        accentColor="bg-purple-100 text-purple-600"
      />
    );
    expect(container.innerHTML).toContain("bg-purple-100");
    expect(container.innerHTML).toContain("text-purple-600");
  });
});
