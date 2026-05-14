/**
 * EMAIL VERIFICATION EMAIL
 *
 * Sent to email/password customers on sign-up (and on resend from the
 * account dashboard) so they can confirm they own the address. OAuth
 * and magic-link customers never receive this — the provider already
 * proved ownership.
 */
import React from "react";
import { Text } from "@react-email/components";
import { EmailTemplate, EmailButton } from "./template/EmailTemplate";

interface Props {
  name: string;
  verifyToken: string;
  baseUrl?: string;
}

export const VerifyEmail: React.FC<Props> = ({
  name,
  verifyToken,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
}) => {
  const verifyLink = `${baseUrl}/api/auth/verify-email?token=${verifyToken}`;

  return (
    <EmailTemplate
      preview="Confirm your email address"
      title="Confirm your email"
      subtitle="One quick step to finish setting up your account"
      headerStyle="info"
    >
      <Text
        style={{
          color: "#374151",
          fontSize: "15px",
          lineHeight: "1.6",
          margin: "0 0 20px",
        }}
      >
        Hi <strong>{name}</strong>, thanks for creating an account. Confirm
        your email address so we can keep your bookings and saved cars
        attached to it.
      </Text>

      <Text
        style={{
          color: "#374151",
          fontSize: "15px",
          lineHeight: "1.6",
          margin: "0 0 8px",
        }}
      >
        This link expires in <strong>24 hours</strong>.
      </Text>

      <EmailButton href={verifyLink}>Confirm email address</EmailButton>

      <Text
        style={{
          color: "#6b7280",
          fontSize: "13px",
          lineHeight: "1.6",
          margin: "16px 0 0",
        }}
      >
        If you didn&apos;t create this account, you can safely ignore this
        email.
      </Text>

      <Text
        style={{
          color: "#9ca3af",
          fontSize: "12px",
          lineHeight: "1.5",
          margin: "20px 0 0",
          wordBreak: "break-all" as const,
        }}
      >
        Or copy and paste this link into your browser:
        <br />
        <a href={verifyLink} style={{ color: "#dc2626" }}>
          {verifyLink}
        </a>
      </Text>
    </EmailTemplate>
  );
};

export default VerifyEmail;

(VerifyEmail as unknown as Record<string, unknown>).PreviewProps = {
  name: "Jane Smith",
  verifyToken: "abc123def456ghi789jkl012mno345pqr678stu901vwx234",
} satisfies Props;
