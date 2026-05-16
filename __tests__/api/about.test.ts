import { GET } from "@/app/api/about/route";
import { getTestCollections, createTestShopInfo } from "../utils/testUtils";

// Mock businessInfo util
jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: jest.fn(),
}));

import { getBusinessInfo } from "@/lib/utils/businessInfo";
const mockGetBusinessInfo = getBusinessInfo as jest.MockedFunction<
  typeof getBusinessInfo
>;

describe("GET /api/about", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns business info and car stats", async () => {
    const { cars, client } = await getTestCollections();
    // Seed cars
    await cars.insertMany([
      {
        make: "Toyota",
        model: "Camry",
        year: 2023,
        price: 25000,
        status: "available",
        mileage: 10000,
        fuel: "Petrol",
        transmission: "Automatic",
        doors: 4,
        colour: "White",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        make: "BMW",
        model: "X5",
        year: 2022,
        price: 45000,
        status: "available",
        mileage: 20000,
        fuel: "Diesel",
        transmission: "Automatic",
        doors: 4,
        colour: "Black",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        make: "Honda",
        model: "Civic",
        year: 2021,
        price: 18000,
        status: "sold",
        mileage: 30000,
        fuel: "Petrol",
        transmission: "Manual",
        doors: 4,
        colour: "Red",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const shopInfo = createTestShopInfo();
    mockGetBusinessInfo.mockResolvedValue(shopInfo as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.businessInfo).toBeDefined();
    expect(data.data.carStats.total).toBe(3);
    expect(data.data.carStats.available).toBe(2);
    expect(data.data.carStats.sold).toBe(1);
    expect(data.data.carStats.makes).toBe(2); // Toyota, BMW are available
    expect(data.data.carStats.makesList).toContain("Toyota");
    expect(data.data.carStats.makesList).toContain("BMW");

    // Check cache headers
    expect(response.headers.get("Cache-Control")).toContain("public");

    await client.close();
  });

  it("returns zero stats when no cars exist", async () => {
    const shopInfo = createTestShopInfo();
    mockGetBusinessInfo.mockResolvedValue(shopInfo as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.carStats.total).toBe(0);
    expect(data.data.carStats.available).toBe(0);
    expect(data.data.carStats.sold).toBe(0);
    expect(data.data.carStats.makes).toBe(0);
    expect(data.data.carStats.makesList).toEqual([]);
  });

  it("returns 500 when getBusinessInfo throws", async () => {
    mockGetBusinessInfo.mockRejectedValue(new Error("DB error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
