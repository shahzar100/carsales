import { getBusinessInfo, updateBusinessInfo } from "@/lib/utils/businessInfo";
import { getTestCollections } from "./testUtils";

describe("businessInfo utility", () => {
  describe("getBusinessInfo", () => {
    it("seeds and returns business info on first call", async () => {
      const result = await getBusinessInfo();

      expect(result).toBeDefined();
      expect(result.businessName).toBe("MMC Leeds");
      expect(result.phone).toBe("0113 468 9292");
      expect(result.email).toBe("info@mmcleeds.co.uk");
      expect(result.address).toBe("Roseville Road");
      expect(result.city).toBe("Leeds");
    });

    it("returns detailing packages", async () => {
      const result = await getBusinessInfo();

      expect(result.detailingPackages).toBeDefined();
      expect(result.detailingPackages.length).toBe(3);
      expect(result.detailingPackages[0].id).toBe("bronze");
      expect(result.detailingPackages[1].id).toBe("silver");
      expect(result.detailingPackages[2].id).toBe("gold");
    });

    it("returns tint options", async () => {
      const result = await getBusinessInfo();

      expect(result.tintOptions).toBeDefined();
      expect(result.tintOptions.length).toBe(3);
      expect(result.tintOptions[0].type).toBe("Ceramic");
    });

    it("returns service overviews", async () => {
      const result = await getBusinessInfo();

      expect(result.serviceOverviews).toBeDefined();
      expect(result.serviceOverviews.length).toBeGreaterThanOrEqual(3);
    });

    it("returns recovery info", async () => {
      const result = await getBusinessInfo();

      expect(result.recovery).toBeDefined();
      expect(result.recovery?.responseTime).toBeDefined();
      expect(result.recovery?.coverageAreas).toBeDefined();
      expect(result.recovery?.pricingTiers).toBeDefined();
    });

    it("returns hours object", async () => {
      const result = await getBusinessInfo();

      expect(result.hours).toBeDefined();
      expect(result.hours.monday).toBe("9:00 AM - 6:00 PM");
      expect(result.hours.sunday).toBe("Closed");
    });

    it("does not re-seed on subsequent calls", async () => {
      // First call seeds
      const first = await getBusinessInfo();
      // Second call reads existing
      const second = await getBusinessInfo();

      expect(first.businessName).toBe(second.businessName);
      expect(first.detailingPackages.length).toBe(
        second.detailingPackages.length
      );
    });
  });

  describe("updateBusinessInfo", () => {
    it("updates core fields", async () => {
      // First seed the data
      await getBusinessInfo();

      // Update core field
      await updateBusinessInfo({ phone: "999-999-9999" });

      const result = await getBusinessInfo();
      expect(result.phone).toBe("999-999-9999");
    });

    it("updates detailing packages", async () => {
      await getBusinessInfo();

      const newPackages = [
        {
          id: "custom",
          name: "Custom Package",
          subtitle: "Custom",
          price: "£100",
          priceInPence: 10000,
          duration: "1 hour",
          description: "Test",
          exteriorFeatures: ["Wash"],
          interiorFeatures: ["Vacuum"],
          popular: false,
          includesPrevious: null,
        },
      ];

      await updateBusinessInfo({
        detailingPackages: newPackages as any,
      });

      const result = await getBusinessInfo();
      expect(result.detailingPackages.length).toBe(1);
      expect(result.detailingPackages[0].id).toBe("custom");
    });

    it("updates tint options", async () => {
      await getBusinessInfo();

      await updateBusinessInfo({
        tintOptions: [] as any,
      });

      const result = await getBusinessInfo();
      expect(result.tintOptions.length).toBe(0);
    });

    it("updates recovery info", async () => {
      await getBusinessInfo();

      await updateBusinessInfo({
        recovery: {
          coverageAreas: ["Test Area"],
          pricingTiers: [{ name: "Test", price: "£50", distance: "5 miles" }],
          responseTime: "10 mins",
        } as any,
      });

      const result = await getBusinessInfo();
      expect(result.recovery?.responseTime).toBe("10 mins");
      expect(result.recovery?.coverageAreas).toEqual(["Test Area"]);
    });

    it("handles empty update", async () => {
      await getBusinessInfo();
      // Should not throw on empty update
      await updateBusinessInfo({});
      const result = await getBusinessInfo();
      expect(result).toBeDefined();
    });
  });
});
