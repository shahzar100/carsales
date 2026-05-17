import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuthShell from "@/components/Account/AuthShell";
import RegisterForm from "@/components/Account/RegisterForm";

// Per-user / per-request; must not cache. (Audit #1.)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create an account to save cars across devices and track your bookings.",
  robots: { index: false, follow: true },
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  return (
    <AuthShell
      title="Create an account"
      subtitle="Save cars across devices and keep track of your bookings"
      footer={{
        prompt: "Already have an account?",
        linkText: "Sign in",
        href: "/login",
      }}
    >
      {/* RegisterForm reads ?callbackUrl via useSearchParams. */}
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
