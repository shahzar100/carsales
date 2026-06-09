// TODO (Day 12.6): convert to the server-component + client-island pattern.
// See viewing/page.tsx + components/Admin/ViewingBookingsClient.tsx for the
// canonical example. For the shop page: fetch businessInfo server-side
// and hand it to a ShopInfoClient as `initialShopInfo`. BusinessInfoForm
// already accepts an initial value prop.
"use client";
import React, { useState, useEffect, useCallback } from "react";
import BusinessInfoForm from "@/components/Admin/Tabs/BusinessInfoForm";
import type { ShopInfo } from "@/lib/interfaces";
import { useToast } from "@/hooks/useToast";

export default function ShopSettingsPage() {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const fetchShopInfo = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/shop");
      const data = await response.json();
      if (data.success) {
        setShopInfo(data.data);
      } else {
        toast.error(
          "Load Failed",
          data.error || "Could not load business settings from the server"
        );
      }
    } catch {
      toast.error(
        "Connection Error",
        "Could not connect to the server to load business settings"
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchShopInfo();
  }, [fetchShopInfo]);

  const handleSaveShopInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shopInfo) return;

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
        // Re-read from the server so the form reflects what was actually
        // persisted (server-side normalisation/seeding can differ from the
        // submitted body) instead of showing the now-stale local state.
        await fetchShopInfo();
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-red-600"></div>
          <p className="text-gray-600">Loading business settings...</p>
        </div>
      </div>
    );
  }

  if (!shopInfo) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600">No business information found.</p>
      </div>
    );
  }

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
