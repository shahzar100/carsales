/**
 * @jest-environment node
 */
import { GET } from "@/app/api/bussinessinfo/route";
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

    it("should return default shop info when no shop info exists in database", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.businessName).toBe(process.env.NEXT_BUSINESS_NAME);
      expect(data.data.address).toBe(process.env.NEXT_BUSINESS_ADDRESS);
      expect(data.data.phone).toBe(process.env.NEXT_BUSINESS_PHONE);
      expect(data.data.email).toBe(process.env.NEXT_BUSINESS_EMAIL);
    });

    it("should handle database connection errors gracefully", async () => {
      // Mock MongoDB to throw an error
      const originalEnv = process.env.MONGODB_URI;
      process.env.MONGODB_URI = "invalid-uri";

      const response = await GET();

      expect(response.status).toBe(500);

      // Restore original environment
      process.env.MONGODB_URI = originalEnv;
    });
  });
});
