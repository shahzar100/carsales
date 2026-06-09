/**
 * WINDOW TINTING REVIEW INVITE EMAIL
 *
 * Sent after a window-tint appointment is completed.
 * Asks the customer to rate their tinting experience
 * with categories specific to film quality and finish.
 */
import React from "react";
import { Text, Section } from "@react-email/components";
import {
  EmailTemplate,
  SectionHeading,
  EmailButton,
} from "./template/EmailTemplate";
import type { ServiceAppointment } from "@/lib/interfaces";
import { formatDate } from "@/lib/utils/booking";

interface ShopInfo {
  businessName: string;
  phone: string;
  email: string;
  address: string;
}

interface Props {
  booking: ServiceAppointment;
  shopInfo: ShopInfo;
  reviewUrl: string;
}

const RatingCategory: React.FC<{ label: string; description: string }> = ({
  label,
  description,
}) => (
  <tr>
    <td
      style={{
        padding: "14px 0",
        borderBottom: "1px solid #e5e7eb",
        verticalAlign: "top",
      }}
    >
      <Text
        style={{
          margin: 0,
          color: "#111827",
          fontSize: "15px",
          fontWeight: 600,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          margin: "2px 0 0",
          color: "#6b7280",
          fontSize: "13px",
        }}
      >
        {description}
      </Text>
    </td>
    <td
      style={{
        padding: "14px 0",
        borderBottom: "1px solid #e5e7eb",
        textAlign: "right" as const,
        verticalAlign: "middle",
        fontSize: "20px",
        letterSpacing: "2px",
      }}
    >
      ☆☆☆☆☆
    </td>
  </tr>
);

export const ReviewInviteTinting: React.FC<Props> = ({
  booking,
  shopInfo,
  reviewUrl,
}) => (
  <EmailTemplate
    preview={`How's the new tint? Share your experience with ${shopInfo.businessName}!`}
    title="How's Your New Tint?"
    subtitle="Tell us about your window-tinting experience"
    headerStyle="info"
    businessName={shopInfo.businessName}
    businessAddress={shopInfo.address}
  >
    <Text
      style={{
        color: "#374151",
        fontSize: "15px",
        lineHeight: "1.6",
        margin: "0 0 16px",
      }}
    >
      Hi {booking.customerInfo.name},
    </Text>

    <Text
      style={{
        color: "#374151",
        fontSize: "15px",
        lineHeight: "1.6",
        margin: "0 0 20px",
      }}
    >
      Thank you for choosing {shopInfo.businessName} for your{" "}
      <strong>{booking.serviceType}</strong> on{" "}
      <strong>{formatDate(booking.appointmentDate)}</strong>. We hope
      you&apos;re enjoying the new look and the added privacy! We&apos;d really
      appreciate your feedback.
    </Text>

    {/* Tint summary */}
    <Section
      style={{
        backgroundColor: "#f5f3ff",
        border: "1px solid #ddd6fe",
        borderRadius: "8px",
        padding: "16px 20px",
        marginBottom: "24px",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontSize: "12px",
          color: "#5b21b6",
          textTransform: "uppercase" as const,
          letterSpacing: "0.5px",
          fontWeight: 600,
        }}
      >
        Tinting Completed
      </Text>
      <Text
        style={{
          margin: "6px 0 0",
          fontSize: "18px",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        {booking.serviceType}
      </Text>
      <Text
        style={{
          margin: "4px 0 0",
          fontSize: "14px",
          color: "#6b7280",
        }}
      >
        {formatDate(booking.appointmentDate)} · Ref: {booking.bookingReference}
      </Text>
    </Section>

    <Section
      style={{
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "24px",
      }}
    >
      <SectionHeading>Please Rate Your Tinting Experience</SectionHeading>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ width: "100%" }}
      >
        <tbody>
          <RatingCategory
            label="Film Quality"
            description="Does the tint look even, smooth, and bubble-free?"
          />
          <RatingCategory
            label="Shade Accuracy"
            description="Did the finished tint match the shade you selected?"
          />
          <RatingCategory
            label="Application Neatness"
            description="Were edges clean with no peeling or gaps?"
          />
          <RatingCategory
            label="UV / Heat Reduction"
            description="Have you noticed a difference in cabin temperature?"
          />
          <RatingCategory
            label="Staff Knowledge"
            description="Were tinting options and regulations explained clearly?"
          />
          <RatingCategory
            label="Overall Satisfaction"
            description="How would you rate the experience overall?"
          />
        </tbody>
      </table>
    </Section>

    <Text
      style={{
        color: "#6b7280",
        fontSize: "14px",
        textAlign: "center" as const,
        margin: "0 0 8px",
      }}
    >
      Click below to rate us and share your thoughts
    </Text>

    <EmailButton href={reviewUrl} colour="#7c3aed">
      Leave Your Review
    </EmailButton>

    <Text
      style={{
        color: "#9ca3af",
        fontSize: "13px",
        lineHeight: "1.5",
        margin: "16px 0 0",
        textAlign: "center" as const,
      }}
    >
      Your booking reference was <strong>{booking.bookingReference}</strong>.
      This review link is valid for 30 days.
    </Text>
  </EmailTemplate>
);

export default ReviewInviteTinting;

(ReviewInviteTinting as unknown as Record<string, unknown>).PreviewProps = {
  booking: {
    bookingReference: "SB-2026-006789",
    serviceType: "Window Tint - Ceramic Pro",
    appointmentDate: "2026-03-13",
    appointmentTime: "11:00",
    customerInfo: {
      name: "David Wilson",
      email: "david@example.com",
      phone: "07700 900888",
    },
    status: "completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  shopInfo: {
    businessName: "MMC Leeds",
    phone: "0113 548 4182",
    email: "info@mmcleeds.co.uk",
    address: "Roseville Road, Leeds, LS8 5DT",
  },
  reviewUrl: "https://mmcleeds.co.uk/review?ref=SB-2026-006789",
} satisfies Props;
