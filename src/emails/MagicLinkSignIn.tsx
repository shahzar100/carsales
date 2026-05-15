/**
 * MAGIC-LINK SIGN-IN EMAIL
 *
 * Sent by the Auth.js Nodemailer provider's custom
 * `sendVerificationRequest` (see src/auth.ts). Replaces the provider's
 * plain-HTML default so the magic link matches the rest of the
 * transactional email styling.
 */
import React from "react";
import { Text } from "@react-email/components";
import { EmailTemplate, EmailButton } from "./template/EmailTemplate";

interface Props {
  url: string;
}

export const MagicLinkSignIn: React.FC<Props> = ({ url }) => {
  return (
    <EmailTemplate
      preview="Your sign-in link"
      title="Sign in to your account"
      subtitle="Use the button below to finish signing in"
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
        Click the button below to sign in. This link can only be used once
        and expires in <strong>24 hours</strong>.
      </Text>

      <EmailButton href={url}>Sign in</EmailButton>

      <Text
        style={{
          color: "#6b7280",
          fontSize: "13px",
          lineHeight: "1.6",
          margin: "16px 0 0",
        }}
      >
        If you didn&apos;t request this, you can safely ignore this email — no
        one can sign in without the link above.
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
        <a href={url} style={{ color: "#dc2626" }}>
          {url}
        </a>
      </Text>
    </EmailTemplate>
  );
};

export default MagicLinkSignIn;

(MagicLinkSignIn as unknown as Record<string, unknown>).PreviewProps = {
  url: "https://example.com/api/auth/callback/nodemailer?token=abc123&email=jane%40example.com",
} satisfies Props;
