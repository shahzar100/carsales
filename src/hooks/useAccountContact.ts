"use client";

import { useSession } from "next-auth/react";

/**
 * The signed-in customer's name + email, for prefilling booking forms.
 *
 * Every booking form sits behind `BookingAuthGate`, which only renders
 * its children once the session is authenticated — so by the time a
 * form mounts these values are populated. During the brief loading tick
 * they're empty strings, and a one-shot `useEffect` in each form copies
 * them into local state once they resolve.
 *
 * The email here is the source of truth: the booking API routes force
 * `customerInfo.email` to the account email regardless of what's
 * submitted, so the forms render the email field locked to match.
 */
export function useAccountContact(): { name: string; email: string } {
  const { data: session } = useSession();
  return {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
  };
}
