/**
 * PASSWORD RESET EMAIL
 */
import React from "react";
import { Text } from "@react-email/components";
import { EmailTemplate, EmailButton } from "./template/EmailTemplate";

interface Props {
  username: string;
  resetToken: string;
  baseUrl?: string;
}

export const PasswordReset: React.FC<Props> = ({
  username,
  resetToken,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
}) => {
  const resetLink = `${baseUrl}/admin/reset-password?token=${resetToken}`;

  return (
    <EmailTemplate
      preview={`Password reset requested for ${username}`}
      title="Password Reset Request"
      subtitle="A password reset was requested for your admin account"
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
        Hi <strong>{username}</strong>, a password reset was requested for your
        admin account. Click the button below to set a new password.
      </Text>

      <Text
        style={{
          color: "#374151",
          fontSize: "15px",
          lineHeight: "1.6",
          margin: "0 0 8px",
        }}
      >
        This link will expire in <strong>24 hours</strong>.
      </Text>

      <EmailButton href={resetLink}>Reset Password</EmailButton>

      <Text
        style={{
          color: "#6b7280",
          fontSize: "13px",
          lineHeight: "1.6",
          margin: "16px 0 0",
        }}
      >
        If you didn't request this, you can safely ignore this email. Your
        password will remain unchanged.
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
        <a href={resetLink} style={{ color: "#dc2626" }}>
          {resetLink}
        </a>
      </Text>
    </EmailTemplate>
  );
};

export default PasswordReset;

(PasswordReset as unknown as Record<string, unknown>).PreviewProps = {
  username: "admin_john",
  resetToken: "abc123def456ghi789jkl012mno345pqr678stu901vwx234",
} satisfies Props;
