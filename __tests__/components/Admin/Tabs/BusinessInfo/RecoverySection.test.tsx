/**
 * Tests for src/components/Admin/Tabs/BusinessInfo/RecoverySection.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders response-time, coverage-areas textarea, and
 *   pricing tier rows; edits flow through onChange; Add appends an empty
 *   tier; Remove drops the right tier; coverage textarea splits/filters.
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import RecoverySection, {
  type RecoveryValue,
} from "@/components/Admin/Tabs/BusinessInfo/RecoverySection";

const baseRecovery: RecoveryValue = {
  coverageAreas: ["Leeds", "Bradford"],
  pricingTiers: [
    { name: "Local", price: "£60", distance: "10mi" },
    { name: "Regional", price: "£95", distance: "30mi" },
  ],
  responseTime: "30 minutes",
};

describe("RecoverySection", () => {
  it("📋 renders response time, coverage textarea, and pricing tiers", () => {
    const { container } = render(
      <RecoverySection recovery={baseRecovery} onChange={jest.fn()} />
    );

    expect(screen.getByDisplayValue("30 minutes")).toBeInTheDocument();
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Leeds\nBradford");
    expect(screen.getByDisplayValue("Local")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Regional")).toBeInTheDocument();
    expect(screen.getByDisplayValue("£60")).toBeInTheDocument();
    expect(screen.getByDisplayValue("£95")).toBeInTheDocument();
  });

  it("📋 editing response time onChanges the recovery payload", () => {
    const onChange = jest.fn();
    render(<RecoverySection recovery={baseRecovery} onChange={onChange} />);

    fireEvent.change(screen.getByDisplayValue("30 minutes"), {
      target: { value: "45 minutes" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...baseRecovery,
      responseTime: "45 minutes",
    });
  });

  it("📋 editing coverage areas textarea splits by newline and filters empties", () => {
    const onChange = jest.fn();
    const { container } = render(
      <RecoverySection recovery={baseRecovery} onChange={onChange} />
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: "Leeds\n\nYork\n" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...baseRecovery,
      coverageAreas: ["Leeds", "York"],
    });
  });

  it("📋 editing a tier price preserves other fields in that tier", () => {
    const onChange = jest.fn();
    render(<RecoverySection recovery={baseRecovery} onChange={onChange} />);

    fireEvent.change(screen.getByDisplayValue("£60"), {
      target: { value: "£70" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...baseRecovery,
      pricingTiers: [
        { name: "Local", price: "£70", distance: "10mi" },
        { name: "Regional", price: "£95", distance: "30mi" },
      ],
    });
  });

  it("📋 Add Pricing Tier appends an empty tier", () => {
    const onChange = jest.fn();
    render(<RecoverySection recovery={baseRecovery} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", { name: /add pricing tier/i })
    );

    expect(onChange).toHaveBeenCalledWith({
      ...baseRecovery,
      pricingTiers: [
        ...baseRecovery.pricingTiers,
        { name: "", price: "", distance: "" },
      ],
    });
  });

  it("📋 Remove drops the right tier from the array", () => {
    const onChange = jest.fn();
    render(<RecoverySection recovery={baseRecovery} onChange={onChange} />);

    // Each tier row has one trash button (icon button without label text).
    const localRow = screen.getByDisplayValue("Local").closest(
      "div.flex.items-start.gap-3"
    ) as HTMLElement;
    const trashBtn = within(localRow).getByRole("button");
    fireEvent.click(trashBtn);

    expect(onChange).toHaveBeenCalledWith({
      ...baseRecovery,
      pricingTiers: [
        { name: "Regional", price: "£95", distance: "30mi" },
      ],
    });
  });
});
