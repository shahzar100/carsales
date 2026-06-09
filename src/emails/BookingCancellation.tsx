/**
 * BOOKING CANCELLATION EMAIL
 */
import React from "react";
import { Text, Section } from "@react-email/components";
import {
  EmailTemplate,
  ReferenceBox,
  SectionHeading,
  DetailRow,
} from "./template/EmailTemplate";
import type { ServiceAppointment, CarViewingBooking } from "@/lib/interfaces";
import { formatDate, formatTime } from "@/lib/utils/booking";

interface ShopInfo {
  businessName: string;
  phone: string;
  email: string;
  address: string;
}

interface Props {
  booking: ServiceAppointment | CarViewingBooking;
  bookingType: "service" | "viewing";
  shopInfo: ShopInfo;
}

export const BookingCancellation: React.FC<Props> = ({
  booking,
  bookingType,
  shopInfo,
}) => {
  const isViewing = bookingType === "viewing";
  const viewingBooking = booking as CarViewingBooking;

  return (
    <EmailTemplate
      preview={`Booking ${booking.bookingReference} has been cancelled`}
      title="Booking Cancelled"
      subtitle="We're sorry to inform you of this cancellation"
      headerStyle="danger"
      businessName={shopInfo.businessName}
      businessAddress={shopInfo.address}
    >
      <ReferenceBox
        label="Booking Reference"
        value={booking.bookingReference}
        note="This booking has been cancelled"
        accentColour="#dc2626"
      />

      {isViewing && (
        <Section
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "20px",
          }}
        >
          <Text
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#991b1b",
              fontWeight: 600,
            }}
          >
            Cancelled Vehicle Viewing
          </Text>
          <Text
            style={{
              margin: "4px 0 0",
              fontSize: "16px",
              color: "#111827",
              fontWeight: 600,
            }}
          >
            {viewingBooking.carDetails.year} {viewingBooking.carDetails.make}{" "}
            {viewingBooking.carDetails.model}
          </Text>
        </Section>
      )}

      <SectionHeading>Cancelled Booking Details</SectionHeading>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ width: "100%" }}
      >
        <tbody>
          <DetailRow
            label="Type"
            value={isViewing ? "Car Viewing" : "Service Appointment"}
          />
          {!isViewing && (
            <DetailRow
              label="Service"
              value={(booking as ServiceAppointment).serviceType}
            />
          )}
          <DetailRow
            label="Original Date"
            value={formatDate(booking.appointmentDate)}
          />
          <DetailRow
            label="Original Time"
            value={formatTime(booking.appointmentTime)}
          />
          {booking.cancellationReason && (
            <DetailRow label="Reason" value={booking.cancellationReason} />
          )}
        </tbody>
      </table>

      <Text
        style={{
          marginTop: "24px",
          color: "#6b7280",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
      >
        If you&apos;d like to rebook, please visit our website or contact us
        directly.
      </Text>
      <Text style={{ color: "#6b7280", fontSize: "14px", margin: "8px 0 0" }}>
        📞 {shopInfo.phone} &nbsp;|&nbsp; ✉️ {shopInfo.email}
      </Text>
    </EmailTemplate>
  );
};

export default BookingCancellation;

(BookingCancellation as unknown as Record<string, unknown>).PreviewProps = {
  booking: {
    bookingReference: "SB-2026-009999",
    serviceType: "MOT Test",
    appointmentDate: "2026-03-25",
    appointmentTime: "09:00",
    customerInfo: {
      name: "Alex Johnson",
      email: "alex@example.com",
      phone: "07700 900789",
    },
    status: "cancelled",
    cancellationReason:
      "Customer requested cancellation due to schedule conflict",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  bookingType: "service",
  shopInfo: {
    businessName: "MMC Leeds",
    phone: "0113 548 4182",
    email: "info@mmcleeds.co.uk",
    address: "Roseville Road, Leeds, LS8 5DT",
  },
} satisfies Props;
