/**
 * Tests for src/components/Admin/Tabs/BusinessInfo/ServiceOverviewsSection.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders each service card with editable title/subtitle/
 *   price/duration/features; Add appends a new blank service with a
 *   generated id; Remove drops the right row; features split/filter.
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ServiceOverviewsSection from "@/components/Admin/Tabs/BusinessInfo/ServiceOverviewsSection";
import type { ServiceOverview } from "@/lib/interfaces";

const detailing: ServiceOverview = {
  id: "detailing",
  title: "Detailing",
  subtitle: "Inside + out",
  priceRange: "£150-£500",
  duration: "3-6h",
  features: ["Wax", "Clay"],
};

const tints: ServiceOverview = {
  id: "tints",
  title: "Tints",
  subtitle: "Windows",
  priceRange: "£200-£800",
  duration: "2-4h",
  features: ["UV", "Privacy"],
};

describe("ServiceOverviewsSection", () => {
  it("📋 renders each service overview with its fields populated", () => {
    render(
      <ServiceOverviewsSection
        overviews={[detailing, tints]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText("Service 1")).toBeInTheDocument();
    expect(screen.getByText("Service 2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Detailing")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tints")).toBeInTheDocument();
    expect(screen.getByDisplayValue("£150-£500")).toBeInTheDocument();
    expect(screen.getByDisplayValue("£200-£800")).toBeInTheDocument();
  });

  it("📋 editing the title onChanges the whole array with the patch", () => {
    const onChange = jest.fn();
    render(
      <ServiceOverviewsSection
        overviews={[detailing, tints]}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByDisplayValue("Detailing"), {
      target: { value: "Premium Detailing" },
    });
    expect(onChange).toHaveBeenCalledWith([
      { ...detailing, title: "Premium Detailing" },
      tints,
    ]);
  });

  it("📋 editing features textarea splits by newline and filters empties", () => {
    const onChange = jest.fn();
    const { container } = render(
      <ServiceOverviewsSection overviews={[detailing]} onChange={onChange} />
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Wax\nClay");
    fireEvent.change(textarea, {
      target: { value: "Wax\n\nCeramic\n" },
    });
    expect(onChange).toHaveBeenCalledWith([
      { ...detailing, features: ["Wax", "Ceramic"] },
    ]);
  });

  it("📋 Add Service appends a new blank service overview with generated id", () => {
    const onChange = jest.fn();
    render(
      <ServiceOverviewsSection overviews={[detailing]} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole("button", { name: /add service/i }));
    const call = onChange.mock.calls[0][0];
    expect(call).toHaveLength(2);
    expect(call[0]).toEqual(detailing);
    expect(call[1]).toMatchObject({
      title: "",
      subtitle: "",
      priceRange: "",
      duration: "",
      features: [],
    });
    expect(call[1].id).toMatch(/^service-/);
  });

  it("📋 Remove drops the targeted service from the array", () => {
    const onChange = jest.fn();
    render(
      <ServiceOverviewsSection
        overviews={[detailing, tints]}
        onChange={onChange}
      />
    );

    const tintsCard = screen.getByDisplayValue("Tints").closest(
      "div.rounded-lg"
    ) as HTMLElement;
    const trashBtn = within(tintsCard).getAllByRole("button")[0];
    fireEvent.click(trashBtn);

    expect(onChange).toHaveBeenCalledWith([detailing]);
  });
});
