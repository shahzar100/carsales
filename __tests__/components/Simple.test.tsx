/**
 * Simple test to verify Jest + React Testing Library setup
 */
import React from "react";
import { render, screen } from "@testing-library/react";

describe("Jest Setup Test", () => {
  it("should render a simple component", () => {
    const TestComponent = () => <div>Hello Test World</div>;

    render(<TestComponent />);

    expect(screen.getByText("Hello Test World")).toBeInTheDocument();
  });
});
