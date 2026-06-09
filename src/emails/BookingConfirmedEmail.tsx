/**
 * BOOKING CONFIRMED EMAIL
 *
 * Sent when an admin/manager transitions a booking from `pending` to
 * `confirmed` via PUT /api/admin/bookings. Mirrors the visual style of
 * BookingCancellation.tsx — same EmailTemplate wrapper, same DetailRow
 * layout — but with a success accent so customers can tell the two
 * messages apart at a glance.
 *
 * Handles both service appointments and car-viewing bookings; the
 * viewing variant adds a vehicle highlight block matching the inverse
 * shown in the cancellation template.
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
import { formatPrice } from "@/lib/utils/format";

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

export const BookingConfirmedEmail: React.FC<Props> = ({
  booking,
  bookingType,
  shopInfo,
}) => {
  const isViewing = bookingType === "viewing";
  const viewingBooking = booking as CarViewingBooking;
  const serviceBooking = booking as ServiceAppointment;

  return (
    <EmailTemplate
      preview={`Your booking ${booking.bookingReference} is confirmed`}
      title="Booking Confirmed"
      subtitle={`Your appointment with ${shopInfo.businessName} is locked in`}
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

      {isViewing && viewingBooking.carDetails && (
        <Section
          style={{
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "20px",
          }}
        >
          <Text
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#065f46",
              fontWeight: 600,
            }}
          >
            Confirmed Vehicle Viewing
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
          {typeof viewingBooking.carDetails.price === "number" && (
            <Text
              style={{
                margin: "4px 0 0",
                fontSize: "14px",
                color: "#065f46",
                fontWeight: 600,
              }}
            >
              {formatPrice(viewingBooking.carDetails.price)}
            </Text>
          )}
        </Section>
      )}

      <SectionHeading>Confirmed Booking Details</SectionHeading>
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
            <DetailRow label="Service" value={serviceBooking.serviceType} />
          )}
          <DetailRow label="Date" value={formatDate(booking.appointmentDate)} />
          <DetailRow label="Time" value={formatTime(booking.appointmentTime)} />
          <DetailRow label="Customer" value={booking.customerInfo.name} />
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

      <Text
        style={{
          marginTop: "24px",
          color: "#6b7280",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
      >
        Need to reschedule or cancel? Please contact us at least 24 hours before
        your appointment so we can offer the slot to another customer.
      </Text>
      <Text style={{ color: "#6b7280", fontSize: "14px", margin: "8px 0 0" }}>
        Phone: {shopInfo.phone} &nbsp;|&nbsp; Email: {shopInfo.email}
      </Text>
    </EmailTemplate>
  );
};

export default BookingConfirmedEmail;

(BookingConfirmedEmail as unknown as Record<string, unknown>).PreviewProps = {
  booking: {
    bookingReference: "BK-2026-004321",
    serviceType: "MOT Test",
    appointmentDate: "2026-04-12",
    appointmentTime: "11:30",
    customerInfo: {
      name: "Sam Taylor",
      email: "sam@example.com",
      phone: "07700 900222",
    },
    status: "confirmed",
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
