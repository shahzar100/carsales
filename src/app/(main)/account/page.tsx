import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AccountDashboard from "@/components/Account/AccountDashboard";

export const metadata: Metadata = {
  title: "My account",
  description:
    "Your saved cars, upcoming bookings and booking history in one place.",
  robots: { index: false, follow: true },
};

/**
 * The customer dashboard. Server-guarded — mirrors how the admin
 * dashboard protects itself in its layout rather than relying on
 * middleware. An unauthenticated visitor is bounced to /login with a
 * callbackUrl so they land back here after signing in.
 */
export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    // AccountDashboard reads the ?tab= query param via useSearchParams.
    <Suspense fallback={null}>
      <AccountDashboard
        user={{ name: session.user.name, email: session.user.email }}
      />
    </Suspense>
  );
}
