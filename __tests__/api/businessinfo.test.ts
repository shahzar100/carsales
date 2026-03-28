import { GET } from "@/app/api/businessinfo/route";

// Mock businessInfo util
jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: jest.fn(),
}));

import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { createTestShopInfo } from "../utils/testUtils";

const mockGetBusinessInfo = getBusinessInfo as jest.MockedFunction<
  typeof getBusinessInfo
>;

describe("GET /api/businessinfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns business info successfully", async () => {
    const shopInfo = createTestShopInfo();
    mockGetBusinessInfo.mockResolvedValue(shopInfo as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.businessName).toBe("Test Motor Company");
    expect(data.data.phone).toBe("555-123-4567");
    expect(data.data.email).toBe("test@testmotor.com");
  });

  it("includes cache control headers", async () => {
    const shopInfo = createTestShopInfo();
    mockGetBusinessInfo.mockResolvedValue(shopInfo as any);

    const response = await GET();

    expect(response.headers.get("Cache-Control")).toContain("public");
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=60");
  });

  it("returns 500 on error", async () => {
    mockGetBusinessInfo.mockRejectedValue(new Error("DB error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
