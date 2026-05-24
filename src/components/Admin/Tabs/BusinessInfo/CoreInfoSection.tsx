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
          <label className={labelClass}>Business Name</label>
          <input
            type="text"
            value={shopInfo.businessName ?? ""}
            onChange={(e) => update({ businessName: e.target.value })}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
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
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={shopInfo.email ?? ""}
            onChange={(e) => update({ email: e.target.value })}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Bookings Email</label>
          <input
            type="email"
            value={shopInfo.bookingsEmail ?? ""}
            onChange={(e) => update({ bookingsEmail: e.target.value })}
            className={inputClass}
            placeholder="bookings@yourbusiness.com"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Address</label>
        <input
          type="text"
          value={shopInfo.address ?? ""}
          onChange={(e) => update({ address: e.target.value })}
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className={labelClass}>City</label>
          <input
            type="text"
            value={shopInfo.city ?? ""}
            onChange={(e) => update({ city: e.target.value })}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>State/County</label>
          <input
            type="text"
            value={shopInfo.state ?? ""}
            onChange={(e) => update({ state: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Post Code</label>
          <input
            type="text"
            value={shopInfo.zipCode ?? ""}
            onChange={(e) => update({ zipCode: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Google Maps URL</label>
        <input
          type="url"
          value={shopInfo.googleMapsUrl ?? ""}
          onChange={(e) => update({ googleMapsUrl: e.target.value })}
          className={inputClass}
          placeholder="https://maps.google.com/maps?q=Your+Business"
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={shopInfo.description ?? ""}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          className={inputClass}
        />
      </div>
    </div>
  );
}
