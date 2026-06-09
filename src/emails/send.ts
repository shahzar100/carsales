/**
 * EMAIL SENDING UTILITY
 *
 * Uses nodemailer to send emails and @react-email/components
 * to render React Email templates to HTML.
 *
 * Supports both SMTP (production) and Ethereal (development)
 * transports. Set SMTP_* env vars for production.
 */
import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import React from "react";

// ── Types ────────────────────────────────────────────────────
export interface SendEmailOptions {
  to: string;
  subject: string;
  /** Pass a React Email component — it will be rendered to HTML */
  react: React.ReactElement;
}

export interface SendEmailResult {
  success: boolean;
  data?: unknown;
  error?: unknown;
}

// ── Transporter (lazy-initialised singleton) ─────────────────
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    // Production SMTP
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else if (process.env.NODE_ENV === "production") {
    // In production, SMTP config is required — fail loudly
    throw new Error(
      "SMTP_HOST, SMTP_USER, and SMTP_PASS must be set in production"
    );
  } else {
    // Development — use Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

// ── Send function ────────────────────────────────────────────
export async function sendEmail({
  to,
  subject,
  react,
}: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const fromEmail = process.env.EMAIL_FROM || "noreply@yourdomain.com";
    const fromName = process.env.EMAIL_FROM_NAME || "MMC Leeds";

    // Render React component to HTML
    const html = await render(react);

    // Plain-text fallback for deliverability. React Email renders a real
    // text version (it decodes HTML entities and lays out block elements
    // as newlines) — far better than naively stripping tags from the HTML,
    // which leaked raw entities like `&amp;` / `&pound;` / `&apos;` into the
    // text part. Render the component a second time in plainText mode.
    const text = await render(react, { plainText: true });

    const transport = await getTransporter();

    const result = await transport.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
      text,
    });

    // Log Ethereal preview URL in development only
    if (process.env.NODE_ENV !== "production") {
      const previewUrl = nodemailer.getTestMessageUrl(result);
      if (previewUrl) {
        console.log("Preview URL:", previewUrl);
      }
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error };
  }
}
