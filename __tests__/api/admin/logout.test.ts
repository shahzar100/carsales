/**
 * @jest-environment node
 *
 * Tests for /api/admin/logout route (src/app/api/admin/logout/route.ts)
 *
 * Standards coverage:
 * - 📋 Functional: Logout destroys session
 * - 🔒 Security: Session destruction
 */
import { POST } from "@/app/api/admin/logout/route";

// Mock auth - use inline function to avoid hoisting issues
const mockDestroy = jest.fn();
jest.mock("@/lib/utils/auth", () => {
  const destroy = jest.fn();
  return {
    getSession: jest.fn().mockResolvedValue({
      destroy,
    }),
    __mockDestroy: destroy,
  };
});
const { __mockDestroy } = require("@/lib/utils/auth") as {
  __mockDestroy: jest.Mock;
};

describe("/api/admin/logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {
    it("should destroy the session and return success", async () => {
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Logged out successfully");
      expect(__mockDestroy).toHaveBeenCalledTimes(1);
    });

    it("should return 500 when session destruction fails", async () => {
      const auth = require("@/lib/utils/auth");
      auth.getSession.mockRejectedValueOnce(new Error("Session error"));

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
