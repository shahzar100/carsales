/**
 * SERVICE BOOKING CONFIRMATION EMAIL
 */
import React from "react";
import { Text } from "@react-email/components";
import {
  EmailTemplate,
  ReferenceBox,
  SectionHeading,
  DetailRow,
} from "./template/EmailTemplate";
import type { ServiceAppointment } from "@/lib/interfaces";
import { formatDate, formatTime } from "@/lib/utils/booking";

interface ShopInfo {
  businessName: string;
  phone: string;
  email: string;
  address: string;
}

interface Props {
  booking: ServiceAppointment;
  shopInfo: ShopInfo;
}

export const ServiceBookingConfirmation: React.FC<Props> = ({
  booking,
  shopInfo,
}) => (
  <EmailTemplate
    preview={`Your service booking ${booking.bookingReference} is confirmed!`}
    title="Service Booking Confirmed!"
    subtitle={`Thank you for choosing ${shopInfo.businessName}`}
    headerStyle="success"
    businessName={shopInfo.businessName}
    businessAddress={shopInfo.address}
  >
    <ReferenceBox
      label="Booking Reference"
      value={booking.bookingReference}
      note="Please keep this reference number for your records"
      accentColour="#059669"
    />

    <SectionHeading>Appointment Details</SectionHeading>
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      style={{ width: "100%" }}
    >
      <tbody>
        <DetailRow label="Service Type" value={booking.serviceType} />
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
      Need to cancel or reschedule? Please contact us at least 24 hours before
      your appointment.
    </Text>
  </EmailTemplate>
);

export default ServiceBookingConfirmation;

(
  ServiceBookingConfirmation as unknown as Record<string, unknown>
).PreviewProps = {
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
    status: "confirmed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  shopInfo: {
    businessName: "MMC Leeds",
    phone: "0113 548 4182",
    email: "info@mmcleeds.co.uk",
    address: "Roseville Road, Leeds, LS8 5DT",
  },
} satisfies Props;
