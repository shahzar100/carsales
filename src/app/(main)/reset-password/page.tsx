import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import AuthShell from "@/components/Account/AuthShell";
import ResetPasswordForm from "@/components/Account/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your account.",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  // Cheap shape check so an obviously-bad link shows the error state
  // without a pointless round-trip. The API re-validates the token
  // against the stored hash regardless.
  const tokenLooksValid =
    typeof token === "string" && /^[a-f0-9]{64}$/i.test(token);

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Choose a new password for your account"
      footer={{
        prompt: "Need a new link?",
        linkText: "Request another",
        href: "/forgot-password",
      }}
    >
      {tokenLooksValid ? (
        <ResetPasswordForm token={token!} />
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">This reset link is invalid.</p>
            <p className="mt-1">
              It may have expired or been mistyped. Request a fresh one from
              the link below.
            </p>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
