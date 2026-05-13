import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import {
  getCarViewingBookingsCollection,
  serializeDocument,
} from "@/lib/models";
import type { Booking } from "@/components/Admin";
import ViewingBookingsClient from "@/components/Admin/ViewingBookingsClient";

/**
 * Viewings admin page — Server Component.
 *
 * (Day 12.6 / Finding #29) Read-mostly admin pages fetch their initial
 * data server-side and hand it to a small client island for interactivity.
 * The previous all-client implementation had to render a spinner, then
 * round-trip /api/admin/bookings, then render. Now the first paint already
 * has the data.
 */
export default async function ViewingBookingsPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");

  const collection = await getCarViewingBookingsCollection();
  const docs = await collection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  const initialBookings = docs.map(
    (b) => serializeDocument(b) as unknown as Booking
  );

  return <ViewingBookingsClient initialBookings={initialBookings} />;
}
