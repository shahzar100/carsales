import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@carsales.com",
      to,
      subject,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error };
  }
}
