/**
 * CAR VIEWING BOOKING CONFIRMATION EMAIL
 */
import React from "react";
import { Text, Section } from "@react-email/components";
import {
  EmailTemplate,
  ReferenceBox,
  SectionHeading,
  DetailRow,
} from "./template/EmailTemplate";
import type { CarViewingBooking } from "@/lib/interfaces";
import { formatDate, formatTime } from "@/lib/utils/booking";

interface ShopInfo {
  businessName: string;
  phone: string;
  email: string;
  address: string;
}

interface Props {
  booking: CarViewingBooking;
  shopInfo: ShopInfo;
}

export const CarViewingConfirmation: React.FC<Props> = ({
  booking,
  shopInfo,
}) => (
  <EmailTemplate
    preview={`Your car viewing ${booking.bookingReference} is confirmed — ${booking.carDetails.make} ${booking.carDetails.model}`}
    title="Car Viewing Confirmed!"
    subtitle={`Thank you for choosing ${shopInfo.businessName}`}
    headerStyle="default"
    businessName={shopInfo.businessName}
    businessAddress={shopInfo.address}
  >
    <ReferenceBox
      label="Booking Reference"
      value={booking.bookingReference}
      note="Please keep this reference number for your records"
    />

    {/* Vehicle info highlight */}
    <Section
      style={{
        backgroundColor: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
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
        Vehicle
      </Text>
      <Text
        style={{
          margin: "6px 0 0",
          fontSize: "22px",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        {booking.carDetails.year} {booking.carDetails.make}{" "}
        {booking.carDetails.model}
      </Text>
      <Text
        style={{
          margin: "6px 0 0",
          fontSize: "18px",
          fontWeight: 600,
          color: "#dc2626",
        }}
      >
        £{booking.carDetails.price.toLocaleString()}
      </Text>
    </Section>

    <SectionHeading>Viewing Details</SectionHeading>
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      style={{ width: "100%" }}
    >
      <tbody>
        <DetailRow label="Date" value={formatDate(booking.appointmentDate)} />
        <DetailRow label="Time" value={formatTime(booking.appointmentTime)} />
        <DetailRow label="Customer" value={booking.customerInfo.name} />
        <DetailRow label="Email" value={booking.customerInfo.email} />
        <DetailRow label="Phone" value={booking.customerInfo.phone} />
      </tbody>
    </table>

    <SectionHeading>Location</SectionHeading>
    <Text style={{ color: "#374151", fontSize: "14px", margin: "0 0 4px" }}>
      {shopInfo.businessName}
    </Text>
    <Text style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
      {shopInfo.address}
    </Text>
    <Text style={{ color: "#6b7280", fontSize: "14px", margin: "4px 0 0" }}>
      📞 {shopInfo.phone} &nbsp;|&nbsp; ✉️ {shopInfo.email}
    </Text>

    <Text
      style={{
        marginTop: "24px",
        color: "#6b7280",
        fontSize: "13px",
        lineHeight: "1.6",
      }}
    >
      Please arrive 5 minutes early. Bring a valid driving licence if you'd like
      a test drive.
    </Text>
  </EmailTemplate>
);

export default CarViewingConfirmation;

(CarViewingConfirmation as unknown as Record<string, unknown>).PreviewProps = {
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
    status: "confirmed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  shopInfo: {
    businessName: "MMC Leeds",
    phone: "0113 468 9292",
    email: "info@mmcleeds.co.uk",
    address: "Roseville Road, Leeds, LS8 5DT",
  },
} satisfies Props;
