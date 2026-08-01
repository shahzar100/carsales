"use client";

import { useState } from "react";
import BusinessInfoForm from "@/components/Admin/Tabs/BusinessInfoForm";
import { useToast } from "@/hooks/useToast";
import type { ShopInfo } from "@/lib/interfaces";

interface ShopSettingsClientProps {
  initialShopInfo: ShopInfo;
}

export default function ShopSettingsClient({
  initialShopInfo,
}: ShopSettingsClientProps) {
  const [shopInfo, setShopInfo] = useState(initialShopInfo);
  const toast = useToast();

  const refreshShopInfo = async (): Promise<void> => {
    const response = await fetch("/api/admin/shop", { cache: "no-store" });
    const data = (await response.json()) as {
      success?: boolean;
      data?: ShopInfo;
      error?: string;
    };

    if (!response.ok || !data.success || !data.data) {
      throw new Error(data.error || "Could not load business settings");
    }

    setShopInfo(data.data);
  };

  const handleSaveShopInfo = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    try {
      const response = await fetch("/api/admin/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopInfo),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        const title =
          response.status === 400
            ? "Validation Error"
            : response.status === 401 || response.status === 403
              ? "Unauthorized"
              : "Update Failed";
        toast.error(title, data.error || "Could not save business settings");
        return;
      }

      toast.success(
        "Settings Updated",
        "Business information has been updated successfully"
      );
      await refreshShopInfo();
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
    <div className="mx-auto max-w-6xl">
      <BusinessInfoForm
        shopInfo={shopInfo}
        onShopInfoChange={setShopInfo}
        onSave={handleSaveShopInfo}
      />
    </div>
  );
}
