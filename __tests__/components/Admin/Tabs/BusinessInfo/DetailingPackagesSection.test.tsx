/**
 * Tests for src/components/Admin/Tabs/BusinessInfo/DetailingPackagesSection.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders each package card with editable name/subtitle/
 *   price/duration/desc + features; Add appends a new blank package with
 *   defaults; Remove drops the right row; "Popular" checkbox flips the
 *   boolean; features split by newline and filter falsy.
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import DetailingPackagesSection from "@/components/Admin/Tabs/BusinessInfo/DetailingPackagesSection";
import type { DetailingPackage } from "@/lib/interfaces";

const pkgA: DetailingPackage = {
  id: "bronze",
  name: "Bronze Pkg",
  subtitle: "Mini Valet",
  price: "£150",
  duration: "2h",
  description: "Light clean",
  exteriorFeatures: ["snow foam", "wax"],
  interiorFeatures: ["hoover"],
  popular: false,
  includesPrevious: null,
};

const pkgB: DetailingPackage = {
  ...pkgA,
  id: "silver",
  name: "Silver Pkg",
  subtitle: "Mid",
  price: "£280",
  popular: true,
  includesPrevious: "Bronze",
};

describe("DetailingPackagesSection", () => {
  it("📋 renders each package and the Add button", () => {
    render(
      <DetailingPackagesSection packages={[pkgA, pkgB]} onChange={jest.fn()} />
    );

    expect(screen.getByText("Package 1")).toBeInTheDocument();
    expect(screen.getByText("Package 2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bronze Pkg")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Silver Pkg")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add detailing package/i })
    ).toBeInTheDocument();
  });

  it("📋 editing the first package's name onChanges the whole array with the patch", () => {
    const onChange = jest.fn();
    render(
      <DetailingPackagesSection packages={[pkgA, pkgB]} onChange={onChange} />
    );

    fireEvent.change(screen.getByDisplayValue("Bronze Pkg"), {
      target: { value: "Bronze++" },
    });

    expect(onChange).toHaveBeenCalledWith([
      { ...pkgA, name: "Bronze++" },
      pkgB,
    ]);
  });

  it("📋 toggling the Popular checkbox flips the boolean for that package", () => {
    const onChange = jest.fn();
    render(
      <DetailingPackagesSection packages={[pkgA, pkgB]} onChange={onChange} />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // first card
    expect(onChange).toHaveBeenCalledWith([
      { ...pkgA, popular: true },
      pkgB,
    ]);
  });

  it("📋 editing exterior features textarea splits by newline and filters empties", () => {
    const onChange = jest.fn();
    const { container } = render(
      <DetailingPackagesSection packages={[pkgA]} onChange={onChange} />
    );

    // Two textareas: [0] exterior, [1] interior.
    const exterior = container.querySelectorAll("textarea")[0] as HTMLTextAreaElement;
    expect(exterior.value).toBe("snow foam\nwax");
    fireEvent.change(exterior, {
      target: { value: "snow foam\n\nclay bar\n" },
    });

    expect(onChange).toHaveBeenCalledWith([
      { ...pkgA, exteriorFeatures: ["snow foam", "clay bar"] },
    ]);
  });

  it("📋 Add Package appends a fresh blank package with defaults", () => {
    const onChange = jest.fn();
    render(<DetailingPackagesSection packages={[pkgA]} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", { name: /add detailing package/i })
    );
    const call = onChange.mock.calls[0][0];
    expect(call).toHaveLength(2);
    expect(call[0]).toEqual(pkgA);
    expect(call[1]).toMatchObject({
      name: "",
      subtitle: "",
      price: "",
      exteriorFeatures: [],
      interiorFeatures: [],
      popular: false,
      includesPrevious: null,
    });
    expect(call[1].id).toMatch(/^package-/);
  });

  it("📋 Remove button drops that package from the array", () => {
    const onChange = jest.fn();
    render(
      <DetailingPackagesSection packages={[pkgA, pkgB]} onChange={onChange} />
    );

    const cards = screen.getAllByText(/^Package \d+$/i).map(
      (h) => h.closest("div.rounded-lg") as HTMLElement
    );
    // First card has its own delete (trash) button — find by role within card.
    const firstCard = cards[0];
    const trashButtons = within(firstCard).getAllByRole("button");
    fireEvent.click(trashButtons[trashButtons.length - 1]);

    expect(onChange).toHaveBeenCalledWith([pkgB]);
  });

  it("📋 editing 'Includes Previous' to empty string sends null", () => {
    const onChange = jest.fn();
    render(
      <DetailingPackagesSection packages={[pkgB]} onChange={onChange} />
    );

    // pkgB.includesPrevious === "Bronze" — only field with that exact value.
    fireEvent.change(screen.getByDisplayValue("Bronze"), {
      target: { value: "" },
    });
    expect(onChange).toHaveBeenCalledWith([
      { ...pkgB, includesPrevious: null },
    ]);
  });
});
