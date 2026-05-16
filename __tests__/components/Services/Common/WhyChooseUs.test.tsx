/**
 * Tests for src/components/Services/Common/WhyChooseUs.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { Star } from "lucide-react";
import WhyChooseUs from "@/components/Services/Common/WhyChooseUs";

describe("WhyChooseUs", () => {
  it("renders the default 3-item list when no `items` are supplied", () => {
    render(<WhyChooseUs />);
    expect(screen.getByText(/Why Choose/i)).toBeInTheDocument();
    expect(screen.getByText("Certified Expertise")).toBeInTheDocument();
    expect(screen.getByText("Quality Guarantee")).toBeInTheDocument();
    expect(screen.getByText("Fast Turnaround")).toBeInTheDocument();
  });

  it("renders the supplied items when provided", () => {
    render(
      <WhyChooseUs
        items={[
          {
            icon: Star,
            title: "Custom One",
            description: "Body of one.",
            bgColor: "bg-amber-50",
            textColor: "text-amber-700",
          },
        ]}
      />
    );
    expect(screen.getByText("Custom One")).toBeInTheDocument();
    expect(screen.getByText("Body of one.")).toBeInTheDocument();
    expect(screen.queryByText("Certified Expertise")).not.toBeInTheDocument();
  });
});
