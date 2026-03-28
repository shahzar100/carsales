import React from "react";
import { render, screen } from "@testing-library/react";
import GridItem from "@/components/Helpful/GridItem";

describe("GridItem", () => {
  it("renders children", () => {
    render(
      <GridItem>
        <span>Content</span>
      </GridItem>
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders with grid class", () => {
    const { container } = render(
      <GridItem>
        <span>Item</span>
      </GridItem>
    );
    expect(container.firstChild).toHaveClass("grid");
  });
});
