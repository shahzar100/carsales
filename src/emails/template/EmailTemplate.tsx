/**
 * BASE EMAIL TEMPLATE
 *
 * All emails use this wrapper for consistent branding.
 * Individual email templates pass their content as children.
 *
 * Features:
 *  - Branded header with gradient + configurable title/subtitle
 *  - Clean white content card
 *  - Footer with business info & unsubscribe-safe text
 *  - Fully responsive via Tailwind (React Email)
 */
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Img,
  Font,
  Preview,
  Tailwind,
} from "@react-email/components";
import React from "react";

// ── Brand colours (used across all emails) ───────────────────
const brand = {
  primary: "#dc2626",
  primaryDark: "#b91c1c",
  accent: "#991b1b",
  success: "#059669",
  danger: "#dc2626",
  textDark: "#111827",
  textMuted: "#6b7280",
  textLight: "#9ca3af",
  border: "#e5e7eb",
  bgPage: "#f3f4f6",
  bgCard: "#ffffff",
};

export type HeaderStyle = "default" | "success" | "danger" | "info";

const headerGradients: Record<HeaderStyle, string> = {
  default: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.accent} 100%)`,
  success: `linear-gradient(135deg, ${brand.success} 0%, #10b981 100%)`,
  danger: `linear-gradient(135deg, ${brand.danger} 0%, #ef4444 100%)`,
  info: `linear-gradient(135deg, #1f2937 0%, ${brand.primary} 100%)`,
};

// ── Shared sub-components ────────────────────────────────────

/** A key → value detail row used inside content sections */
export const DetailRow: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <tr>
    <td
      style={{
        padding: "12px 0",
        borderBottom: `1px solid ${brand.border}`,
        color: brand.textMuted,
        fontSize: "14px",
        width: "40%",
      }}
    >
      {label}
    </td>
    <td
      style={{
        padding: "12px 0",
        borderBottom: `1px solid ${brand.border}`,
        textAlign: "right" as const,
        color: brand.textDark,
        fontSize: "14px",
        fontWeight: 600,
      }}
    >
      {value}
    </td>
  </tr>
);

/** A highlighted reference / key info box */
export const ReferenceBox: React.FC<{
  label: string;
  value: string;
  note?: string;
  accentColour?: string;
}> = ({ label, value, note, accentColour = brand.primary }) => (
  <Section
    style={{
      backgroundColor: "#f9fafb",
      borderLeft: `4px solid ${accentColour}`,
      padding: "20px",
      borderRadius: "4px",
      marginBottom: "20px",
    }}
  >
    <Text
      style={{
        margin: 0,
        color: brand.textMuted,
        fontSize: "13px",
        fontWeight: 600,
        textTransform: "uppercase" as const,
        letterSpacing: "0.5px",
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        margin: "8px 0 0",
        color: brand.textDark,
        fontSize: "24px",
        fontWeight: 700,
      }}
    >
      {value}
    </Text>
    {note && (
      <Text
        style={{
          margin: "8px 0 0",
          color: brand.textLight,
          fontSize: "13px",
        }}
      >
        {note}
      </Text>
    )}
  </Section>
);

/** A prominent CTA button */
export const EmailButton: React.FC<{
  href: string;
  children: React.ReactNode;
  colour?: string;
}> = ({ href, children, colour = brand.primary }) => (
  <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
    <a
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: colour,
        color: "#ffffff",
        textDecoration: "none",
        padding: "14px 32px",
        borderRadius: "8px",
        fontSize: "15px",
        fontWeight: 600,
      }}
    >
      {children}
    </a>
  </Section>
);

/** A section heading inside the content area */
export const SectionHeading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Text
    style={{
      margin: "0 0 16px",
      color: brand.textDark,
      fontSize: "18px",
      fontWeight: 600,
    }}
  >
    {children}
  </Text>
);

// ── Main template ────────────────────────────────────────────
interface EmailTemplateProps {
  /** Text shown in email client preview (before opening) */
  preview: string;
  /** Large heading in the coloured header */
  title: string;
  /** Smaller text under the heading */
  subtitle?: string;
  /** Header colour scheme */
  headerStyle?: HeaderStyle;
  /** The email body — use the sub-components above */
  children: React.ReactNode;
  /** Business name shown in the footer */
  businessName?: string;
  /** Business address shown in the footer */
  businessAddress?: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  preview,
  title,
  subtitle,
  headerStyle = "default",
  children,
  businessName = "Car Sales",
  businessAddress,
}) => (
  <Html>
    <Head>
      <Font
        fontFamily="Inter"
        fallbackFontFamily="Arial"
        webFont={{
          url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
          format: "woff2",
        }}
        fontWeight={400}
        fontStyle="normal"
      />
    </Head>
    <Preview>{preview}</Preview>
    <Tailwind>
      <Body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "'Inter', Arial, sans-serif",
          backgroundColor: brand.bgPage,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <Section
            style={{
              background: headerGradients[headerStyle],
              padding: "40px 30px",
              textAlign: "center" as const,
              borderRadius: "12px 12px 0 0",
            }}
          >
            <Text
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "26px",
                fontWeight: 700,
                lineHeight: "1.3",
              }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={{
                  margin: "8px 0 0",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "15px",
                }}
              >
                {subtitle}
              </Text>
            )}
          </Section>

          {/* ── Content ────────────────────────────────────── */}
          <Section
            style={{
              backgroundColor: brand.bgCard,
              padding: "32px 30px",
              borderLeft: `1px solid ${brand.border}`,
              borderRight: `1px solid ${brand.border}`,
            }}
          >
            {children}
          </Section>

          {/* ── Footer ─────────────────────────────────────── */}
          <Section
            style={{
              backgroundColor: brand.bgCard,
              padding: "0 30px 24px",
              borderLeft: `1px solid ${brand.border}`,
              borderRight: `1px solid ${brand.border}`,
              borderBottom: `1px solid ${brand.border}`,
              borderRadius: "0 0 12px 12px",
            }}
          >
            <Hr
              style={{
                borderTop: `1px solid ${brand.border}`,
                margin: "0 0 20px",
              }}
            />
            <Text
              style={{
                margin: 0,
                color: brand.textLight,
                fontSize: "13px",
                textAlign: "center" as const,
                lineHeight: "1.6",
              }}
            >
              {businessName}
              {businessAddress && (
                <>
                  <br />
                  {businessAddress}
                </>
              )}
            </Text>
            <Text
              style={{
                margin: "12px 0 0",
                color: brand.textLight,
                fontSize: "12px",
                textAlign: "center" as const,
              }}
            >
              This is an automated message — please do not reply directly.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default EmailTemplate;
