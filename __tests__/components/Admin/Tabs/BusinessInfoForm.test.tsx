/**
 * BUSINESSINFOFORM COMPONENT TESTS
 *
 * Admin form that edits the singleton `shopInfo` document. The form is
 * fully controlled — every input fires `onShopInfoChange` with the
 * merged ShopInfo — and submission delegates to `onSave`. The component
 * is currently 1,143 LOC and bundles 8 collapsible sections + 4
 * sub-editors (Detailing / Tint / ServiceOverview / Recovery).
 *
 * These tests cover the cross-cutting behaviour only:
 *  - Structure (right sections appear with right titles).
 *  - Collapsible Section default state.
 *  - Controlled inputs: typing in a field invokes onShopInfoChange with
 *    the merged document (proves the update() reducer is correct).
 *  - Save: clicking the submit button invokes onSave.
 *  - Sub-editor add/remove for Detailing Packages (representative — the
 *    other sub-editors share the same pattern).
 *
 * Per-section round-trip tests (every field in every section) are
 * deferred until Day 7's planned split of BusinessInfoForm into one
 * file per section, which will make per-section testing tractable.
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BusinessInfoForm from "@/components/Admin/Tabs/BusinessInfoForm";
import type { ShopInfo } from "@/lib/interfaces";

const makeShopInfo = (overrides: Partial<ShopInfo> = {}): ShopInfo => ({
  businessName: "Morley Motor Company",
  address: "123 Test Street",
  city: "Leeds",
  state: "West Yorkshire",
  zipCode: "LS27 0AB",
  phone: "0113 000 0000",
  email: "hello@morleymotor.test",
  hours: {
    monday: "9–6",
    tuesday: "9–6",
    wednesday: "9–6",
    thursday: "9–6",
    friday: "9–6",
    saturday: "10–4",
    sunday: "Closed",
  },
  updatedAt: new Date("2026-05-12T00:00:00Z"),
  ...overrides,
});

const renderForm = (
  shopInfo: ShopInfo = makeShopInfo(),
  handlers: {
    onShopInfoChange?: jest.Mock;
    onSave?: jest.Mock;
  } = {}
) => {
  const onShopInfoChange = handlers.onShopInfoChange ?? jest.fn();
  const onSave = handlers.onSave ?? jest.fn((e) => e.preventDefault());
  render(
    <BusinessInfoForm
      shopInfo={shopInfo}
      onShopInfoChange={onShopInfoChange}
      onSave={onSave}
    />
  );
  return { onShopInfoChange, onSave };
};

describe("BusinessInfoForm Component", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(cleanup);

  // ── Structure ────────────────────────────────────────────────
  describe("Structure", () => {
    it("renders the page title and description", () => {
      renderForm();
      expect(
        screen.getByRole("heading", { name: "Business Settings" })
      ).toBeInTheDocument();
    });

    it("renders all eight section headers", () => {
      renderForm();
      expect(screen.getByText("Business Information")).toBeInTheDocument();
      expect(screen.getByText("Business Hours")).toBeInTheDocument();
      expect(screen.getByText("Social Media")).toBeInTheDocument();
      expect(screen.getByText("Homepage Stats")).toBeInTheDocument();
      expect(screen.getByText("Detailing Packages")).toBeInTheDocument();
      expect(screen.getByText("Window Tinting Options")).toBeInTheDocument();
      expect(screen.getByText("Service Overviews")).toBeInTheDocument();
      expect(screen.getByText("Breakdown Recovery")).toBeInTheDocument();
    });

    it("renders the 'Save All Changes' submit button", () => {
      renderForm();
      expect(
        screen.getByRole("button", { name: /Save All Changes/i })
      ).toBeInTheDocument();
    });

    it("opens the Business Information section by default (defaultOpen)", () => {
      renderForm();
      // Core fields visible without expanding anything
      expect(screen.getByDisplayValue("Morley Motor Company")).toBeInTheDocument();
      expect(screen.getByDisplayValue("hello@morleymotor.test")).toBeInTheDocument();
    });

    it("keeps secondary sections collapsed by default", () => {
      renderForm();
      // Social Media URL fields are only rendered when its section is open
      expect(
        screen.queryByPlaceholderText("https://facebook.com/yourbusiness")
      ).not.toBeInTheDocument();
    });
  });

  // ── Section expand/collapse ──────────────────────────────────
  describe("Section expand/collapse", () => {
    it("expands Social Media when its header is clicked", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByText("Social Media"));
      expect(
        screen.getByPlaceholderText("https://facebook.com/yourbusiness")
      ).toBeInTheDocument();
    });

    it("collapses Business Information back when re-clicked", async () => {
      const user = userEvent.setup();
      renderForm();
      // Initially open
      expect(
        screen.getByDisplayValue("Morley Motor Company")
      ).toBeInTheDocument();
      await user.click(screen.getByText("Business Information"));
      expect(
        screen.queryByDisplayValue("Morley Motor Company")
      ).not.toBeInTheDocument();
    });
  });

  // ── Controlled inputs ────────────────────────────────────────
  describe("Controlled fields fire onShopInfoChange with merged state", () => {
    it("typing into Business Name emits the merged ShopInfo", () => {
      const { onShopInfoChange } = renderForm();
      const input = screen.getByDisplayValue("Morley Motor Company");
      fireEvent.change(input, { target: { value: "Morley Motors Ltd" } });
      expect(onShopInfoChange).toHaveBeenCalledTimes(1);
      expect(onShopInfoChange).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: "Morley Motors Ltd",
          // Other top-level keys are preserved through the merge
          email: "hello@morleymotor.test",
          city: "Leeds",
        })
      );
    });

    it("typing into Address preserves other fields", () => {
      const { onShopInfoChange } = renderForm();
      const input = screen.getByDisplayValue("123 Test Street");
      fireEvent.change(input, { target: { value: "1 New Lane" } });
      expect(onShopInfoChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          address: "1 New Lane",
          businessName: "Morley Motor Company",
        })
      );
    });

    it("hours editor emits a merged hours object", async () => {
      const user = userEvent.setup();
      const { onShopInfoChange } = renderForm();
      await user.click(screen.getByText("Business Hours"));

      // Find the input whose row label is "monday"
      const mondayRow = screen
        .getByText(/^monday$/i)
        .parentElement! as HTMLElement;
      const mondayInput = within(mondayRow).getByDisplayValue("9–6");
      fireEvent.change(mondayInput, { target: { value: "10–7" } });

      expect(onShopInfoChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          hours: expect.objectContaining({
            monday: "10–7",
            tuesday: "9–6",
            sunday: "Closed",
          }),
        })
      );
    });

    it("Social Media inputs nest into socialMedia.*", async () => {
      const user = userEvent.setup();
      const { onShopInfoChange } = renderForm();
      await user.click(screen.getByText("Social Media"));
      const facebook = screen.getByPlaceholderText(
        "https://facebook.com/yourbusiness"
      );
      fireEvent.change(facebook, {
        target: { value: "https://facebook.com/morleymotor" },
      });
      expect(onShopInfoChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          socialMedia: expect.objectContaining({
            facebook: "https://facebook.com/morleymotor",
          }),
        })
      );
    });
  });

  // ── Submit ───────────────────────────────────────────────────
  describe("Save submission", () => {
    it("clicking Save All Changes fires onSave", async () => {
      const user = userEvent.setup();
      const { onSave } = renderForm();
      await user.click(
        screen.getByRole("button", { name: /Save All Changes/i })
      );
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  // ── Detailing sub-editor (representative add/remove pattern) ─
  describe("Detailing Packages sub-editor", () => {
    it("shows the Add button and no packages when list is empty", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByText("Detailing Packages"));
      expect(screen.getByText("Add Detailing Package")).toBeInTheDocument();
      expect(screen.queryByText(/^Package 1$/)).not.toBeInTheDocument();
    });

    it("Add Detailing Package emits a new packages array", async () => {
      const user = userEvent.setup();
      const { onShopInfoChange } = renderForm();
      await user.click(screen.getByText("Detailing Packages"));
      await user.click(screen.getByText("Add Detailing Package"));
      expect(onShopInfoChange).toHaveBeenCalledTimes(1);
      const payload = onShopInfoChange.mock.calls[0][0];
      expect(payload.detailingPackages).toHaveLength(1);
      expect(payload.detailingPackages[0]).toEqual(
        expect.objectContaining({
          name: "",
          subtitle: "",
          price: "",
          popular: false,
        })
      );
    });

    it("renders existing packages with their Name field populated", async () => {
      const user = userEvent.setup();
      renderForm(
        makeShopInfo({
          detailingPackages: [
            {
              id: "pkg-1",
              name: "Detailing Bronze",
              subtitle: "Exterior wash + interior vacuum",
              price: "£60",
              duration: "1h",
              description: "Entry-level",
              exteriorFeatures: ["wash", "wax"],
              interiorFeatures: ["vacuum"],
              popular: false,
              includesPrevious: null,
            },
          ],
        })
      );
      await user.click(screen.getByText("Detailing Packages"));
      expect(screen.getByText("Package 1")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Detailing Bronze")
      ).toBeInTheDocument();
    });
  });
});
