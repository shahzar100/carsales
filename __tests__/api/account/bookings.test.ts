/**
 * @jest-environment node
 *
 * Tests for /api/account/bookings (src/app/api/account/bookings/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: only the signed-in customer's bookings are returned; the
 *   email match is case-insensitive but regex-escaped so a malicious local
 *   part can't broaden the filter.
 * - 📋 Functional: items are split into `upcoming` (pending/confirmed) and
 *   `history` (everything else); reservations join the same activity list.
 */
import { GET } from "@/app/api/account/bookings/route";
import { getTestCollections } from "../../utils/testUtils";

const mockAuth = jest.fn();
jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

async function seedService(
  email: string,
  status: string,
  date: string,
  ref: string,
  time = "10:00"
) {
  const { serviceAppointments, client } = await getTestCollections();
  await serviceAppointments.insertOne({
    bookingReference: ref,
    serviceType: "Detailing",
    appointmentDate: date,
    appointmentTime: time,
    status,
    customerInfo: { name: "Test", email, phone: "07000" },
    createdAt: new Date(),
  } as never);
  await client.close();
}

async function seedViewing(
  email: string,
  status: string,
  date: string,
  ref: string
) {
  const { carViewingBookings, client } = await getTestCollections();
  await carViewingBookings.insertOne({
    bookingReference: ref,
    appointmentDate: date,
    appointmentTime: "11:00",
    status,
    customerInfo: { name: "Test", email, phone: "07000" },
    carDetails: { year: 2020, make: "Tesla", model: "Model 3", price: 30000 },
    createdAt: new Date(),
  } as never);
  await client.close();
}

describe("GET /api/account/bookings", () => {
  beforeEach(() => mockAuth.mockReset());

  it("🔒 returns 401 when not signed in", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns empty upcoming/history when the customer has no bookings", async () => {
    mockAuth.mockResolvedValue({ user: { email: "empty@example.com" } });
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.upcoming).toEqual([]);
    expect(json.data.history).toEqual([]);
  });

  it("splits items into upcoming vs history by status", async () => {
    const email = "customer@example.com";
    mockAuth.mockResolvedValue({ user: { email } });
    await seedService(email, "pending", "2030-01-01", "BK-PEND01");
    await seedService(email, "confirmed", "2030-01-02", "BK-CONF02");
    await seedService(email, "completed", "2024-01-03", "BK-DONE03", "11:00");
    await seedService(email, "cancelled", "2024-01-04", "BK-CANC04", "12:00");

    const res = await GET();
    const json = await res.json();
    expect(json.data.upcoming.map((i: { reference: string }) => i.reference)).toEqual([
      "BK-PEND01",
      "BK-CONF02",
    ]);
    expect(json.data.history.map((i: { reference: string }) => i.reference)).toEqual([
      "BK-CANC04",
      "BK-DONE03",
    ]);
  });

  it("🔒 only returns bookings whose customerInfo.email matches the session", async () => {
    mockAuth.mockResolvedValue({ user: { email: "me@example.com" } });
    await seedService("me@example.com", "confirmed", "2030-02-01", "BK-MINE");
    await seedService("you@example.com", "confirmed", "2030-02-02", "BK-NOPE");
    const res = await GET();
    const json = await res.json();
    const refs = [
      ...json.data.upcoming.map((i: { reference: string }) => i.reference),
      ...json.data.history.map((i: { reference: string }) => i.reference),
    ];
    expect(refs).toContain("BK-MINE");
    expect(refs).not.toContain("BK-NOPE");
  });

  it("matches the session email case-insensitively", async () => {
    mockAuth.mockResolvedValue({ user: { email: "Same@Example.com" } });
    await seedService("same@example.com", "pending", "2030-03-01", "BK-CASE");
    const res = await GET();
    const json = await res.json();
    expect(
      json.data.upcoming.map((i: { reference: string }) => i.reference)
    ).toContain("BK-CASE");
  });

  it("includes viewings alongside services under the same upcoming/history split", async () => {
    const email = "mix@example.com";
    mockAuth.mockResolvedValue({ user: { email } });
    await seedService(email, "pending", "2030-04-01", "BK-S1");
    await seedViewing(email, "confirmed", "2030-04-02", "VW-V1");
    const res = await GET();
    const json = await res.json();
    const kinds = json.data.upcoming.map(
      (i: { kind: string }) => i.kind
    );
    expect(kinds).toContain("service");
    expect(kinds).toContain("viewing");
  });
});
