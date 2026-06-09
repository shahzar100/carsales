/**
 * CAR VIEWING REVIEW INVITE EMAIL
 *
 * Sent after a car viewing appointment is completed.
 * Asks the customer to rate their showroom / viewing experience
 * with categories specific to the car-buying journey.
 */
import React from "react";
import { Text, Section } from "@react-email/components";
import {
  EmailTemplate,
  SectionHeading,
  EmailButton,
} from "./template/EmailTemplate";
import type { CarViewingBooking } from "@/lib/interfaces";
import { formatDate } from "@/lib/utils/booking";
import { formatPrice } from "@/lib/utils/format";

interface ShopInfo {
  businessName: string;
  phone: string;
  email: string;
  address: string;
}

interface Props {
  booking: CarViewingBooking;
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

export const ReviewInviteViewing: React.FC<Props> = ({
  booking,
  shopInfo,
  reviewUrl,
}) => (
  <EmailTemplate
    preview={`How was your visit to ${shopInfo.businessName}? Tell us about your viewing experience!`}
    title="How Was Your Viewing?"
    subtitle="We'd love to hear about your experience"
    headerStyle="default"
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
      Thank you for visiting {shopInfo.businessName} on{" "}
      <strong>{formatDate(booking.appointmentDate)}</strong> to view the{" "}
      <strong>
        {booking.carDetails.year} {booking.carDetails.make}{" "}
        {booking.carDetails.model}
      </strong>
      . We hope you enjoyed the experience!
    </Text>

    {/* Vehicle reminder */}
    <Section
      style={{
        backgroundColor: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: "8px",
        padding: "16px 20px",
        marginBottom: "24px",
        textAlign: "center" as const,
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
        Vehicle Viewed
      </Text>
      <Text
        style={{
          margin: "6px 0 0",
          fontSize: "20px",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        {booking.carDetails.year} {booking.carDetails.make}{" "}
        {booking.carDetails.model}
      </Text>
      <Text
        style={{
          margin: "4px 0 0",
          fontSize: "16px",
          fontWeight: 600,
          color: "#dc2626",
        }}
      >
        {formatPrice(booking.carDetails.price)}
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
      <SectionHeading>Please Rate Your Visit</SectionHeading>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ width: "100%" }}
      >
        <tbody>
          <RatingCategory
            label="Showroom Experience"
            description="Was the showroom clean, welcoming, and well-presented?"
          />
          <RatingCategory
            label="Vehicle Presentation"
            description="Was the car clean and ready for viewing?"
          />
          <RatingCategory
            label="Sales Advisor Knowledge"
            description="Was the advisor knowledgeable and helpful?"
          />
          <RatingCategory
            label="No-Pressure Approach"
            description="Did you feel comfortable and free to browse?"
          />
          <RatingCategory
            label="Test Drive (if applicable)"
            description="Was the test drive well-organised?"
          />
          <RatingCategory
            label="Overall Satisfaction"
            description="How would you rate the visit overall?"
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
      Click below to submit your ratings and share your thoughts
    </Text>

    <EmailButton href={reviewUrl}>Leave Your Review</EmailButton>

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

export default ReviewInviteViewing;

(ReviewInviteViewing as unknown as Record<string, unknown>).PreviewProps = {
  booking: {
    bookingReference: "CV-2026-005678",
    carId: "abc123",
    carDetails: {
      make: "BMW",
      model: "3 Series",
      year: 2024,
      price: 34995,
    },
    appointmentDate: "2026-03-20",
    appointmentTime: "14:30",
    customerInfo: {
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "07700 900456",
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
  reviewUrl: "https://mmcleeds.co.uk/review?ref=CV-2026-005678",
} satisfies Props;
