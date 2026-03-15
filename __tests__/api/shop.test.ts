/**
 * @jest-environment node
 */
import { GET } from "@/app/api/businessinfo/route";
import { getTestCollections, createTestShopInfo } from "../utils/testUtils";

describe("/api/shop", () => {
  afterEach(async () => {
    // Clean up after each test
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("GET", () => {
    it("should return shop info when it exists in database", async () => {
      // Seed database with shop info
      const { shopInfo, client } = await getTestCollections();
      const testShopInfo = createTestShopInfo();
      await shopInfo.insertOne(testShopInfo);
      await client.close();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.businessName).toBe(testShopInfo.businessName);
      expect(data.data.address).toBe(testShopInfo.address);
      expect(data.data.phone).toBe(testShopInfo.phone);
    });

    it("should return null data when no shop info exists in database", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeNull();
    });

    it("should handle database connection errors gracefully", async () => {
      // Use jest.resetModules + doMock to override getter-only ESM exports
      jest.resetModules();
      jest.doMock("@/lib/models", () => {
        const actual = jest.requireActual("@/lib/models");
        return {
          ...actual,
          getBussinessInfoCollection: jest
            .fn()
            .mockRejectedValue(new Error("DB error")),
        };
      });
      const { GET: mockedGET } = require("@/app/api/businessinfo/route");

      const response = await mockedGET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
