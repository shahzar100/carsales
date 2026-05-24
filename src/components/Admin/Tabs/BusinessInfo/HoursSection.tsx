"use client";
import React from "react";
import type { ShopInfo } from "@/lib/interfaces";
import { inputClass } from "./styles";

interface HoursSectionProps {
  shopInfo: ShopInfo;
  update: (partial: Partial<ShopInfo>) => void;
}

// Weekly opening-hours editor.
export default function HoursSection({ shopInfo, update }: HoursSectionProps) {
  return (
    <div className="space-y-2">
      {shopInfo.hours &&
        Object.keys(shopInfo.hours).map((day) => (
          <div key={day} className="flex items-center gap-4">
            <label className="w-32 text-sm font-medium text-gray-700 capitalize">
              {day}
            </label>
            <input
              type="text"
              value={shopInfo.hours[day as keyof typeof shopInfo.hours] ?? ""}
              onChange={(e) =>
                update({
                  hours: { ...shopInfo.hours, [day]: e.target.value },
                })
              }
              className={inputClass}
              placeholder="e.g. 9:00 AM - 6:00 PM"
            />
          </div>
        ))}
    </div>
  );
}
