import { sendReviewInviteEmail } from "@/lib/utils/reviewInvite";

// Mock email sending
const mockSendEmail = jest.fn().mockResolvedValue({ success: true });
jest.mock("@/emails/send", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

// Mock businessInfo
jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: jest.fn().mockResolvedValue({
    businessName: "Test Motors",
    phone: "555-1234",
    email: "test@motors.com",
    address: "123 Test St",
    city: "Leeds",
    state: "West Yorkshire",
    zipCode: "LS1 1AA",
  }),
}));

// Mock all email templates
jest.mock("@/emails/ReviewInviteService", () => ({
  ReviewInviteService: () => null,
}));
jest.mock("@/emails/ReviewInviteViewing", () => ({
  ReviewInviteViewing: () => null,
}));
jest.mock("@/emails/ReviewInviteRepair", () => ({
  ReviewInviteRepair: () => null,
}));
jest.mock("@/emails/ReviewInviteRecovery", () => ({
  ReviewInviteRecovery: () => null,
}));
jest.mock("@/emails/ReviewInviteDetailing", () => ({
  ReviewInviteDetailing: () => null,
}));
jest.mock("@/emails/ReviewInviteTinting", () => ({
  ReviewInviteTinting: () => null,
}));

describe("sendReviewInviteEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = "https://test.com";
  });

  it("sends viewing review invite email", async () => {
    const booking = {
      bookingReference: "BK-VIEW01",
      customerInfo: {
        name: "John Doe",
        email: "john@test.com",
        phone: "555-0001",
      },
      carDetails: { year: 2023, make: "Toyota", model: "Camry" },
      status: "completed",
    };

    await sendReviewInviteEmail(booking, "viewing");

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe("john@test.com");
    expect(call.subject).toContain("viewing");
    expect(call.subject).toContain("2023 Toyota Camry");
  });

  it("sends general service review invite", async () => {
    const booking = {
      bookingReference: "BK-SRV001",
      customerInfo: {
        name: "Jane Doe",
        email: "jane@test.com",
        phone: "555-0002",
      },
      serviceType: "Oil Change",
      status: "completed",
    };

    await sendReviewInviteEmail(booking, "service");

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe("jane@test.com");
    expect(call.subject).toContain("service");
  });

  it("sends repair review invite for repair keywords", async () => {
    const booking = {
      bookingReference: "BK-RPR001",
      customerInfo: {
        name: "Bob",
        email: "bob@test.com",
        phone: "555-0003",
      },
      serviceType: "Engine Repair",
      status: "completed",
    };

    await sendReviewInviteEmail(booking, "service");

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.subject).toContain("repair");
  });

  it("sends recovery review invite for recovery keywords", async () => {
    const booking = {
      bookingReference: "BK-REC001",
      customerInfo: {
        name: "Alice",
        email: "alice@test.com",
        phone: "555-0004",
      },
      serviceType: "Breakdown Recovery",
      status: "completed",
    };

    await sendReviewInviteEmail(booking, "service");

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.subject).toContain("recovery");
  });

  it("sends detailing review invite for detailing keywords", async () => {
    const booking = {
      bookingReference: "BK-DET001",
      customerInfo: {
        name: "Charlie",
        email: "charlie@test.com",
        phone: "555-0005",
      },
      serviceType: "Full Detailing",
      status: "completed",
    };

    await sendReviewInviteEmail(booking, "service");

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.subject).toContain("car look");
  });

  it("sends tinting review invite for tinting keywords", async () => {
    const booking = {
      bookingReference: "BK-TNT001",
      customerInfo: {
        name: "Dave",
        email: "dave@test.com",
        phone: "555-0006",
      },
      serviceType: "Window Tinting",
      status: "completed",
    };

    await sendReviewInviteEmail(booking, "service");

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.subject).toContain("tint");
  });

  it("skips email when customer has no email", async () => {
    const booking = {
      bookingReference: "BK-NOEML",
      customerInfo: { name: "No Email", phone: "555-0007" },
      serviceType: "Oil Change",
      status: "completed",
    };

    await sendReviewInviteEmail(booking, "service");

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("logs warning when email send fails", async () => {
    mockSendEmail.mockResolvedValueOnce({ success: false, error: "SMTP down" });

    const booking = {
      bookingReference: "BK-FAIL01",
      customerInfo: {
        name: "Fail",
        email: "fail@test.com",
        phone: "555-0008",
      },
      serviceType: "Oil Change",
      status: "completed",
    };

    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    await sendReviewInviteEmail(booking, "service");
    consoleSpy.mockRestore();

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });
});
