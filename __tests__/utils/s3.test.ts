/**
 * @jest-environment node
 *
 * Tests for S3 client utility (src/lib/utils/s3.ts)
 *
 * Standards coverage:
 * - 📋 Functional: Presigned URL generation, object deletion, public URL construction
 * - 🔒 Security: Content type validation, credential handling
 * - 🎯 Usability: Graceful error handling, clear error messages
 */

// Mock the AWS SDK before importing the module under test
const mockGetSignedUrl = jest.fn();
const mockS3Send = jest.fn();

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send,
  })),
  PutObjectCommand: jest.fn().mockImplementation((params) => ({
    ...params,
    _type: "PutObjectCommand",
  })),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => ({
    ...params,
    _type: "DeleteObjectCommand",
  })),
}));

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

describe("S3 Client Utility", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = {
      ...originalEnv,
      AWS_REGION: "eu-west-2",
      AWS_ACCESS_KEY_ID: "test-access-key",
      AWS_SECRET_ACCESS_KEY: "test-secret-key",
      S3_BUCKET_NAME: "test-bucket",
      CLOUDFRONT_DOMAIN: "d1234567890.cloudfront.net",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("generatePresignedUploadUrl", () => {
    describe("📋 Functional Correctness", () => {
      it("should return a presigned URL string for valid content type", async () => {
        mockGetSignedUrl.mockResolvedValue(
          "https://test-bucket.s3.eu-west-2.amazonaws.com/cars/test-key?X-Amz-Signature=abc123"
        );

        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");
        const url = await generatePresignedUploadUrl(
          "cars/abc-123.jpg",
          "image/jpeg",
          1024
        );

        expect(typeof url).toBe("string");
        expect(url).toContain("https://");
        expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
      });

      it("should accept image/jpeg content type", async () => {
        mockGetSignedUrl.mockResolvedValue("https://presigned-url.com");

        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");
        const url = await generatePresignedUploadUrl(
          "cars/test.jpg",
          "image/jpeg",
          1024
        );

        expect(url).toBe("https://presigned-url.com");
      });

      it("should accept image/png content type", async () => {
        mockGetSignedUrl.mockResolvedValue("https://presigned-url.com");

        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");
        const url = await generatePresignedUploadUrl(
          "cars/test.png",
          "image/png",
          1024
        );

        expect(url).toBe("https://presigned-url.com");
      });

      it("should accept image/webp content type", async () => {
        mockGetSignedUrl.mockResolvedValue("https://presigned-url.com");

        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");
        const url = await generatePresignedUploadUrl(
          "cars/test.webp",
          "image/webp",
          1024
        );

        expect(url).toBe("https://presigned-url.com");
      });

      it("should accept image/avif content type", async () => {
        mockGetSignedUrl.mockResolvedValue("https://presigned-url.com");

        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");
        const url = await generatePresignedUploadUrl(
          "cars/test.avif",
          "image/avif",
          1024
        );

        expect(url).toBe("https://presigned-url.com");
      });

      it("should pass the correct bucket and key to PutObjectCommand", async () => {
        mockGetSignedUrl.mockResolvedValue("https://presigned-url.com");
        const { PutObjectCommand } = require("@aws-sdk/client-s3");

        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");
        await generatePresignedUploadUrl(
          "cars/my-image.jpg",
          "image/jpeg",
          1024
        );

        expect(PutObjectCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            Bucket: "test-bucket",
            Key: "cars/my-image.jpg",
            ContentType: "image/jpeg",
          })
        );
      });
    });

    describe("🔒 Security Standards - Content Type Validation", () => {
      it.each([
        "text/plain",
        "application/javascript",
        "text/html",
        "application/pdf",
        "image/svg+xml",
        "image/gif",
        "application/octet-stream",
        "",
      ])(
        "should reject invalid content type: %s",
        async (invalidContentType) => {
          const { generatePresignedUploadUrl } = require("@/lib/utils/s3");

          await expect(
            generatePresignedUploadUrl("cars/test.file", invalidContentType, 1024)
          ).rejects.toThrow();
        }
      );

      it("should reject content type with case manipulation (IMAGE/JPEG)", async () => {
        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");

        // Only exact lowercase MIME types should be accepted
        await expect(
          generatePresignedUploadUrl("cars/test.jpg", "IMAGE/JPEG", 1024)
        ).rejects.toThrow();
      });

      it("should reject content type with extra parameters", async () => {
        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");

        await expect(
          generatePresignedUploadUrl(
            "cars/test.jpg",
            "image/jpeg; charset=utf-8",
            1024
          )
        ).rejects.toThrow();
      });
    });

    describe("🔒 Security Standards - Content Length Validation", () => {
      it.each([0, -1, NaN, Infinity, -Infinity])(
        "should reject non-positive / non-finite contentLength: %p",
        async (badLength) => {
          const { generatePresignedUploadUrl } = require("@/lib/utils/s3");
          await expect(
            generatePresignedUploadUrl(
              "cars/test.jpg",
              "image/jpeg",
              badLength as number
            )
          ).rejects.toThrow(/positive number/);
        }
      );

      it("should reject contentLength above MAX_UPLOAD_BYTES (10 MB)", async () => {
        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");
        await expect(
          generatePresignedUploadUrl(
            "cars/huge.jpg",
            "image/jpeg",
            10 * 1024 * 1024 + 1
          )
        ).rejects.toThrow(/too large/i);
      });

      it("should accept contentLength at exactly MAX_UPLOAD_BYTES", async () => {
        mockGetSignedUrl.mockResolvedValue("https://presigned-url.com");
        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");
        await expect(
          generatePresignedUploadUrl(
            "cars/edge.jpg",
            "image/jpeg",
            10 * 1024 * 1024
          )
        ).resolves.toBe("https://presigned-url.com");
      });

      it("should pass ContentLength through to PutObjectCommand", async () => {
        mockGetSignedUrl.mockResolvedValue("https://presigned-url.com");
        const { PutObjectCommand } = require("@aws-sdk/client-s3");
        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");
        await generatePresignedUploadUrl("cars/x.jpg", "image/jpeg", 4096);
        expect(PutObjectCommand).toHaveBeenCalledWith(
          expect.objectContaining({ ContentLength: 4096 })
        );
      });
    });

    describe("🎯 Usability - Error Handling", () => {
      it("should propagate AWS SDK errors", async () => {
        mockGetSignedUrl.mockRejectedValue(
          new Error("AWS credentials expired")
        );

        const { generatePresignedUploadUrl } = require("@/lib/utils/s3");

        await expect(
          generatePresignedUploadUrl("cars/test.jpg", "image/jpeg", 1024)
        ).rejects.toThrow();
      });
    });
  });

  describe("deleteS3Object", () => {
    describe("📋 Functional Correctness", () => {
      it("should call S3 DeleteObjectCommand with correct params", async () => {
        mockS3Send.mockResolvedValue({});
        const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

        const { deleteS3Object } = require("@/lib/utils/s3");
        await deleteS3Object("cars/abc-123.jpg");

        expect(DeleteObjectCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            Bucket: "test-bucket",
            Key: "cars/abc-123.jpg",
          })
        );
        expect(mockS3Send).toHaveBeenCalledTimes(1);
      });

      it("should return success result on successful deletion", async () => {
        mockS3Send.mockResolvedValue({});

        const { deleteS3Object } = require("@/lib/utils/s3");
        const result = await deleteS3Object("parts/xyz-456.png");

        expect(result).toMatchObject({
          success: true,
        });
      });
    });

    describe("🎯 Usability - Graceful Error Handling", () => {
      it("should not throw when S3 delete fails", async () => {
        mockS3Send.mockRejectedValue(new Error("S3 AccessDenied"));

        const { deleteS3Object } = require("@/lib/utils/s3");

        // Should NOT throw — returns error info instead
        const result = await deleteS3Object("cars/fail.jpg");

        expect(result).toBeDefined();
        expect(result.success).toBe(false);
      });

      it("should return error info when deletion fails", async () => {
        mockS3Send.mockRejectedValue(new Error("NoSuchKey"));

        const { deleteS3Object } = require("@/lib/utils/s3");
        const result = await deleteS3Object("cars/nonexistent.jpg");

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it("should handle network timeout errors gracefully", async () => {
        mockS3Send.mockRejectedValue(new Error("Network timeout"));

        const { deleteS3Object } = require("@/lib/utils/s3");
        const result = await deleteS3Object("cars/timeout.jpg");

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe("getPublicUrl", () => {
    describe("📋 Functional Correctness", () => {
      it("should return CloudFront URL when CLOUDFRONT_DOMAIN is set", () => {
        const { getPublicUrl } = require("@/lib/utils/s3");
        const url = getPublicUrl("cars/abc-123.jpg");

        expect(url).toBe("https://d1234567890.cloudfront.net/cars/abc-123.jpg");
      });

      it("should construct URL correctly with nested key paths", () => {
        const { getPublicUrl } = require("@/lib/utils/s3");
        const url = getPublicUrl("parts/some-uuid/image.webp");

        expect(url).toBe(
          "https://d1234567890.cloudfront.net/parts/some-uuid/image.webp"
        );
      });

      it("should handle keys with special allowed characters", () => {
        const { getPublicUrl } = require("@/lib/utils/s3");
        const url = getPublicUrl("cars/my-car_image-123.avif");

        expect(url).toBe(
          "https://d1234567890.cloudfront.net/cars/my-car_image-123.avif"
        );
      });
    });

    describe("📋 Functional - CloudFront Fallback", () => {
      it("should fall back to S3 direct URL when CLOUDFRONT_DOMAIN is not set", () => {
        delete process.env.CLOUDFRONT_DOMAIN;

        // Re-require to pick up changed env
        jest.resetModules();

        // Re-mock AWS SDK after resetModules
        jest.mock("@aws-sdk/client-s3", () => ({
          S3Client: jest.fn().mockImplementation(() => ({
            send: mockS3Send,
          })),
          PutObjectCommand: jest.fn(),
          DeleteObjectCommand: jest.fn(),
        }));
        jest.mock("@aws-sdk/s3-request-presigner", () => ({
          getSignedUrl: mockGetSignedUrl,
        }));

        const { getPublicUrl } = require("@/lib/utils/s3");
        const url = getPublicUrl("cars/abc-123.jpg");

        expect(url).toContain("test-bucket");
        expect(url).toContain("cars/abc-123.jpg");
        expect(url).toMatch(/^https:\/\//);
        // Should be S3 direct URL format
        expect(url).not.toContain("cloudfront");
      });

      it("should fall back to S3 direct URL when CLOUDFRONT_DOMAIN is empty string", () => {
        process.env.CLOUDFRONT_DOMAIN = "";

        jest.resetModules();

        jest.mock("@aws-sdk/client-s3", () => ({
          S3Client: jest.fn().mockImplementation(() => ({
            send: mockS3Send,
          })),
          PutObjectCommand: jest.fn(),
          DeleteObjectCommand: jest.fn(),
        }));
        jest.mock("@aws-sdk/s3-request-presigner", () => ({
          getSignedUrl: mockGetSignedUrl,
        }));

        const { getPublicUrl } = require("@/lib/utils/s3");
        const url = getPublicUrl("cars/abc-123.jpg");

        expect(url).not.toContain("cloudfront");
        expect(url).toContain("cars/abc-123.jpg");
      });
    });
  });

  describe("s3KeyFromStoredImage", () => {
    it("returns null for null/undefined/non-string", () => {
      const { s3KeyFromStoredImage } = require("@/lib/utils/s3");
      expect(s3KeyFromStoredImage(null)).toBeNull();
      expect(s3KeyFromStoredImage(undefined)).toBeNull();
      expect(s3KeyFromStoredImage(42 as unknown as string)).toBeNull();
      expect(s3KeyFromStoredImage("")).toBeNull();
    });

    it("returns null for public/static asset paths starting with /", () => {
      const { s3KeyFromStoredImage } = require("@/lib/utils/s3");
      expect(s3KeyFromStoredImage("/tesla.webp")).toBeNull();
      expect(s3KeyFromStoredImage("/static/cars/x.png")).toBeNull();
    });

    it("returns the value untouched if it already looks like a raw key", () => {
      const { s3KeyFromStoredImage } = require("@/lib/utils/s3");
      expect(s3KeyFromStoredImage("cars/abc123.webp")).toBe("cars/abc123.webp");
      expect(s3KeyFromStoredImage("parts/some-uuid/x.png")).toBe(
        "parts/some-uuid/x.png"
      );
    });

    it("extracts key from a CloudFront URL", () => {
      const { s3KeyFromStoredImage } = require("@/lib/utils/s3");
      expect(
        s3KeyFromStoredImage(
          "https://d1234567890.cloudfront.net/cars/abc-123.jpg"
        )
      ).toBe("cars/abc-123.jpg");
    });

    it("extracts key from a *.amazonaws.com S3 URL", () => {
      const { s3KeyFromStoredImage } = require("@/lib/utils/s3");
      expect(
        s3KeyFromStoredImage(
          "https://test-bucket.s3.eu-west-2.amazonaws.com/cars/x.png"
        )
      ).toBe("cars/x.png");
    });

    it("returns null for unrelated http(s) hosts", () => {
      const { s3KeyFromStoredImage } = require("@/lib/utils/s3");
      expect(s3KeyFromStoredImage("https://evil.example.com/x.png")).toBeNull();
    });

    it("returns null for malformed URLs without throwing", () => {
      const { s3KeyFromStoredImage } = require("@/lib/utils/s3");
      // starts with http but isn't a real URL — URL constructor will throw
      // and the catch should return null.
      expect(s3KeyFromStoredImage("http://[malformed")).toBeNull();
    });
  });

  describe("deleteS3Objects", () => {
    it("returns counts and never throws on mixed input", async () => {
      mockS3Send.mockResolvedValue({});
      const { deleteS3Objects } = require("@/lib/utils/s3");
      const result = await deleteS3Objects([
        null,
        undefined,
        "/static.png", // should be skipped
        "cars/keep.png",
        "https://d1234567890.cloudfront.net/cars/two.png",
      ]);
      expect(result.deleted).toBe(2);
      expect(result.failed).toEqual([]);
    });

    it("collects failed keys without throwing", async () => {
      mockS3Send.mockRejectedValue(new Error("boom"));
      const { deleteS3Objects } = require("@/lib/utils/s3");
      const result = await deleteS3Objects(["cars/fail.png"]);
      expect(result.deleted).toBe(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toMatchObject({
        key: "cars/fail.png",
        error: expect.stringContaining("boom"),
      });
    });

    it("returns zero deletes for empty input", async () => {
      const { deleteS3Objects } = require("@/lib/utils/s3");
      const result = await deleteS3Objects([]);
      expect(result).toEqual({ deleted: 0, failed: [] });
    });
  });
});
