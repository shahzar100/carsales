import { test, expect } from "@playwright/test";
import { db, closeDb, seedCompletedViewing } from "./_db";

/**
 * Cron review-invites: bearer auth + the eligibility query + at-most-once send,
 * with email delivery verified through the SMTP sink (_outbox collection).
 */
const SECRET = "op-cron-secret";
const ELIGIBLE = "op-cron-eligible@example.com";
const RECENT = "op-cron-recent@example.com";
const PENDINGE = "op-cron-pending@example.com";

test.describe.serial("operational: cron review-invites", () => {
  test.beforeAll(async () => {
    await seedCompletedViewing({ email: ELIGIBLE, hoursSinceCompleted: 25 }); // eligible
    await seedCompletedViewing({ email: RECENT, hoursSinceCompleted: 1 }); // too recent
    await seedCompletedViewing({ email: PENDINGE, status: "pending" }); // not completed
  });

  test.afterAll(async () => {
    await closeDb();
  });

  test("rejects missing / wrong bearer (401)", async ({ request }) => {
    expect((await request.get("/api/cron/review-invites")).status()).toBe(401);
    const wrong = await request.get("/api/cron/review-invites", {
      headers: { authorization: "Bearer not-the-secret" },
    });
    expect(wrong.status()).toBe(401);
  });

  test("with the secret → sends to the eligible booking and emails it", async ({
    request,
  }) => {
    const res = await request.get("/api/cron/review-invites", {
      headers: { authorization: `Bearer ${SECRET}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.results.sent, JSON.stringify(body)).toBeGreaterThanOrEqual(1);

    const d = await db();
    // Eligible booking is now claimed; recent + pending are untouched.
    const eligible = await d
      .collection("carViewingBookings")
      .findOne({ "customerInfo.email": ELIGIBLE });
    expect(eligible?.reviewInviteSentAt).toBeTruthy();
    const recent = await d
      .collection("carViewingBookings")
      .findOne({ "customerInfo.email": RECENT });
    expect(recent?.reviewInviteSentAt).toBeFalsy();
    const pending = await d
      .collection("carViewingBookings")
      .findOne({ "customerInfo.email": PENDINGE });
    expect(pending?.reviewInviteSentAt).toBeFalsy();

    // SMTP sink received the review-invite email for the eligible customer.
    const mail = await d.collection("_outbox").findOne({ to: { $regex: ELIGIBLE } });
    expect(mail, "expected an email to the eligible customer in the SMTP sink").toBeTruthy();
  });

  test("idempotent: a second run does not re-send", async ({ request }) => {
    const d = await db();
    const before = await d.collection("_outbox").countDocuments({ to: { $regex: ELIGIBLE } });
    const res = await request.get("/api/cron/review-invites", {
      headers: { authorization: `Bearer ${SECRET}` },
    });
    expect(res.status()).toBe(200);
    const after = await d.collection("_outbox").countDocuments({ to: { $regex: ELIGIBLE } });
    expect(after).toBe(before); // already claimed → no duplicate email
  });
});
