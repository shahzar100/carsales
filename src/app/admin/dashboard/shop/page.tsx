"use client";
import React, { useState, useEffect } from "react";
import { ShopSettingsTab, ShopInfo } from "@/components/Admin";
import { useToast } from "@/hooks/useToast";

export default function ShopSettingsPage() {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  useEffect(() => {
    fetchShopInfo();
  }, []);

  const fetchShopInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/shop");
      const data = await response.json();
      if (data.success) setShopInfo(data.data);
    } catch (error) {
      console.error("Error fetching shop info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShopInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shopInfo) return;

    try {
      const response = await fetch("/api/admin/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopInfo),
      });

      if (response.ok) {
        toast.success(
          "Settings Updated",
          "Shop information has been updated successfully"
        );
      } else {
        toast.error("Update Failed", "Failed to update shop information");
      }
    } catch (error) {
      toast.error("Error", "An error occurred while updating shop information");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop settings...</p>
        </div>
      </div>
    );
  }

  if (!shopInfo) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No shop information found.</p>
      </div>
    );
  }

  return (
    <div>
      <ShopSettingsTab
        shopInfo={shopInfo}
        onShopInfoChange={setShopInfo}
        onSave={handleSaveShopInfo}
      />
    </div>
  );
}
