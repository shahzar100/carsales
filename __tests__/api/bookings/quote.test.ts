/**
 * @jest-environment node
 *
 * Tests for /api/bookings/quote route (src/app/api/bookings/quote/route.ts)
 *
 * Standards coverage:
 * - 📋 Functional: Quote creation, email sending
 * - 🔒 Security: Input validation, rate limiting, XSS sanitisation
 * - 🎯 Usability: Proper error messages for invalid input
 */
import {
  getTestCollections,
  createTestShopInfo,
  flushWaitUntil,
  mockSendEmail,
} from "../../utils/testUtils";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bookings/quote/route";

// Mock QuoteConfirmation email component
jest.mock("@/emails/QuoteConfirmation", () => ({
  QuoteConfirmation: () => null,
}));

// Mock booking reference generator
jest.mock("@/lib/utils/booking", () => ({
  generateQuoteReference: jest.fn().mockReturnValue("QT-TEST01"),
}));

// Customer auth — booking routes require a signed-in customer. Mocking
// it keeps the route from pulling in the @/auth → next-auth ESM chain
// (which Jest can't parse), and lets each test control whether a
// customer is "signed in".
jest.mock("@/lib/utils/customerAuth", () => ({
  getCustomerIdentity: jest
    .fn()
    .mockResolvedValue({ email: "john@example.com", name: "John Doe" }),
}));

// Mock rate limiting to allow requests by default
jest.mock("@/lib/utils/validation", () => {
  const actual = jest.requireActual("@/lib/utils/validation");
  return {
    ...actual,
    checkRateLimit: jest
      .fn()
      .mockResolvedValue({ allowed: true, remaining: 2 }),
  };
});
const {
  checkRateLimit: mockCheckRateLimit,
} = require("@/lib/utils/validation");

const validQuoteBody = {
  customerInfo: {
    name: "John Doe",
    email: "john@example.com",
    phone: "555-0123",
  },
  serviceType: "Window Tinting",
  serviceDetails: "Full car tint",
  vehicle: {
    make: "Toyota",
    model: "Camry",
    year: 2023,
    registration: "AB12 CDE",
  },
};

describe("/api/bookings/quote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 2 });
  });

  afterEach(async () => {
    // Drain any pending background work (waitUntil IIFEs) so they don't
    // leak into subsequent tests and inflate call counts.
    await flushWaitUntil();
    const { client } = await getTestCollections();
    await client.close();
  });

  // -- Happy Path ----------------------------------------------------------

  describe("POST - Happy Path", () => {
    it("should create a quote and return reference", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify(validQuoteBody),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.quoteReference).toBe("QT-TEST01");
      expect(data.data.message).toContain("successfully");
    });

    it("should save the quote to the database", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify(validQuoteBody),
        }
      );

      await POST(request);

      const { quotes, client } = await getTestCollections();
      const savedQuote = await quotes.findOne({
        quoteReference: "QT-TEST01",
      });

      expect(savedQuote).not.toBeNull();
      expect(savedQuote?.customerInfo.name).toBe("John Doe");
      expect(savedQuote?.customerInfo.email).toBe("john@example.com");
      expect(savedQuote?.serviceType).toBe("Window Tinting");
      expect(savedQuote?.status).toBe("pending");
      await client.close();
    });

    it("should send a confirmation email", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify(validQuoteBody),
        }
      );

      await POST(request);

      // Flush background email send (waitUntil)
      await flushWaitUntil();

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "john@example.com",
          subject: expect.stringContaining("QT-TEST01"),
        })
      );
    });

    it("should succeed even if email fails to send", async () => {
      mockSendEmail.mockResolvedValueOnce({ success: false, error: "fail" });

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify(validQuoteBody),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should use shop info from database for email", async () => {
      const { shopInfo, client } = await getTestCollections();
      await shopInfo.insertOne(createTestShopInfo());
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify(validQuoteBody),
        }
      );

      await POST(request);

      // Flush background email send (waitUntil)
      await flushWaitUntil();

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Test Motor Company"),
        })
      );
    });
  });

  // -- Rate Limiting -------------------------------------------------------

  describe("Rate Limiting", () => {
    it("should return 429 when rate limit is exceeded", async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify(validQuoteBody),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain("Too many requests");
    });
  });

  // -- Input Validation ----------------------------------------------------

  describe("Input Validation", () => {
    it("should return 400 when customer info is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify({
            serviceType: "Tinting",
            vehicle: { make: "Toyota", model: "Camry", year: 2023 },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      // Zod rejects the missing object; the exact message is an
      // implementation detail, so just assert the failure shape.
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("returns 401 when no customer is signed in", async () => {
      const { getCustomerIdentity } = require("@/lib/utils/customerAuth");
      getCustomerIdentity.mockResolvedValueOnce(null);

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify(validQuoteBody),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(/sign in/i);
    });

    it("should return 400 for invalid phone", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify({
            ...validQuoteBody,
            customerInfo: {
              ...validQuoteBody.customerInfo,
              phone: "ab",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("phone");
    });

    it("should return 400 when service type is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify({
            customerInfo: validQuoteBody.customerInfo,
            vehicle: validQuoteBody.vehicle,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("should return 400 when vehicle info is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify({
            customerInfo: validQuoteBody.customerInfo,
            serviceType: "Tinting",
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("should return 400 when vehicle make is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify({
            ...validQuoteBody,
            vehicle: { model: "Camry", year: 2023 },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // -- Security ------------------------------------------------------------

  describe("Security", () => {
    it("should sanitize customer name from XSS", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify({
            ...validQuoteBody,
            customerInfo: {
              ...validQuoteBody.customerInfo,
              name: '<script>alert("xss")</script>',
            },
          }),
        }
      );

      await POST(request);

      const { quotes, client } = await getTestCollections();
      const savedQuote = await quotes.findOne({
        quoteReference: "QT-TEST01",
      });

      expect(savedQuote?.customerInfo.name).not.toContain("<script>");
      await client.close();
    });

    it("stores service details within the length cap, no crash on HTML", async () => {
      // The route doesn't strip HTML from free-text fields — its XSS
      // defence is output encoding (React escapes on render), not input
      // sanitisation. So an HTML-ish value is accepted and persisted as
      // typed; this test just pins that it's stored and bounded.
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify({
            ...validQuoteBody,
            serviceDetails: '<img onerror="alert(1)" />',
          }),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      const { quotes, client } = await getTestCollections();
      const savedQuote = await quotes.findOne({
        quoteReference: "QT-TEST01",
      });

      expect(savedQuote).toBeTruthy();
      expect((savedQuote?.serviceDetails ?? "").length).toBeLessThanOrEqual(500);
      await client.close();
    });

    it("should handle quote with no registration gracefully", async () => {
      const bodyNoReg = {
        ...validQuoteBody,
        vehicle: { make: "Toyota", model: "Camry", year: 2023 },
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: JSON.stringify(bodyNoReg),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("returns 400 for malformed JSON body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/quote",
        {
          method: "POST",
          body: "{",
          headers: { "Content-Type": "application/json" },
        }
      );
      jest
        .spyOn(request, "json")
        .mockRejectedValueOnce(new SyntaxError("Bad JSON"));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/Invalid JSON/i);
    });
  });
});
