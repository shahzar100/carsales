import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    // Validate environment variables
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const fromEmail = process.env.EMAIL_FROM || "bookings@yourdomain.com";

    console.log(`📧 Sending email to: ${to}`);
    console.log(`📧 From: ${fromEmail}`);
    console.log(`📧 Subject: ${subject}`);

    const result = await resend.emails.send({
      from: `Car Sales Bookings <${fromEmail}>`,
      to: [to],
      subject,
      html,
      // Anti-spam headers
      headers: {
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        Importance: "Normal",
      },
      // Add text version for better deliverability
      text: html
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    });

    console.log("✅ Email sent successfully:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error };
  }
}
