"use client";
import React from "react";
import type { ShopInfo } from "@/lib/interfaces";
import { inputClass, labelClass } from "./styles";

interface CoreInfoSectionProps {
  shopInfo: ShopInfo;
  update: (partial: Partial<ShopInfo>) => void;
}

// Top-level business identity & contact fields.
export default function CoreInfoSection({
  shopInfo,
  update,
}: CoreInfoSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="core-info-business-name" className={labelClass}>
            Business Name
          </label>
          <input
            id="core-info-business-name"
            type="text"
            value={shopInfo.businessName ?? ""}
            onChange={(e) => update({ businessName: e.target.value })}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="core-info-phone" className={labelClass}>
            Phone
          </label>
          <input
            id="core-info-phone"
            type="tel"
            value={shopInfo.phone ?? ""}
            onChange={(e) => update({ phone: e.target.value })}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="core-info-whatsapp" className={labelClass}>
            WhatsApp Number
          </label>
          <input
            id="core-info-whatsapp"
            type="tel"
            value={shopInfo.whatsapp ?? ""}
            onChange={(e) => update({ whatsapp: e.target.value })}
            className={inputClass}
            placeholder="0796 628 1510 (falls back to Phone if empty)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="core-info-email" className={labelClass}>
            Email
          </label>
          <input
            id="core-info-email"
            type="email"
            value={shopInfo.email ?? ""}
            onChange={(e) => update({ email: e.target.value })}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="core-info-bookings-email" className={labelClass}>
            Bookings Email
          </label>
          <input
            id="core-info-bookings-email"
            type="email"
            value={shopInfo.bookingsEmail ?? ""}
            onChange={(e) => update({ bookingsEmail: e.target.value })}
            className={inputClass}
            placeholder="bookings@yourbusiness.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="core-info-address" className={labelClass}>
          Address
        </label>
        <input
          id="core-info-address"
          type="text"
          value={shopInfo.address ?? ""}
          onChange={(e) => update({ address: e.target.value })}
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="core-info-city" className={labelClass}>
            City
          </label>
          <input
            id="core-info-city"
            type="text"
            value={shopInfo.city ?? ""}
            onChange={(e) => update({ city: e.target.value })}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="core-info-state" className={labelClass}>
            State/County
          </label>
          <input
            id="core-info-state"
            type="text"
            value={shopInfo.state ?? ""}
            onChange={(e) => update({ state: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="core-info-zip-code" className={labelClass}>
            Post Code
          </label>
          <input
            id="core-info-zip-code"
            type="text"
            value={shopInfo.zipCode ?? ""}
            onChange={(e) => update({ zipCode: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="core-info-google-maps-url" className={labelClass}>
          Google Maps URL
        </label>
        <input
          id="core-info-google-maps-url"
          type="url"
          value={shopInfo.googleMapsUrl ?? ""}
          onChange={(e) => update({ googleMapsUrl: e.target.value })}
          className={inputClass}
          placeholder="https://maps.google.com/maps?q=Your+Business"
        />
      </div>

      <div>
        <label htmlFor="core-info-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="core-info-description"
          value={shopInfo.description ?? ""}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          className={inputClass}
        />
      </div>
    </div>
  );
}
