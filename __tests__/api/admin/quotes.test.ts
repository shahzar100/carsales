/**
 * @jest-environment node
 *
 * Tests for /api/admin/quotes (Day 10 / Fix 10.3).
 */
import { NextRequest } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { GET, PATCH } from "@/app/api/admin/quotes/route";

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
  hasMinimumRole: jest.fn(),
  getSession: jest.fn().mockResolvedValue({ username: "admin-test" }),
}));
jest.mock("@/lib/utils/audit", () => ({
  recordAudit: jest.fn().mockResolvedValue(undefined),
}));

const {
  isAuthenticated: mockIsAuthenticated,
  hasMinimumRole: mockHasMinimumRole,
} = require("@/lib/utils/auth");
const { recordAudit: mockRecordAudit } = require("@/lib/utils/audit");

const makeQuote = (overrides: Record<string, unknown> = {}) => ({
  quoteReference: `QT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  customerInfo: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "07700 900000",
  },
  serviceType: "Detailing — Bronze",
  serviceDetails: "Standard package",
  vehicle: {
    make: "BMW",
    model: "320d",
    year: 2020,
  },
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("/api/admin/quotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
  });

  describe("GET", () => {
    it("returns quotes for authed admin", async () => {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      await client
        .db("MMC")
        .collection("quotes")
        .insertMany([makeQuote(), makeQuote({ status: "accepted" })]);
      await client.close();

      const res = await GET(
        new NextRequest("http://localhost:3000/api/admin/quotes")
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.quotes).toHaveLength(2);
    });

    it("filters by status", async () => {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      await client
        .db("MMC")
        .collection("quotes")
        .insertMany([
          makeQuote(),
          makeQuote({ status: "responded" }),
          makeQuote({ status: "expired" }),
        ]);
      await client.close();

      const res = await GET(
        new NextRequest(
          "http://localhost:3000/api/admin/quotes?status=responded"
        )
      );
      const body = await res.json();
      expect(body.data.quotes).toHaveLength(1);
      expect(body.data.quotes[0].status).toBe("responded");
    });

    it("returns 401 when unauthenticated", async () => {
      mockIsAuthenticated.mockResolvedValue(false);
      const res = await GET(
        new NextRequest("http://localhost:3000/api/admin/quotes")
      );
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH", () => {
    it("transitions to responded and records the response in audit", async () => {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      const { insertedId } = await client
        .db("MMC")
        .collection("quotes")
        .insertOne(makeQuote());
      await client.close();

      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/quotes", {
          method: "PATCH",
          body: JSON.stringify({
            id: insertedId.toHexString(),
            status: "responded",
            responseMessage: "Quoted £450 via email",
          }),
        })
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.quote.status).toBe("responded");
      expect(mockRecordAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "quote.responded",
          targetType: "quote",
          metadata: expect.objectContaining({
            responseMessage: "Quoted £450 via email",
          }),
        })
      );
    });

    it("supports transitioning to expired without a response message", async () => {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      const { insertedId } = await client
        .db("MMC")
        .collection("quotes")
        .insertOne(makeQuote());
      await client.close();

      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/quotes", {
          method: "PATCH",
          body: JSON.stringify({
            id: insertedId.toHexString(),
            status: "expired",
          }),
        })
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.quote.status).toBe("expired");
    });

    it("rejects invalid status", async () => {
      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/quotes", {
          method: "PATCH",
          body: JSON.stringify({
            id: new ObjectId().toHexString(),
            status: "declined",
          }),
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 401 when unauthenticated", async () => {
      mockIsAuthenticated.mockResolvedValue(false);
      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/quotes", {
          method: "PATCH",
          body: JSON.stringify({
            id: new ObjectId().toHexString(),
            status: "responded",
          }),
        })
      );
      expect(res.status).toBe(401);
    });

    it("returns 404 for unknown id", async () => {
      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/quotes", {
          method: "PATCH",
          body: JSON.stringify({
            id: new ObjectId().toHexString(),
            status: "responded",
          }),
        })
      );
      expect(res.status).toBe(404);
    });
  });
});
