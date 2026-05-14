"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import Button from "@/components/UI/Button";

/**
 * Client-side gate around any booking form (service, viewing,
 * reservation, part-exchange).
 *
 * Bookings are account-only — the API routes reject unauthenticated
 * requests outright. This component is the matching UX: instead of
 * letting a signed-out visitor fill in a whole form and then hit a 401,
 * it shows a sign-in prompt up front. Both CTAs carry a `callbackUrl`
 * back to the current page, so the visitor lands straight back on the
 * booking form once they're signed in.
 *
 * Wrap it at the form's call site (not inside the form component) so
 * the same form can stay ungated if it's ever reused somewhere that
 * doesn't need the gate.
 */
export default function BookingAuthGate({
  children,
  heading = "Sign in to continue",
  message = "You need an account to make a booking — it's quick, and it keeps every booking, viewing and reservation together in your dashboard.",
}: {
  children: React.ReactNode;
  heading?: string;
  message?: string;
}) {
  const { status } = useSession();
  const pathname = usePathname();
  const callbackUrl = encodeURIComponent(pathname || "/");

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-white p-10 shadow-sm ring-1 ring-gray-100">
        <Loader2
          className="h-6 w-6 animate-spin text-gray-400"
          aria-hidden="true"
        />
        <span className="sr-only">Checking your account…</span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100 sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <LogIn className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">{heading}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href={`/login?callbackUrl=${callbackUrl}`}>Sign in</Button>
          <Button
            href={`/register?callbackUrl=${callbackUrl}`}
            variant="outline"
          >
            Create an account
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
