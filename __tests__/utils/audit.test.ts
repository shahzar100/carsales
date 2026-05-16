/**
 * @jest-environment node
 *
 * Tests for src/lib/utils/audit.ts
 *
 * Standards coverage:
 * - 📋 Functional: appends entries to auditLogs with createdAt stamp
 * - 🎯 Usability: never throws — audit-log outage must NOT block admin actions
 * - 🔒 Security: failures still get reported via observability
 */

// Mock both collaborators BEFORE importing the module under test.
const mockInsertOne = jest.fn();
jest.mock("@/lib/models", () => ({
  getAuditLogsCollection: jest.fn(async () => ({
    insertOne: mockInsertOne,
  })),
}));

const mockLogError = jest.fn();
jest.mock("@/lib/utils/observability", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
  logEvent: jest.fn(),
}));

import { recordAudit } from "@/lib/utils/audit";

describe("recordAudit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("inserts the entry with an auto-populated createdAt", async () => {
    mockInsertOne.mockResolvedValue({ insertedId: "abc" });

    await recordAudit({
      actor: "admin1",
      action: "car.update",
      targetType: "car",
      targetId: "car-123",
      metadata: { fields: ["price"] },
    });

    expect(mockInsertOne).toHaveBeenCalledTimes(1);
    const inserted = mockInsertOne.mock.calls[0][0];
    expect(inserted).toMatchObject({
      actor: "admin1",
      action: "car.update",
      targetType: "car",
      targetId: "car-123",
      metadata: { fields: ["price"] },
    });
    expect(inserted.createdAt).toBeInstanceOf(Date);
  });

  it("never throws when the collection lookup fails — reports via logError", async () => {
    const { getAuditLogsCollection } = jest.requireMock("@/lib/models");
    (getAuditLogsCollection as jest.Mock).mockRejectedValueOnce(
      new Error("mongo down")
    );

    await expect(
      recordAudit({
        actor: "admin1",
        action: "car.delete",
        targetType: "car",
        targetId: "car-1",
      })
    ).resolves.toBeUndefined();

    expect(mockLogError).toHaveBeenCalledTimes(1);
    expect(mockLogError.mock.calls[0][1]).toMatchObject({
      context: "audit.recordAudit",
      action: "car.delete",
      targetType: "car",
    });
  });

  it("never throws when insertOne itself rejects — reports via logError", async () => {
    mockInsertOne.mockRejectedValueOnce(new Error("write conflict"));

    await expect(
      recordAudit({
        actor: "admin1",
        action: "user.create",
        targetType: "user",
        targetId: "u1",
      })
    ).resolves.toBeUndefined();

    expect(mockLogError).toHaveBeenCalledTimes(1);
    expect(mockLogError.mock.calls[0][1].action).toBe("user.create");
  });

  it("does NOT include sensitive metadata keys directly in the observability context", async () => {
    // We don't reach into the insert payload — just verify the error path
    // forwards only the safe action/targetType labels, never the metadata.
    const { getAuditLogsCollection } = jest.requireMock("@/lib/models");
    (getAuditLogsCollection as jest.Mock).mockRejectedValueOnce(
      new Error("x")
    );

    await recordAudit({
      actor: "admin1",
      action: "auth.password_reset",
      targetType: "user",
      targetId: "u1",
      metadata: { newPassword: "should-never-be-here" },
    });

    const ctx = mockLogError.mock.calls[0][1];
    expect(JSON.stringify(ctx)).not.toContain("should-never-be-here");
  });
});
