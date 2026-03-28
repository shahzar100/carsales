import { NextRequest } from "next/server";
import { GET } from "@/app/api/cron/review-invites/route";
import { getTestCollections } from "../../utils/testUtils";

// Mock reviewInvite util
jest.mock("@/lib/utils/reviewInvite", () => ({
  sendReviewInviteEmail: jest.fn(),
}));

import { sendReviewInviteEmail } from "@/lib/utils/reviewInvite";

const mockSendReviewInviteEmail = sendReviewInviteEmail as jest.MockedFunction<
  typeof sendReviewInviteEmail
>;

describe("GET /api/cron/review-invites", () => {
  const cronSecret = "test-cron-secret";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = cronSecret;
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  const createRequest = (authHeader?: string) => {
    const headers = new Headers();
    if (authHeader) {
      headers.set("authorization", authHeader);
    }
    return new NextRequest(
      new Request("http://localhost:3000/api/cron/review-invites", {
        method: "GET",
        headers,
      })
    );
  };

  it("returns 401 with invalid auth header", async () => {
    const request = createRequest("Bearer wrong-secret");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 with missing auth header", async () => {
    const request = createRequest();

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("processes completed service bookings and sends review emails", async () => {
    const { serviceAppointments, client } = await getTestCollections();

    // Insert a completed service booking older than 24 hours
    const completedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    await serviceAppointments.insertOne({
      bookingReference: "BK-SRV001",
      customerInfo: { name: "John", email: "john@test.com", phone: "555-0001" },
      serviceType: "Oil Change",
      status: "completed",
      completedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockSendReviewInviteEmail.mockResolvedValue(undefined);

    const request = createRequest(`Bearer ${cronSecret}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.results.sent).toBe(1);
    expect(mockSendReviewInviteEmail).toHaveBeenCalledTimes(1);

    // Verify reviewInviteSentAt was set
    const updated = await serviceAppointments.findOne({
      bookingReference: "BK-SRV001",
    });
    expect(updated?.reviewInviteSentAt).toBeDefined();

    await client.close();
  });

  it("processes completed viewing bookings", async () => {
    const { carViewingBookings, client } = await getTestCollections();

    const completedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await carViewingBookings.insertOne({
      bookingReference: "BK-VW0001",
      carId: "test-car-id",
      carDetails: { make: "Toyota", model: "Camry", year: 2023 },
      customerInfo: {
        name: "Jane",
        email: "jane@test.com",
        phone: "555-0002",
      },
      status: "completed",
      completedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockSendReviewInviteEmail.mockResolvedValue(undefined);

    const request = createRequest(`Bearer ${cronSecret}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.sent).toBe(1);

    await client.close();
  });

  it("skips bookings not yet 24 hours old", async () => {
    const { serviceAppointments, client } = await getTestCollections();

    // Insert a recently completed booking (only 1 hour ago)
    await serviceAppointments.insertOne({
      bookingReference: "BK-NEW001",
      customerInfo: {
        name: "Recent",
        email: "recent@test.com",
        phone: "555-0003",
      },
      serviceType: "Oil Change",
      status: "completed",
      completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createRequest(`Bearer ${cronSecret}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.sent).toBe(0);
    expect(mockSendReviewInviteEmail).not.toHaveBeenCalled();

    await client.close();
  });

  it("skips bookings that already had review invite sent", async () => {
    const { serviceAppointments, client } = await getTestCollections();

    await serviceAppointments.insertOne({
      bookingReference: "BK-DONE01",
      customerInfo: {
        name: "Done",
        email: "done@test.com",
        phone: "555-0004",
      },
      serviceType: "Oil Change",
      status: "completed",
      completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      reviewInviteSentAt: new Date(), // Already sent
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createRequest(`Bearer ${cronSecret}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.sent).toBe(0);

    await client.close();
  });

  it("handles email send failures gracefully", async () => {
    const { serviceAppointments, client } = await getTestCollections();

    await serviceAppointments.insertOne({
      bookingReference: "BK-FAIL01",
      customerInfo: {
        name: "Fail",
        email: "fail@test.com",
        phone: "555-0005",
      },
      serviceType: "Oil Change",
      status: "completed",
      completedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockSendReviewInviteEmail.mockRejectedValue(new Error("SMTP error"));

    const request = createRequest(`Bearer ${cronSecret}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.failed).toBe(1);
    expect(data.results.sent).toBe(0);

    await client.close();
  });

  it("allows access when CRON_SECRET is not set in non-production", async () => {
    delete process.env.CRON_SECRET;

    const request = createRequest(); // No auth header
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
