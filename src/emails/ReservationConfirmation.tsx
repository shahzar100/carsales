/**
 * (#30) RESERVATION CONFIRMATION EMAIL
 *
 * Sent immediately after a customer reserves a car online. Reservations
 * expire 48 hours after creation unless the customer pays the deposit
 * in cash at the showroom.
 */
import React from "react";
import { Text, Section } from "@react-email/components";
import {
  EmailTemplate,
  ReferenceBox,
  SectionHeading,
  DetailRow,
} from "./template/EmailTemplate";
import type { Reservation } from "@/lib/interfaces";
import { formatPrice } from "@/lib/utils/format";

interface ShopInfo {
  businessName: string;
  phone: string;
  email: string;
  address: string;
}

interface Props {
  reservation: Omit<Reservation, "_id">;
  shopInfo: ShopInfo;
}

export const ReservationConfirmation: React.FC<Props> = ({
  reservation,
  shopInfo,
}) => {
  const expires = reservation.expiresAt
    ? new Date(reservation.expiresAt).toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <EmailTemplate
      preview={`Reservation ${reservation.reservationReference} confirmed — ${reservation.carDetails.make} ${reservation.carDetails.model}`}
      title="Reservation Confirmed"
      subtitle={`Thank you for reserving with ${shopInfo.businessName}`}
      headerStyle="default"
      businessName={shopInfo.businessName}
      businessAddress={shopInfo.address}
    >
      <ReferenceBox
        label="Reservation Reference"
        value={reservation.reservationReference}
        note="Quote this reference when you visit"
      />

      <Section
        style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
          textAlign: "center" as const,
        }}
      >
        <Text style={{ margin: 0, fontSize: "12px", color: "#b91c1c" }}>
          Your reserved vehicle
        </Text>
        <Text
          style={{
            margin: "6px 0 0",
            fontSize: "18px",
            fontWeight: 700,
            color: "#7f1d1d",
          }}
        >
          {reservation.carDetails.year} {reservation.carDetails.make}{" "}
          {reservation.carDetails.model}
        </Text>
        <Text
          style={{
            margin: "4px 0 0",
            fontSize: "14px",
            color: "#7f1d1d",
          }}
        >
          {formatPrice(reservation.carDetails.price)}
        </Text>
      </Section>

      <SectionHeading>Next steps</SectionHeading>
      <Text style={{ margin: "0 0 12px", color: "#374151", lineHeight: 1.6 }}>
        We&apos;ll call you on{" "}
        <strong>{reservation.customerInfo.phone}</strong> shortly to arrange a
        time for you to visit the showroom.
      </Text>
      <Text style={{ margin: "0 0 12px", color: "#374151", lineHeight: 1.6 }}>
        Please bring cash for the deposit. Once we receive your deposit we
        confirm the reservation and take the car off sale until your purchase
        is complete.
      </Text>
      <Text
        style={{
          margin: "0 0 20px",
          padding: "12px",
          backgroundColor: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "6px",
          color: "#92400e",
          fontSize: "13px",
        }}
      >
        ⏰ This reservation expires at <strong>{expires}</strong> if a deposit
        hasn&apos;t been received by then.
      </Text>

      <SectionHeading>Your details</SectionHeading>
      <DetailRow label="Name" value={reservation.customerInfo.name} />
      <DetailRow label="Email" value={reservation.customerInfo.email} />
      <DetailRow label="Phone" value={reservation.customerInfo.phone} />
      {reservation.notes && (
        <DetailRow label="Notes" value={reservation.notes} />
      )}

      <SectionHeading>Need to reach us?</SectionHeading>
      <DetailRow label="Phone" value={shopInfo.phone} />
      <DetailRow label="Email" value={shopInfo.email} />
    </EmailTemplate>
  );
};
