"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
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

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "loading" ? (
        <m.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex items-center justify-center rounded-2xl bg-white p-10 shadow-sm ring-1 ring-gray-100"
        >
          <Loader2
            className="h-6 w-6 animate-spin text-gray-400"
            aria-hidden="true"
          />
          <span className="sr-only">Checking your account…</span>
        </m.div>
      ) : status === "unauthenticated" ? (
        <m.div
          key="gate"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100 sm:p-10"
        >
          <m.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.1 }}
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50"
          >
            <LogIn className="h-6 w-6 text-red-600" aria-hidden="true" />
          </m.div>
          <m.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            className="mt-4 text-xl font-bold text-gray-900"
          >
            {heading}
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.24 }}
            className="mx-auto mt-2 max-w-md text-sm text-gray-600"
          >
            {message}
          </m.p>
          <m.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button href={`/login?callbackUrl=${callbackUrl}`}>Sign in</Button>
            <Button
              href={`/register?callbackUrl=${callbackUrl}`}
              variant="outline"
            >
              Create an account
            </Button>
          </m.div>
        </m.div>
      ) : (
        <m.div
          key="children"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
