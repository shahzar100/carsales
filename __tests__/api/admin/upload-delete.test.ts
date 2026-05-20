/**
 * @jest-environment node
 *
 * Tests for /api/admin/upload/delete route (src/app/api/admin/upload/delete/route.ts)
 *
 * Standards coverage:
 * - 📋 Functional: S3 object deletion via API
 * - 🔒 Security: Authentication enforcement, key validation, path traversal prevention
 * - 🎯 Usability: Proper error messages, graceful failure handling
 */
import { NextRequest } from "next/server";

// Mock authentication
jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
  hasMinimumRole: jest.fn(),
}));
const {
  isAuthenticated: mockIsAuthenticated,
  hasMinimumRole: mockHasMinimumRole,
} = require("@/lib/utils/auth");

// Mock S3 utility
jest.mock("@/lib/utils/s3", () => ({
  deleteS3Object: jest.fn(),
}));
const { deleteS3Object: mockDeleteS3Object } = require("@/lib/utils/s3");

// Import route handler AFTER mocks are set up
import { POST } from "@/app/api/admin/upload/delete/route";

describe("/api/admin/upload/delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true); // Default to authenticated
    mockHasMinimumRole.mockResolvedValue(true); // Default to manager+
    mockDeleteS3Object.mockResolvedValue({ success: true });
  });

  const makeRequest = (body: Record<string, unknown>) =>
    new NextRequest("http://localhost:3000/api/admin/upload/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  describe("🔒 Security Standards - Authentication", () => {
    it("should return 401 when not authenticated", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = makeRequest({ key: "cars/abc-123.jpg" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it("should not call deleteS3Object when unauthenticated", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = makeRequest({ key: "cars/abc-123.jpg" });
      await POST(request);

      expect(mockDeleteS3Object).not.toHaveBeenCalled();
    });
  });

  describe("🔒 Security Standards - Input Validation", () => {
    it("should return 400 when key is missing", async () => {
      const request = makeRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should return 400 when key is empty string", async () => {
      const request = makeRequest({ key: "" });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 when key is not a string", async () => {
      const request = makeRequest({ key: 123 });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 when key doesn't start with 'cars/' or 'parts/'", async () => {
      const request = makeRequest({ key: "uploads/abc-123.jpg" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it.each([
      "admin/secret.jpg",
      "public/image.png",
      "abc-123.jpg",
      "../etc/passwd",
      "images/cars/photo.jpg",
      "/cars/photo.jpg",
    ])(
      "should return 400 for key with invalid prefix: %s",
      async (invalidKey) => {
        const request = makeRequest({ key: invalidKey });
        const response = await POST(request);

        expect(response.status).toBe(400);
      }
    );
  });

  describe("🔒 Security Standards - Path Traversal Prevention", () => {
    it("should return 400 when key contains '..'", async () => {
      const request = makeRequest({ key: "cars/../etc/passwd" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should return 400 when key contains encoded path traversal", async () => {
      const request = makeRequest({ key: "cars/%2e%2e/secret" });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 for key 'parts/../admin/config'", async () => {
      const request = makeRequest({ key: "parts/../admin/config" });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should reject NoSQL injection in key", async () => {
      const request = makeRequest({ key: { $gt: "" } });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("📋 Functional Correctness - Successful Deletion", () => {
    it("should return 200 on successful deletion with 'cars/' prefix", async () => {
      const request = makeRequest({ key: "cars/abc-123.jpg" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should return 200 on successful deletion with 'parts/' prefix", async () => {
      const request = makeRequest({ key: "parts/xyz-456.png" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should call deleteS3Object with the provided key", async () => {
      const request = makeRequest({ key: "cars/abc-123.jpg" });
      await POST(request);

      expect(mockDeleteS3Object).toHaveBeenCalledWith("cars/abc-123.jpg");
      expect(mockDeleteS3Object).toHaveBeenCalledTimes(1);
    });

    it("should handle key with nested path under valid prefix", async () => {
      const request = makeRequest({
        key: "cars/some-uuid/image.webp",
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockDeleteS3Object).toHaveBeenCalledWith(
        "cars/some-uuid/image.webp"
      );
    });
  });

  describe("🎯 Usability - Error Handling", () => {
    it("should return 500 when S3 delete fails", async () => {
      mockDeleteS3Object.mockResolvedValue({
        success: false,
        error: "S3 service unavailable",
      });

      const request = makeRequest({ key: "cars/abc-123.jpg" });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("should return error message when S3 delete fails", async () => {
      mockDeleteS3Object.mockResolvedValue({
        success: false,
        error: "AccessDenied",
      });

      const request = makeRequest({ key: "cars/abc-123.jpg" });
      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(typeof data.error).toBe("string");
    });

    it("should return 500 when deleteS3Object throws", async () => {
      mockDeleteS3Object.mockRejectedValue(new Error("Unexpected S3 error"));

      const request = makeRequest({ key: "cars/abc-123.jpg" });
      const response = await POST(request);

      expect(response.status).toBeGreaterThanOrEqual(500);
    });

    it("should handle malformed JSON body gracefully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/upload/delete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "not valid json",
        }
      );

      const response = await POST(request);

      // Should return 400 or 500, not crash
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Edge Cases", () => {
    it("should handle key with only prefix", async () => {
      const request = makeRequest({ key: "cars/" });
      const response = await POST(request);

      // Should either succeed or reject — but not crash
      expect([200, 400]).toContain(response.status);
    });

    it("should handle very long key", async () => {
      const request = makeRequest({
        key: "cars/" + "a".repeat(1000) + ".jpg",
      });
      const response = await POST(request);

      // Should handle gracefully
      expect(response.status).toBeLessThan(600);
    });
  });
});
