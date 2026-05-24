import { NextRequest } from "next/server";
import { GET } from "@/app/api/cron/cleanup/route";
import { getTestCollections } from "../../utils/testUtils";

const ONE_HOUR = 60 * 60 * 1000;

const createRequest = (authHeader?: string) => {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return new NextRequest(
    new Request("http://localhost:3000/api/cron/cleanup", {
      method: "GET",
      headers,
    })
  );
};

/** Format a Date as YYYY-MM-DD (UTC), matching how booking dates are stored. */
const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

describe("GET /api/cron/cleanup", () => {
  const cronSecret = "test-cron-secret";

  beforeEach(() => {
    process.env.CRON_SECRET = cronSecret;
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("returns 401 with missing auth header", async () => {
    const response = await GET(createRequest());
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 with wrong bearer token", async () => {
    const response = await GET(createRequest("Bearer wrong-secret"));
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("expires pending reservations older than 48h and leaves recent ones alone", async () => {
    const { client } = await getTestCollections();
    const db = client.db("MMC");
    const reservations = db.collection("reservations");

    const now = new Date();
    const stale = new Date(now.getTime() - 49 * ONE_HOUR);
    const fresh = new Date(now.getTime() - 2 * ONE_HOUR);

    await reservations.insertMany([
      {
        reservationReference: "RSV-STALE",
        carId: "car-1",
        carDetails: { make: "Toyota", model: "Camry", year: 2023, price: 25000 },
        customerInfo: { name: "A", email: "a@test.com", phone: "1" },
        status: "pending",
        expiresAt: stale,
        createdAt: stale,
        updatedAt: stale,
      },
      {
        reservationReference: "RSV-FRESH",
        carId: "car-2",
        carDetails: { make: "Honda", model: "Civic", year: 2024, price: 22000 },
        customerInfo: { name: "B", email: "b@test.com", phone: "2" },
        status: "pending",
        expiresAt: fresh,
        createdAt: fresh,
        updatedAt: fresh,
      },
    ]);

    const response = await GET(createRequest(`Bearer ${cronSecret}`));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.expiredReservations).toBe(1);

    const staleDoc = await reservations.findOne({
      reservationReference: "RSV-STALE",
    });
    const freshDoc = await reservations.findOne({
      reservationReference: "RSV-FRESH",
    });
    expect(staleDoc?.status).toBe("expired");
    expect(staleDoc?.expiredAt).toBeDefined();
    expect(freshDoc?.status).toBe("pending");

    await client.close();
  });

  it("expires pending service + viewing bookings past their appointment by >24h", async () => {
    const { serviceAppointments, carViewingBookings, client } =
      await getTestCollections();

    const now = new Date();
    const stalePastDate = toIsoDate(new Date(now.getTime() - 48 * ONE_HOUR));
    const todayDate = toIsoDate(now);
    const futureDate = toIsoDate(new Date(now.getTime() + 48 * ONE_HOUR));

    await serviceAppointments.insertMany([
      {
        bookingReference: "BK-SVC-STALE",
        customerInfo: { name: "S1", email: "s1@test.com", phone: "1" },
        serviceType: "Oil Change",
        appointmentDate: stalePastDate,
        appointmentTime: "10:00",
        status: "pending",
        createdAt: new Date(now.getTime() - 72 * ONE_HOUR),
        updatedAt: new Date(now.getTime() - 72 * ONE_HOUR),
      },
      {
        bookingReference: "BK-SVC-TODAY",
        customerInfo: { name: "S2", email: "s2@test.com", phone: "2" },
        serviceType: "Oil Change",
        appointmentDate: todayDate,
        appointmentTime: "10:00",
        status: "pending",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await carViewingBookings.insertMany([
      {
        bookingReference: "BK-VW-STALE",
        carId: "car-1",
        carDetails: { make: "Toyota", model: "Camry", year: 2023, price: 25000 },
        customerInfo: { name: "V1", email: "v1@test.com", phone: "3" },
        appointmentDate: stalePastDate,
        appointmentTime: "11:00",
        status: "pending",
        createdAt: new Date(now.getTime() - 72 * ONE_HOUR),
        updatedAt: new Date(now.getTime() - 72 * ONE_HOUR),
      },
      {
        bookingReference: "BK-VW-FUTURE",
        carId: "car-2",
        carDetails: { make: "Honda", model: "Civic", year: 2024, price: 22000 },
        customerInfo: { name: "V2", email: "v2@test.com", phone: "4" },
        appointmentDate: futureDate,
        appointmentTime: "11:00",
        status: "pending",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const response = await GET(createRequest(`Bearer ${cronSecret}`));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.expiredBookings).toBe(2);

    const staleSvc = await serviceAppointments.findOne({
      bookingReference: "BK-SVC-STALE",
    });
    const todaySvc = await serviceAppointments.findOne({
      bookingReference: "BK-SVC-TODAY",
    });
    const staleVw = await carViewingBookings.findOne({
      bookingReference: "BK-VW-STALE",
    });
    const futureVw = await carViewingBookings.findOne({
      bookingReference: "BK-VW-FUTURE",
    });

    expect(staleSvc?.status).toBe("no_show");
    expect(staleVw?.status).toBe("no_show");
    expect(todaySvc?.status).toBe("pending");
    expect(futureVw?.status).toBe("pending");

    await client.close();
  });

  it("is idempotent — a second run produces no further changes", async () => {
    const { serviceAppointments, client } = await getTestCollections();
    const db = client.db("MMC");
    const reservations = db.collection("reservations");

    const now = new Date();
    const stale = new Date(now.getTime() - 72 * ONE_HOUR);
    const stalePastDate = toIsoDate(new Date(now.getTime() - 48 * ONE_HOUR));

    await reservations.insertOne({
      reservationReference: "RSV-IDEMP",
      carId: "car-1",
      carDetails: { make: "Toyota", model: "Camry", year: 2023, price: 25000 },
      customerInfo: { name: "I", email: "i@test.com", phone: "1" },
      status: "pending",
      expiresAt: stale,
      createdAt: stale,
      updatedAt: stale,
    });

    await serviceAppointments.insertOne({
      bookingReference: "BK-IDEMP",
      customerInfo: { name: "I", email: "i@test.com", phone: "1" },
      serviceType: "Oil Change",
      appointmentDate: stalePastDate,
      appointmentTime: "10:00",
      status: "pending",
      createdAt: stale,
      updatedAt: stale,
    });

    const first = await GET(createRequest(`Bearer ${cronSecret}`));
    const firstData = await first.json();
    expect(firstData.expiredReservations).toBe(1);
    expect(firstData.expiredBookings).toBe(1);

    const second = await GET(createRequest(`Bearer ${cronSecret}`));
    const secondData = await second.json();
    expect(secondData.expiredReservations).toBe(0);
    expect(secondData.expiredBookings).toBe(0);

    await client.close();
  });
});
