import type { Metadata } from "next";
import AuthShell from "@/components/Account/AuthShell";
import ForgotPasswordForm from "@/components/Account/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a link to reset your account password.",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={{
        prompt: "Remembered it?",
        linkText: "Back to sign in",
        href: "/login",
      }}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
