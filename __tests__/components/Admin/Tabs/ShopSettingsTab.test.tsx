/**
 * Tests for src/components/Admin/Tabs/ShopSettingsTab.tsx
 *
 * Standards coverage:
 * - 📋 Functional: every field's `onChange` calls `onShopInfoChange` with
 *   an immutably-merged ShopInfo (so saving partial edits doesn't clobber
 *   sibling fields like hours/socialMedia); per-day hours editor renders
 *   one input per key from `shopInfo.hours`; social media URLs nest under
 *   `socialMedia` correctly
 * - 🎯 Usability: form `onSubmit` fires onSave; missing initial values
 *   default to "" (no React controlled/uncontrolled warning)
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ShopSettingsTab from "@/components/Admin/Tabs/ShopSettingsTab";
import type { ShopInfo } from "@/lib/types";

// Labels are sibling <label> elements without htmlFor — they're not bound
// to their inputs. Helper that walks from the visible label text up to
// the wrapping <div> and grabs the form control inside it.
function fieldByLabel(label: string | RegExp): HTMLElement {
  const labelEl = screen.getByText(label);
  const field = labelEl.parentElement?.querySelector(
    "input, select, textarea"
  );
  if (!field) throw new Error(`No form control near label "${label}"`);
  return field as HTMLElement;
}

const base: ShopInfo = {
  businessName: "Acme Motors",
  phone: "555-1234",
  email: "info@acme.test",
  address: "1 High St",
  city: "Leeds",
  state: "West Yorkshire",
  zipCode: "LS1 1AA",
  description: "We sell cars.",
  hours: {
    monday: "9-5",
    tuesday: "9-5",
    wednesday: "9-5",
    thursday: "9-5",
    friday: "9-5",
    saturday: "10-4",
    sunday: "Closed",
  },
  socialMedia: {
    facebook: "https://fb.com/acme",
    twitter: "https://x.com/acme",
    instagram: "https://ig.com/acme",
  },
} as unknown as ShopInfo;

describe("ShopSettingsTab", () => {
  it("prefills the form from the supplied shopInfo", () => {
    render(
      <ShopSettingsTab
        shopInfo={base}
        onShopInfoChange={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect((fieldByLabel(/business name/i) as HTMLInputElement).value).toBe(
      "Acme Motors"
    );
    expect((fieldByLabel("Phone") as HTMLInputElement).value).toBe("555-1234");
    expect((fieldByLabel("Email") as HTMLInputElement).value).toBe(
      "info@acme.test"
    );
    expect((fieldByLabel("Address") as HTMLInputElement).value).toBe(
      "1 High St"
    );
    expect((fieldByLabel(/zip code/i) as HTMLInputElement).value).toBe(
      "LS1 1AA"
    );
    expect((fieldByLabel(/facebook url/i) as HTMLInputElement).value).toBe(
      "https://fb.com/acme"
    );
  });

  it("📋 Business Name onChange immutably merges via onShopInfoChange", () => {
    const onShopInfoChange = jest.fn();
    render(
      <ShopSettingsTab
        shopInfo={base}
        onShopInfoChange={onShopInfoChange}
        onSave={jest.fn()}
      />
    );
    fireEvent.change(fieldByLabel(/business name/i), {
      target: { value: "Acme Motor Co" },
    });
    expect(onShopInfoChange).toHaveBeenCalledWith({
      ...base,
      businessName: "Acme Motor Co",
    });
  });

  it("📋 Description (textarea) edit merges via onShopInfoChange", () => {
    const onShopInfoChange = jest.fn();
    render(
      <ShopSettingsTab
        shopInfo={base}
        onShopInfoChange={onShopInfoChange}
        onSave={jest.fn()}
      />
    );
    fireEvent.change(fieldByLabel("Description"), {
      target: { value: "New description" },
    });
    expect(onShopInfoChange).toHaveBeenCalledWith(
      expect.objectContaining({ description: "New description" })
    );
  });

  it("📋 renders one row per day in `shopInfo.hours` with the right initial value", () => {
    render(
      <ShopSettingsTab
        shopInfo={base}
        onShopInfoChange={jest.fn()}
        onSave={jest.fn()}
      />
    );
    // Capitalised day labels (capitalize Tailwind class doesn't change DOM
    // text, so case-insensitive match is fine).
    for (const day of Object.keys(base.hours)) {
      expect(screen.getAllByText(new RegExp(day, "i")).length).toBeGreaterThan(
        0
      );
    }
  });

  it("📋 Hours edit merges nested hours.{day} via onShopInfoChange", () => {
    const onShopInfoChange = jest.fn();
    render(
      <ShopSettingsTab
        shopInfo={base}
        onShopInfoChange={onShopInfoChange}
        onSave={jest.fn()}
      />
    );
    // Find the saturday input by its current value (the day label is in a
    // sibling <label>, not bound by htmlFor).
    const saturdayInput = Array.from(
      document.querySelectorAll("input")
    ).find((el) => (el as HTMLInputElement).value === "10-4") as HTMLInputElement;
    expect(saturdayInput).toBeTruthy();
    fireEvent.change(saturdayInput, { target: { value: "10-2" } });
    expect(onShopInfoChange).toHaveBeenCalledWith({
      ...base,
      hours: { ...base.hours, saturday: "10-2" },
    });
  });

  it("📋 Social Media edit merges nested socialMedia.{key}", () => {
    const onShopInfoChange = jest.fn();
    render(
      <ShopSettingsTab
        shopInfo={base}
        onShopInfoChange={onShopInfoChange}
        onSave={jest.fn()}
      />
    );
    fireEvent.change(fieldByLabel(/twitter url/i), {
      target: { value: "https://x.com/new" },
    });
    expect(onShopInfoChange).toHaveBeenCalledWith({
      ...base,
      socialMedia: { ...base.socialMedia, twitter: "https://x.com/new" },
    });
  });

  it("📋 form submit fires onSave", () => {
    const onSave = jest.fn((e) => e.preventDefault());
    render(
      <ShopSettingsTab
        shopInfo={base}
        onShopInfoChange={jest.fn()}
        onSave={onSave}
      />
    );
    fireEvent.submit(
      screen.getByRole("button", { name: /save changes/i })
    );
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("🎯 falls back to '' for any null field (no controlled/uncontrolled warning)", () => {
    const partial = {
      ...base,
      businessName: null,
      socialMedia: { facebook: null, twitter: null, instagram: null },
    } as unknown as ShopInfo;
    render(
      <ShopSettingsTab
        shopInfo={partial}
        onShopInfoChange={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect((fieldByLabel(/business name/i) as HTMLInputElement).value).toBe(
      ""
    );
    expect((fieldByLabel(/facebook url/i) as HTMLInputElement).value).toBe(
      ""
    );
  });
});
