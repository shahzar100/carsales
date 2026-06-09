/**
 * CAR DETAILING REVIEW INVITE EMAIL
 *
 * Sent after a detailing appointment is completed.
 * Asks the customer to rate their detailing experience
 * with categories specific to vehicle cleaning & protection.
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

export const ReviewInviteDetailing: React.FC<Props> = ({
  booking,
  shopInfo,
  reviewUrl,
}) => (
  <EmailTemplate
    preview={`How does your car look after our detailing? Tell us at ${shopInfo.businessName}!`}
    title="How Was Your Detail?"
    subtitle="We hope your car looks brand new"
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
      <strong>{booking.serviceType}</strong> detail on{" "}
      <strong>{formatDate(booking.appointmentDate)}</strong>. We put a lot of
      care into every vehicle — we&apos;d love to know if the results matched
      your expectations!
    </Text>

    {/* Detail summary */}
    <Section
      style={{
        backgroundColor: "#fdf2f8",
        border: "1px solid #fbcfe8",
        borderRadius: "8px",
        padding: "16px 20px",
        marginBottom: "24px",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontSize: "12px",
          color: "#9d174d",
          textTransform: "uppercase" as const,
          letterSpacing: "0.5px",
          fontWeight: 600,
        }}
      >
        Detailing Completed
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
      <SectionHeading>Please Rate Your Detailing Experience</SectionHeading>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ width: "100%" }}
      >
        <tbody>
          <RatingCategory
            label="Exterior Finish"
            description="Was the paintwork, wheels, and glass sparkling clean?"
          />
          <RatingCategory
            label="Interior Cleanliness"
            description="Were the seats, dashboard, and carpets thoroughly cleaned?"
          />
          <RatingCategory
            label="Attention to Detail"
            description="Were hard-to-reach areas and small details addressed?"
          />
          <RatingCategory
            label="Product Quality"
            description="Were the cleaning products and coatings high quality?"
          />
          <RatingCategory
            label="Turnaround Time"
            description="Was your vehicle ready when promised?"
          />
          <RatingCategory
            label="Value for Money"
            description="Did the results justify the cost?"
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

    <EmailButton href={reviewUrl} colour="#be185d">
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

export default ReviewInviteDetailing;

(ReviewInviteDetailing as unknown as Record<string, unknown>).PreviewProps = {
  booking: {
    bookingReference: "SB-2026-003456",
    serviceType: "Full Detail",
    appointmentDate: "2026-03-14",
    appointmentTime: "09:00",
    customerInfo: {
      name: "Emily Jones",
      email: "emily@example.com",
      phone: "07700 900222",
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
  reviewUrl: "https://mmcleeds.co.uk/review?ref=SB-2026-003456",
} satisfies Props;
