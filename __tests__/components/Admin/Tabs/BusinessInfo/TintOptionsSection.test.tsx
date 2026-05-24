/**
 * Tests for src/components/Admin/Tabs/BusinessInfo/TintOptionsSection.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders each tint card with all editable fields,
 *   Popular toggle works, Add appends a blank tint, features
 *   textarea splits by newline.
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import TintOptionsSection from "@/components/Admin/Tabs/BusinessInfo/TintOptionsSection";
import type { TintOption } from "@/lib/interfaces";

const ceramic: TintOption = {
  name: "Ceramic Premium",
  type: "Ceramic",
  price: "£400-£800",
  vlt: "5%, 20%",
  warranty: "Lifetime",
  description: "Top tier",
  features: ["UV", "Heat"],
  popular: true,
};

const carbon: TintOption = {
  name: "Carbon Series",
  type: "Carbon",
  price: "£300-£600",
  vlt: "20%",
  warranty: "10y",
  description: "Mid tier",
  features: ["UV"],
  popular: false,
};

describe("TintOptionsSection", () => {
  it("📋 renders each tint option with all editable fields populated", () => {
    render(
      <TintOptionsSection options={[ceramic, carbon]} onChange={jest.fn()} />
    );

    expect(screen.getByText("Tint Option 1")).toBeInTheDocument();
    expect(screen.getByText("Tint Option 2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ceramic Premium")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Carbon Series")).toBeInTheDocument();
    expect(screen.getByDisplayValue("£400-£800")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Lifetime")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Top tier")).toBeInTheDocument();
  });

  it("📋 editing the name patches just that tint", () => {
    const onChange = jest.fn();
    render(
      <TintOptionsSection options={[ceramic, carbon]} onChange={onChange} />
    );

    fireEvent.change(screen.getByDisplayValue("Ceramic Premium"), {
      target: { value: "Ceramic Pro" },
    });
    expect(onChange).toHaveBeenCalledWith([
      { ...ceramic, name: "Ceramic Pro" },
      carbon,
    ]);
  });

  it("📋 unticking Popular flips the boolean for the right tint", () => {
    const onChange = jest.fn();
    render(
      <TintOptionsSection options={[ceramic, carbon]} onChange={onChange} />
    );

    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(checkboxes[0].checked).toBe(true);
    fireEvent.click(checkboxes[0]);
    expect(onChange).toHaveBeenCalledWith([
      { ...ceramic, popular: false },
      carbon,
    ]);
  });

  it("📋 editing features textarea splits by newline and filters empties", () => {
    const onChange = jest.fn();
    const { container } = render(
      <TintOptionsSection options={[carbon]} onChange={onChange} />
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: "UV\n\nHeat\n" },
    });
    expect(onChange).toHaveBeenCalledWith([
      { ...carbon, features: ["UV", "Heat"] },
    ]);
  });

  it("📋 Add appends a new blank tint with sensible defaults", () => {
    const onChange = jest.fn();
    render(<TintOptionsSection options={[ceramic]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /add tint option/i }));
    const call = onChange.mock.calls[0][0];
    expect(call).toHaveLength(2);
    expect(call[0]).toEqual(ceramic);
    expect(call[1]).toMatchObject({
      name: "",
      type: "",
      price: "",
      vlt: "",
      warranty: "",
      description: "",
      features: [],
      popular: false,
    });
  });

  it("📋 Remove drops the targeted tint from the array", () => {
    const onChange = jest.fn();
    render(
      <TintOptionsSection options={[ceramic, carbon]} onChange={onChange} />
    );

    const carbonCard = screen.getByDisplayValue("Carbon Series").closest(
      "div.rounded-lg"
    ) as HTMLElement;
    const trashBtn = within(carbonCard).getAllByRole("button")[0];
    fireEvent.click(trashBtn);

    expect(onChange).toHaveBeenCalledWith([ceramic]);
  });
});
