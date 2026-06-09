/**
 * REPAIR REVIEW INVITE EMAIL
 *
 * Sent after a repair appointment is completed.
 * Asks the customer to rate their repair experience
 * with categories specific to vehicle repairs.
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

export const ReviewInviteRepair: React.FC<Props> = ({
  booking,
  shopInfo,
  reviewUrl,
}) => (
  <EmailTemplate
    preview={`Your repair at ${shopInfo.businessName} is complete — tell us how we did!`}
    title="How Was Your Repair?"
    subtitle="Help us keep our standards high"
    headerStyle="success"
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
      Thank you for trusting {shopInfo.businessName} with your recent{" "}
      <strong>{booking.serviceType}</strong> on{" "}
      <strong>{formatDate(booking.appointmentDate)}</strong>. Now that
      you&apos;ve had your vehicle back, we&apos;d love to know how we did.
    </Text>

    {/* Repair summary */}
    <Section
      style={{
        backgroundColor: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: "8px",
        padding: "16px 20px",
        marginBottom: "24px",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontSize: "12px",
          color: "#6b7280",
          textTransform: "uppercase" as const,
          letterSpacing: "0.5px",
          fontWeight: 600,
        }}
      >
        Repair Completed
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
        {formatDate(booking.appointmentDate)} · Ref:{" "}
        {booking.bookingReference}
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
      <SectionHeading>Please Rate Your Repair Experience</SectionHeading>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ width: "100%" }}
      >
        <tbody>
          <RatingCategory
            label="Repair Quality"
            description="Was the repair done correctly and to a high standard?"
          />
          <RatingCategory
            label="Diagnosis Accuracy"
            description="Was the problem identified correctly the first time?"
          />
          <RatingCategory
            label="Turnaround Time"
            description="Was the repair completed within the estimated time?"
          />
          <RatingCategory
            label="Cost Transparency"
            description="Were you informed of costs before work began?"
          />
          <RatingCategory
            label="Staff Professionalism"
            description="Were our technicians courteous and knowledgeable?"
          />
          <RatingCategory
            label="Post-Repair Condition"
            description="Was your vehicle returned in good condition?"
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
      Click below to submit your ratings and tell us more
    </Text>

    <EmailButton href={reviewUrl} colour="#059669">
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
      Your booking reference was{" "}
      <strong>{booking.bookingReference}</strong>. This review link is valid
      for 30 days.
    </Text>
  </EmailTemplate>
);

export default ReviewInviteRepair;

(ReviewInviteRepair as unknown as Record<string, unknown>).PreviewProps = {
  booking: {
    bookingReference: "SB-2026-007890",
    serviceType: "Brake Pad Replacement",
    appointmentDate: "2026-03-10",
    appointmentTime: "09:00",
    customerInfo: {
      name: "Mark Taylor",
      email: "mark@example.com",
      phone: "07700 900321",
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
  reviewUrl: "https://mmcleeds.co.uk/review?ref=SB-2026-007890",
} satisfies Props;
