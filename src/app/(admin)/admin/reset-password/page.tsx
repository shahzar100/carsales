import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import ResetPasswordForm from "@/components/Admin/ResetPasswordForm";
import AuthShell from "@/components/Account/AuthShell";
import { InfoBanner } from "@/components/Form/FormPrimitives";

export const metadata: Metadata = {
  title: "Reset password — Admin",
  robots: { index: false, follow: false, noarchive: true },
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function AdminResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const tokenLooksValid =
    typeof token === "string" && /^[a-f0-9]{64}$/i.test(token);

  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your admin account."
      variant="admin"
    >
      {tokenLooksValid ? (
        <ResetPasswordForm token={token!} />
      ) : (
        <>
          <InfoBanner
            variant="error"
            icon={<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          >
            <p className="font-medium">This reset link is invalid.</p>
            <p className="mt-1">
              The link may have expired or been malformed. Request a new
              one from your administrator.
            </p>
          </InfoBanner>
          <Link
            href="/admin/login"
            className="mt-6 block text-center text-sm text-red-600 hover:underline"
          >
            Back to sign in
          </Link>
        </>
      )}
    </AuthShell>
  );
}
