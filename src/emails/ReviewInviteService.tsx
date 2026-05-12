/**
 * SERVICE REVIEW INVITE EMAIL
 *
 * Sent after a service appointment is completed.
 * Asks the customer to rate their experience across
 * service-specific categories.
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

// ── Star-rating row (visual placeholder — links to review page) ──
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

export const ReviewInviteService: React.FC<Props> = ({
  booking,
  shopInfo,
  reviewUrl,
}) => (
  <EmailTemplate
    preview={`How was your service at ${shopInfo.businessName}? We'd love your feedback!`}
    title="How Was Your Service?"
    subtitle="Your feedback helps us improve"
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
      Thank you for choosing {shopInfo.businessName} for your recent{" "}
      <strong>{booking.serviceType}</strong> on{" "}
      <strong>{formatDate(booking.appointmentDate)}</strong>. We hope everything
      went smoothly! We&apos;d love to hear your thoughts.
    </Text>

    <Section
      style={{
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "24px",
      }}
    >
      <SectionHeading>Please Rate Your Experience</SectionHeading>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ width: "100%" }}
      >
        <tbody>
          <RatingCategory
            label="Quality of Work"
            description="Was the service completed to a high standard?"
          />
          <RatingCategory
            label="Timeliness"
            description="Was your vehicle ready when promised?"
          />
          <RatingCategory
            label="Value for Money"
            description="Did you feel the pricing was fair?"
          />
          <RatingCategory
            label="Customer Service"
            description="Were our staff friendly and helpful?"
          />
          <RatingCategory
            label="Communication"
            description="Were you kept informed throughout?"
          />
          <RatingCategory
            label="Cleanliness"
            description="Was your vehicle returned clean and tidy?"
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
      Click below to submit your ratings and leave a comment
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

export default ReviewInviteService;

(ReviewInviteService as unknown as Record<string, unknown>).PreviewProps = {
  booking: {
    bookingReference: "SB-2026-001234",
    serviceType: "Full Service",
    appointmentDate: "2026-03-15",
    appointmentTime: "10:00",
    customerInfo: {
      name: "John Smith",
      email: "john@example.com",
      phone: "07700 900123",
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
  reviewUrl: "https://mmcleeds.co.uk/review?ref=SB-2026-001234",
} satisfies Props;
