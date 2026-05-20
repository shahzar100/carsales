/**
 * @jest-environment node
 *
 * Tests for /api/admin/part-exchange (Day 10 / Fix 10.3).
 */
import { NextRequest } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { GET, PATCH } from "@/app/api/admin/part-exchange/route";

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

const makeEnquiry = (overrides: Record<string, unknown> = {}) => ({
  enquiryReference: `PX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  customerInfo: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "07700 900000",
  },
  vehicle: {
    make: "Ford",
    model: "Focus",
    year: 2018,
    mileage: 55000,
    condition: "Good",
  },
  interestedInCarId: "car-1",
  interestedInCarLabel: "BMW 320d",
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("/api/admin/part-exchange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
  });

  describe("GET", () => {
    it("returns enquiries for authed admin", async () => {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      await client
        .db("MMC")
        .collection("partExchanges")
        .insertMany([makeEnquiry(), makeEnquiry({ status: "valued" })]);
      await client.close();

      const res = await GET(
        new NextRequest("http://localhost:3000/api/admin/part-exchange")
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.partExchanges).toHaveLength(2);
    });

    it("filters by status", async () => {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      await client
        .db("MMC")
        .collection("partExchanges")
        .insertMany([
          makeEnquiry(),
          makeEnquiry({ status: "valued" }),
          makeEnquiry({ status: "declined" }),
        ]);
      await client.close();

      const res = await GET(
        new NextRequest(
          "http://localhost:3000/api/admin/part-exchange?status=valued"
        )
      );
      const body = await res.json();
      expect(body.data.partExchanges).toHaveLength(1);
      expect(body.data.partExchanges[0].status).toBe("valued");
    });

    it("returns 401 when unauthenticated", async () => {
      mockIsAuthenticated.mockResolvedValue(false);
      const res = await GET(
        new NextRequest("http://localhost:3000/api/admin/part-exchange")
      );
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH", () => {
    it("transitions a row to valued and records audit with valuation", async () => {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      const { insertedId } = await client
        .db("MMC")
        .collection("partExchanges")
        .insertOne(makeEnquiry());
      await client.close();

      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/part-exchange", {
          method: "PATCH",
          body: JSON.stringify({
            id: insertedId.toHexString(),
            status: "valued",
            valuation: 4500,
          }),
        })
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.partExchange.status).toBe("valued");
      expect(mockRecordAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: "admin-test",
          action: "partExchange.valued",
          targetType: "partExchange",
          metadata: expect.objectContaining({ valuation: 4500 }),
        })
      );
    });

    it("rejects negative valuation", async () => {
      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/part-exchange", {
          method: "PATCH",
          body: JSON.stringify({
            id: new ObjectId().toHexString(),
            status: "valued",
            valuation: -5,
          }),
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 for unknown id", async () => {
      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/part-exchange", {
          method: "PATCH",
          body: JSON.stringify({
            id: new ObjectId().toHexString(),
            status: "accepted",
          }),
        })
      );
      expect(res.status).toBe(404);
    });

    it("rejects an invalid status enum", async () => {
      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/part-exchange", {
          method: "PATCH",
          body: JSON.stringify({
            id: new ObjectId().toHexString(),
            status: "expired",
          }),
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 401 when unauthenticated", async () => {
      mockIsAuthenticated.mockResolvedValue(false);
      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/part-exchange", {
          method: "PATCH",
          body: JSON.stringify({
            id: new ObjectId().toHexString(),
            status: "valued",
          }),
        })
      );
      expect(res.status).toBe(401);
    });
  });
});
