/**
 * (#31) PART-EXCHANGE ENQUIRY CONFIRMATION EMAIL
 */
import React from "react";
import { Text } from "@react-email/components";
import {
  EmailTemplate,
  ReferenceBox,
  SectionHeading,
  DetailRow,
} from "./template/EmailTemplate";
import type { PartExchange } from "@/lib/interfaces";

interface ShopInfo {
  businessName: string;
  phone: string;
  email: string;
  address: string;
}

interface Props {
  enquiry: Omit<PartExchange, "_id">;
  shopInfo: ShopInfo;
}

export const PartExchangeConfirmation: React.FC<Props> = ({
  enquiry,
  shopInfo,
}) => (
  <EmailTemplate
    preview={`Part-exchange enquiry ${enquiry.enquiryReference} received`}
    title="Part-Exchange Enquiry Received"
    subtitle={`Thanks for getting in touch with ${shopInfo.businessName}`}
    headerStyle="default"
    businessName={shopInfo.businessName}
    businessAddress={shopInfo.address}
  >
    <ReferenceBox
      label="Enquiry Reference"
      value={enquiry.enquiryReference}
      note="Quote this when you call us"
    />

    <Text style={{ margin: "0 0 16px", color: "#374151", lineHeight: 1.6 }}>
      We&apos;ve received the details of your{" "}
      <strong>
        {enquiry.vehicle.year} {enquiry.vehicle.make} {enquiry.vehicle.model}
      </strong>
      . A member of the team will come back to you within 24 hours with an
      indicative part-exchange valuation.
    </Text>

    {enquiry.interestedInCarLabel && (
      <Text style={{ margin: "0 0 20px", color: "#6b7280", fontSize: "14px" }}>
        Against: <strong>{enquiry.interestedInCarLabel}</strong>
      </Text>
    )}

    <SectionHeading>Vehicle details</SectionHeading>
    {enquiry.vehicle.registration && (
      <DetailRow label="Reg" value={enquiry.vehicle.registration} />
    )}
    <DetailRow label="Make" value={enquiry.vehicle.make} />
    <DetailRow label="Model" value={enquiry.vehicle.model} />
    <DetailRow label="Year" value={String(enquiry.vehicle.year)} />
    <DetailRow
      label="Mileage"
      value={`${enquiry.vehicle.mileage.toLocaleString()} miles`}
    />
    <DetailRow label="Condition" value={enquiry.vehicle.condition} />
    {enquiry.vehicle.serviceHistory && (
      <DetailRow label="Service history" value={enquiry.vehicle.serviceHistory} />
    )}
    {enquiry.vehicle.notes && (
      <DetailRow label="Notes" value={enquiry.vehicle.notes} />
    )}

    <SectionHeading>Need to reach us?</SectionHeading>
    <DetailRow label="Phone" value={shopInfo.phone} />
    <DetailRow label="Email" value={shopInfo.email} />
  </EmailTemplate>
);
