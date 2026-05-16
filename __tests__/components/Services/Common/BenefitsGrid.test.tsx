/**
 * Tests for src/components/Services/Common/BenefitsGrid.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { Shield, Clock, Star } from "lucide-react";
import BenefitsGrid from "@/components/Services/Common/BenefitsGrid";

const sample = [
  { icon: Shield, title: "Quality", description: "Warranty backed." },
  { icon: Clock, title: "Fast", description: "Same-day turnaround." },
  { icon: Star, title: "Top rated", description: "4.9 avg." },
];

describe("BenefitsGrid", () => {
  it("renders the default 'Benefits' title and each benefit", () => {
    render(<BenefitsGrid benefits={sample} />);
    expect(screen.getByText("Benefits")).toBeInTheDocument();
    for (const b of sample) {
      expect(screen.getByText(b.title)).toBeInTheDocument();
      expect(screen.getByText(b.description)).toBeInTheDocument();
    }
  });

  it("uses a custom title when supplied", () => {
    render(<BenefitsGrid benefits={sample} title="Why us" />);
    expect(screen.getByText("Why us")).toBeInTheDocument();
  });

  it("applies dark-mode classes when dark=true", () => {
    const { container } = render(<BenefitsGrid benefits={sample} dark />);
    expect(container.innerHTML).toContain("text-white");
    expect(container.innerHTML).toContain("border-white/10");
  });

  it("picks the right column class for columns=4 / 3 / 2", () => {
    const { container, rerender } = render(
      <BenefitsGrid benefits={sample} columns={4} />
    );
    expect(container.innerHTML).toContain("lg:grid-cols-4");
    rerender(<BenefitsGrid benefits={sample} columns={3} />);
    expect(container.innerHTML).toContain("md:grid-cols-3");
    rerender(<BenefitsGrid benefits={sample} columns={2} />);
    // 2-column variant falls back to "sm:grid-cols-2" only.
    expect(container.innerHTML).toContain("sm:grid-cols-2");
  });
});
