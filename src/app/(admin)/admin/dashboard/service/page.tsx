import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import {
  getServiceAppointmentsCollection,
  serializeDocument,
} from "@/lib/models";
import type { Booking } from "@/components/Admin";
import ServiceBookingsClient from "@/components/Admin/ServiceBookingsClient";

/**
 * Service-bookings admin page — Server Component.
 *
 * (Day 12.6 / Finding #29) Initial rows are fetched server-side and
 * handed to a small client island for interactivity. Previously this
 * page was all-client and had to render a spinner, then round-trip
 * `/api/admin/bookings`, then render. Now the first paint already has
 * the data.
 */
export default async function ServiceBookingsPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");

  const collection = await getServiceAppointmentsCollection();
  const docs = await collection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  const initialBookings = docs.map(
    (b) => serializeDocument(b) as unknown as Booking
  );

  return <ServiceBookingsClient initialBookings={initialBookings} />;
}
