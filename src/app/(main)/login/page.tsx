import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuthShell from "@/components/Account/AuthShell";
import LoginForm from "@/components/Account/LoginForm";

// Per-user / per-request; must not cache. (Audit #1.)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your account to view saved cars, bookings and viewing history.",
  robots: { index: false, follow: true },
};

/**
 * Server-checks the session first — if already signed in, redirect to
 * the dashboard rather than flashing the form. Mirrors the admin login
 * page's pattern.
 */
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your saved cars and bookings"
      footer={{
        prompt: "New here?",
        linkText: "Create an account",
        href: "/register",
      }}
    >
      {/* LoginForm reads ?error / ?callbackUrl via useSearchParams. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
