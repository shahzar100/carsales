/**
 * BREAKDOWN RECOVERY REVIEW INVITE EMAIL
 *
 * Sent after a breakdown / recovery callout is completed.
 * Asks the customer to rate their roadside-assistance experience
 * with categories specific to emergency recovery.
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

export const ReviewInviteRecovery: React.FC<Props> = ({
  booking,
  shopInfo,
  reviewUrl,
}) => (
  <EmailTemplate
    preview={`How was your recovery experience with ${shopInfo.businessName}?`}
    title="How Was Your Recovery?"
    subtitle="Your roadside experience matters to us"
    headerStyle="danger"
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
      We hope you're back on the road safely! Thank you for calling{" "}
      {shopInfo.businessName} for your <strong>{booking.serviceType}</strong> on{" "}
      <strong>{formatDate(booking.appointmentDate)}</strong>. We'd appreciate
      your feedback so we can keep improving our emergency service.
    </Text>

    {/* Recovery summary */}
    <Section
      style={{
        backgroundColor: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        padding: "16px 20px",
        marginBottom: "24px",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontSize: "12px",
          color: "#991b1b",
          textTransform: "uppercase" as const,
          letterSpacing: "0.5px",
          fontWeight: 600,
        }}
      >
        Recovery Completed
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
      <SectionHeading>Please Rate Your Recovery Experience</SectionHeading>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ width: "100%" }}
      >
        <tbody>
          <RatingCategory
            label="Response Time"
            description="How quickly did we arrive after your call?"
          />
          <RatingCategory
            label="Communication"
            description="Were you kept informed of arrival time and progress?"
          />
          <RatingCategory
            label="Professionalism"
            description="Was the recovery operator courteous and professional?"
          />
          <RatingCategory
            label="Vehicle Care"
            description="Was your vehicle handled safely during recovery?"
          />
          <RatingCategory
            label="Problem Resolution"
            description="Was the issue resolved or your vehicle safely recovered?"
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
      Click below to submit your ratings and share your experience
    </Text>

    <EmailButton href={reviewUrl} colour="#dc2626">
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

export default ReviewInviteRecovery;

(ReviewInviteRecovery as unknown as Record<string, unknown>).PreviewProps = {
  booking: {
    bookingReference: "SB-2026-004567",
    serviceType: "Emergency Towing",
    appointmentDate: "2026-03-12",
    appointmentTime: "22:00",
    customerInfo: {
      name: "Sarah Mitchell",
      email: "sarah@example.com",
      phone: "07700 900654",
    },
    status: "completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  shopInfo: {
    businessName: "MMC Leeds",
    phone: "0113 468 9292",
    email: "info@mmcleeds.co.uk",
    address: "Roseville Road, Leeds, LS8 5DT",
  },
  reviewUrl: "https://mmcleeds.co.uk/review?ref=SB-2026-004567",
} satisfies Props;
