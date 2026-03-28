import React from "react";
import { render, screen } from "@testing-library/react";
import Grid from "@/components/Helpful/Grid";

describe("Grid", () => {
  it("renders children", () => {
    render(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders with grid layout class", () => {
    const { container } = render(
      <Grid>
        <span>test</span>
      </Grid>
    );
    expect(container.firstChild).toHaveClass("grid");
  });
});
