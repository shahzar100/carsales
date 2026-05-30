"use client";
import React, { useState } from "react";
import BusinessInfoForm from "@/components/Admin/Tabs/BusinessInfoForm";
import type { ShopInfo } from "@/lib/interfaces";
import { useToast } from "@/hooks/useToast";

interface Props {
  initialShopInfo: ShopInfo;
}

/**
 * Client island for the shop / business-settings admin page.
 *
 * Initial data is provided by the parent server component so the first paint
 * already shows the form — no spinner, no extra round-trip to /api/admin/shop.
 * The form owns the edited state; saving PUTs it back and surfaces the result
 * as a toast (no refetch needed — the saved state is what the user sees).
 *
 * Day 12.6 / Finding #29 — the last read-mostly admin page to adopt the
 * server-component + client-island pattern (see ViewingBookingsClient).
 */
export default function ShopSettingsClient({ initialShopInfo }: Props) {
  const [shopInfo, setShopInfo] = useState<ShopInfo>(initialShopInfo);

  const toast = useToast();

  const handleSaveShopInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/admin/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopInfo),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(
          "Settings Updated",
          "Business information has been updated successfully"
        );
      } else {
        const title =
          response.status === 400
            ? "Validation Error"
            : response.status === 401
              ? "Unauthorized"
              : "Update Failed";
        toast.error(
          title,
          data.error || "An unknown error occurred while saving"
        );
      }
    } catch (error) {
      toast.error(
        "Network Error",
        error instanceof Error
          ? `Could not reach the server: ${error.message}`
          : "Could not reach the server — check your connection and try again"
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <BusinessInfoForm
        shopInfo={shopInfo}
        onShopInfoChange={setShopInfo}
        onSave={handleSaveShopInfo}
      />
    </div>
  );
}
