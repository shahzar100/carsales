"use client";
import React from "react";
import type { ShopInfo } from "@/lib/interfaces";
import { inputClass } from "./styles";

interface HeroStatsSectionProps {
  shopInfo: ShopInfo;
  update: (partial: Partial<ShopInfo>) => void;
}

// Homepage hero statistics (vehicles, booking, rating) editor.
export default function HeroStatsSection({
  shopInfo,
  update,
}: HeroStatsSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        These stats appear on the homepage hero section.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Vehicles
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={shopInfo.heroStats?.vehicles?.value ?? ""}
              onChange={(e) =>
                update({
                  heroStats: {
                    ...shopInfo.heroStats!,
                    vehicles: {
                      ...shopInfo.heroStats!.vehicles,
                      value: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
              placeholder="500+"
              aria-label="Vehicles stat value"
            />
            <input
              type="text"
              value={shopInfo.heroStats?.vehicles?.label ?? ""}
              onChange={(e) =>
                update({
                  heroStats: {
                    ...shopInfo.heroStats!,
                    vehicles: {
                      ...shopInfo.heroStats!.vehicles,
                      label: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
              placeholder="Quality Vehicles"
              aria-label="Vehicles stat label"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Booking
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={shopInfo.heroStats?.booking?.value ?? ""}
              onChange={(e) =>
                update({
                  heroStats: {
                    ...shopInfo.heroStats!,
                    booking: {
                      ...shopInfo.heroStats!.booking,
                      value: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
              placeholder="24/7"
              aria-label="Booking stat value"
            />
            <input
              type="text"
              value={shopInfo.heroStats?.booking?.label ?? ""}
              onChange={(e) =>
                update({
                  heroStats: {
                    ...shopInfo.heroStats!,
                    booking: {
                      ...shopInfo.heroStats!.booking,
                      label: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
              placeholder="Online Booking"
              aria-label="Booking stat label"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Rating
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={shopInfo.heroStats?.rating?.value ?? ""}
              onChange={(e) =>
                update({
                  heroStats: {
                    ...shopInfo.heroStats!,
                    rating: {
                      ...shopInfo.heroStats!.rating,
                      value: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
              placeholder="4.9"
              aria-label="Rating stat value"
            />
            <input
              type="text"
              value={shopInfo.heroStats?.rating?.label ?? ""}
              onChange={(e) =>
                update({
                  heroStats: {
                    ...shopInfo.heroStats!,
                    rating: {
                      ...shopInfo.heroStats!.rating,
                      label: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
              placeholder="Customer Rating"
              aria-label="Rating stat label"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
