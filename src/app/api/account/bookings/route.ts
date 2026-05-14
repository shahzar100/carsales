import { auth } from "@/auth";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
  getReservationsCollection,
  serializeDocument,
} from "@/lib/models";
import { logError } from "@/lib/utils/observability";
import { ok, unauthorized, serverError } from "@/lib/utils/apiResponse";

/**
 * Everything a signed-in customer has booked with us, keyed off the
 * email on their account.
 *
 * Bookings aren't stored with a user id — they're created from public
 * forms that only collect `customerInfo.email`. So the link between an
 * account and its bookings is "same email address", matched
 * case-insensitively here. All three booking-like collections (service
 * appointments, car viewings, reservations) already have an index on
 * `customerInfo.email`, so these lookups stay cheap.
 *
 * The response is pre-split into `upcoming` (still actionable) and
 * `history` (done or cancelled) so the dashboard tabs don't each have
 * to re-filter.
 */

type ActivityKind = "service" | "viewing" | "reservation";

interface ActivityItem {
  kind: ActivityKind;
  reference: string;
  status: string;
  /** ISO date string for sorting/displaying, best-effort per kind. */
  date: string;
  title: string;
  subtitle?: string;
}

// pending / confirmed bookings are still actionable; everything else
// (completed, cancelled, expired) is history.
const UPCOMING_STATUSES = new Set(["pending", "confirmed"]);

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return unauthorized("You must be signed in to view your bookings");
    }

    // Case-insensitive exact match — bookings may have been made with a
    // differently-cased version of the same address.
    const emailFilter = {
      "customerInfo.email": {
        $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    };

    const [serviceCol, viewingCol, reservationCol] = await Promise.all([
      getServiceAppointmentsCollection(),
      getCarViewingBookingsCollection(),
      getReservationsCollection(),
    ]);

    const [services, viewings, reservations] = await Promise.all([
      serviceCol.find(emailFilter).sort({ createdAt: -1 }).limit(100).toArray(),
      viewingCol.find(emailFilter).sort({ createdAt: -1 }).limit(100).toArray(),
      reservationCol
        .find(emailFilter)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
    ]);

    const items: ActivityItem[] = [
      ...services.map((s): ActivityItem => {
        const doc = serializeDocument(s);
        return {
          kind: "service",
          reference: doc.bookingReference,
          status: doc.status,
          date: doc.appointmentDate,
          title: doc.serviceType,
          subtitle: `${doc.appointmentDate} at ${doc.appointmentTime}`,
        };
      }),
      ...viewings.map((v): ActivityItem => {
        const doc = serializeDocument(v);
        return {
          kind: "viewing",
          reference: doc.bookingReference,
          status: doc.status,
          date: doc.appointmentDate,
          title: `${doc.carDetails.make} ${doc.carDetails.model} (${doc.carDetails.year})`,
          subtitle: `Viewing — ${doc.appointmentDate} at ${doc.appointmentTime}`,
        };
      }),
      ...reservations.map((r): ActivityItem => {
        const doc = serializeDocument(r);
        return {
          kind: "reservation",
          reference: doc.reservationReference,
          status: doc.status,
          date:
            typeof doc.createdAt === "string"
              ? doc.createdAt
              : new Date().toISOString(),
          title: `${doc.carDetails.make} ${doc.carDetails.model} (${doc.carDetails.year})`,
          subtitle: "Reservation",
        };
      }),
    ];

    const upcoming = items
      .filter((i) => UPCOMING_STATUSES.has(i.status))
      .sort((a, b) => a.date.localeCompare(b.date));
    const history = items
      .filter((i) => !UPCOMING_STATUSES.has(i.status))
      .sort((a, b) => b.date.localeCompare(a.date));

    return ok({ upcoming, history });
  } catch (error) {
    logError(error, { route: "GET /api/account/bookings" });
    return serverError();
  }
}
