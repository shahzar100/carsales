import { GET } from "@/app/api/admin/health/route";

// Mock auth
jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
}));

// Mock getHealthData
jest.mock("@/components/Admin/Dashboard/Status/getHealthData", () => ({
  getHealthData: jest.fn(),
}));

import { isAuthenticated } from "@/lib/utils/auth";
import { getHealthData } from "@/components/Admin/Dashboard/Status/getHealthData";

const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>;
const mockGetHealthData = getHealthData as jest.MockedFunction<
  typeof getHealthData
>;

describe("GET /api/admin/health", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockIsAuthenticated.mockResolvedValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
    expect(mockGetHealthData).not.toHaveBeenCalled();
  });

  it("returns health data when authenticated", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const healthData = {
      status: "healthy",
      database: "connected",
      uptime: 12345,
    };
    mockGetHealthData.mockResolvedValue(healthData as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(healthData);
  });
});
