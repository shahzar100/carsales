import "server-only";
import { auth } from "@/auth";

/**
 * Server-side helper for the customer-facing Auth.js session.
 *
 * This is the booking-routes counterpart to `isAuthenticated()` in
 * `auth.ts` (which gates the *admin* iron-session). Every booking
 * creation route — service, viewing, reservation, quote, part-exchange —
 * calls `getCustomerIdentity()` and rejects the request when it returns
 * null, so a booking can only ever be created by a signed-in customer.
 *
 * The returned `email` is the account email. Routes write it onto
 * `customerInfo.email` regardless of what the form submitted, which is
 * what guarantees every booking shows up in the customer's dashboard
 * (the dashboard matches bookings by account email).
 */
export interface CustomerIdentity {
  /** Account email — always present for an authenticated session. */
  email: string;
  /** Display name, if the provider supplied one. */
  name: string | null;
}

export async function getCustomerIdentity(): Promise<CustomerIdentity | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  return {
    email: session.user.email.toLowerCase(),
    name: session.user.name ?? null,
  };
}
