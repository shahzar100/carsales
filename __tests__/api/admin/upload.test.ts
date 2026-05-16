/**
 * @jest-environment node
 *
 * Tests for /api/admin/upload (src/app/api/admin/upload/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: auth-gated; content type allow-list; folder allow-list;
 *   contentLength required and capped (so a leaked presigned URL can't
 *   upload arbitrarily large files); filename is sanitised against
 *   path-traversal characters
 * - 📋 Functional: returns presigned uploadUrl + canonical publicUrl + key
 *   that the admin client persists on the car/parts record
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
}));
const { isAuthenticated: mockIsAuthenticated } = require("@/lib/utils/auth");

jest.mock("@/lib/utils/s3", () => ({
  generatePresignedUploadUrl: jest.fn(),
  getPublicUrl: jest.fn(),
  MAX_UPLOAD_BYTES: 10 * 1024 * 1024,
}));
const {
  generatePresignedUploadUrl: mockGenerateUrl,
  getPublicUrl: mockGetPublicUrl,
} = require("@/lib/utils/s3");

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-1234"),
}));

import { POST } from "@/app/api/admin/upload/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/admin/upload", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/admin/upload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true);
    mockGenerateUrl.mockResolvedValue("https://signed.example/u/123");
    mockGetPublicUrl.mockReturnValue("https://cdn.example/cars/uuid-x.jpg");
  });

  it("🔒 returns 401 when not authenticated", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    const res = await POST(
      makeRequest({
        contentType: "image/jpeg",
        fileName: "x.jpg",
        folder: "cars",
        contentLength: 1024,
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for malformed JSON body", async () => {
    const res = await POST(makeRequest("not-json"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid json/i);
  });

  it.each([
    ["missing contentType", { fileName: "x.jpg", folder: "cars", contentLength: 1 }, /contentType/i],
    ["missing fileName", { contentType: "image/jpeg", folder: "cars", contentLength: 1 }, /fileName/i],
    ["missing folder", { contentType: "image/jpeg", fileName: "x.jpg", contentLength: 1 }, /folder/i],
    ["missing contentLength", { contentType: "image/jpeg", fileName: "x.jpg", folder: "cars" }, /contentLength/i],
  ])("returns 400 when %s", async (_label, body, errorPattern) => {
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(errorPattern);
  });

  it.each([
    "text/plain",
    "application/javascript",
    "image/svg+xml",
    "image/gif",
    "application/octet-stream",
  ])("🔒 rejects disallowed content type: %s", async (badType) => {
    const res = await POST(
      makeRequest({
        contentType: badType,
        fileName: "x.jpg",
        folder: "cars",
        contentLength: 1024,
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid content type/i);
  });

  it("🔒 rejects folders outside the allow-list", async () => {
    const res = await POST(
      makeRequest({
        contentType: "image/jpeg",
        fileName: "x.jpg",
        folder: "evil",
        contentLength: 1024,
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid folder/i);
  });

  it.each([0, -1, "1024", NaN, Infinity])(
    "🔒 rejects non-positive / non-finite contentLength: %p",
    async (badLength) => {
      const res = await POST(
        makeRequest({
          contentType: "image/jpeg",
          fileName: "x.jpg",
          folder: "cars",
          contentLength: badLength,
        })
      );
      expect(res.status).toBe(400);
    }
  );

  it("🔒 returns 413 when contentLength exceeds MAX_UPLOAD_BYTES (10 MB)", async () => {
    const res = await POST(
      makeRequest({
        contentType: "image/jpeg",
        fileName: "huge.jpg",
        folder: "cars",
        contentLength: 11 * 1024 * 1024,
      })
    );
    expect(res.status).toBe(413);
    expect((await res.json()).error).toMatch(/too large/i);
  });

  it("🔒 sanitises path-traversal characters out of the fileName", async () => {
    await POST(
      makeRequest({
        contentType: "image/jpeg",
        fileName: "../../../etc/passwd.jpg",
        folder: "cars",
        contentLength: 1024,
      })
    );
    const calledKey = mockGenerateUrl.mock.calls[0][0];
    expect(calledKey).not.toContain("..");
    expect(calledKey).not.toContain("/etc/");
    expect(calledKey.startsWith("cars/")).toBe(true);
  });

  it("🔒 strips unsafe characters from the fileName but preserves dot/dash/underscore", async () => {
    await POST(
      makeRequest({
        contentType: "image/jpeg",
        fileName: "my photo (1)*.jpg",
        folder: "cars",
        contentLength: 1024,
      })
    );
    const calledKey = mockGenerateUrl.mock.calls[0][0];
    // Spaces and parens should be gone; dot + extension preserved.
    expect(calledKey).toContain(".jpg");
    expect(calledKey).not.toMatch(/[() *]/);
  });

  it("📋 returns the presigned URL, key, public URL, and max-bytes hint", async () => {
    mockGenerateUrl.mockResolvedValue("https://signed.example/u/abc");
    mockGetPublicUrl.mockReturnValue("https://cdn.example/cars/k.jpg");

    const res = await POST(
      makeRequest({
        contentType: "image/png",
        fileName: "k.png",
        folder: "parts",
        contentLength: 4096,
      })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.uploadUrl).toBe("https://signed.example/u/abc");
    expect(json.publicUrl).toBe("https://cdn.example/cars/k.jpg");
    expect(json.maxBytes).toBe(10 * 1024 * 1024);
    expect(json.key).toMatch(/^parts\/test-uuid-1234-k\.png$/);
    // ContentLength must thread through to the signer so S3 enforces it.
    expect(mockGenerateUrl).toHaveBeenCalledWith(
      expect.any(String),
      "image/png",
      4096
    );
  });

  it("returns 500 with a generic message when the S3 signer throws unexpectedly", async () => {
    mockGenerateUrl.mockRejectedValue(new Error("S3 down"));
    const res = await POST(
      makeRequest({
        contentType: "image/jpeg",
        fileName: "x.jpg",
        folder: "cars",
        contentLength: 1024,
      })
    );
    expect(res.status).toBe(500);
  });
});
