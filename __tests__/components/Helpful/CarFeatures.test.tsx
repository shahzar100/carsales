import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CarFeatures from "@/components/Helpful/CarFeatures";

// Mock Button
jest.mock("@/components/Helpful/Buttons/Button", () => {
  return function MockButton({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) {
    return <button onClick={onClick}>{children}</button>;
  };
});

describe("CarFeatures", () => {
  const features = [
    "Bluetooth",
    "Cruise Control",
    "Heated Seats",
    "Parking Sensors",
  ];

  it("renders all feature buttons", () => {
    render(
      <CarFeatures
        allFeatures={features}
        selectedFeatures={[]}
        onToggle={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(screen.getByText("Bluetooth")).toBeInTheDocument();
    expect(screen.getByText("Cruise Control")).toBeInTheDocument();
    expect(screen.getByText("Heated Seats")).toBeInTheDocument();
    expect(screen.getByText("Parking Sensors")).toBeInTheDocument();
  });

  it("renders label", () => {
    render(
      <CarFeatures
        allFeatures={features}
        selectedFeatures={[]}
        onToggle={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(screen.getByText("Features")).toBeInTheDocument();
  });

  it("shows selected count badge", () => {
    render(
      <CarFeatures
        allFeatures={features}
        selectedFeatures={["Bluetooth", "Cruise Control"]}
        onToggle={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows clear all button when features are selected", () => {
    render(
      <CarFeatures
        allFeatures={features}
        selectedFeatures={["Bluetooth"]}
        onToggle={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("calls onToggle when a feature is clicked", () => {
    const onToggle = jest.fn();
    render(
      <CarFeatures
        allFeatures={features}
        selectedFeatures={[]}
        onToggle={onToggle}
        onClearAll={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText("Bluetooth"));
    expect(onToggle).toHaveBeenCalledWith("Bluetooth");
  });

  it("calls onClearAll when clear button is clicked", () => {
    const onClearAll = jest.fn();
    render(
      <CarFeatures
        allFeatures={features}
        selectedFeatures={["Bluetooth"]}
        onToggle={jest.fn()}
        onClearAll={onClearAll}
      />
    );
    fireEvent.click(screen.getByText("Clear all"));
    expect(onClearAll).toHaveBeenCalled();
  });

  it("shows 'No features available' when empty", () => {
    render(
      <CarFeatures
        allFeatures={[]}
        selectedFeatures={[]}
        onToggle={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(screen.getByText("No features available")).toBeInTheDocument();
  });

  it("marks selected features with checkmark prefix", () => {
    render(
      <CarFeatures
        allFeatures={features}
        selectedFeatures={["Bluetooth"]}
        onToggle={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    // Selected feature has "✓ " prefix
    expect(screen.getByText(/✓.*Bluetooth/)).toBeInTheDocument();
  });
});
