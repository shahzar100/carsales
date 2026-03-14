import React from "react";
import { ShopInfo } from "@/lib/types";
import Button from "@/components/Helpful/Buttons/Button";

interface ShopSettingsTabProps {
  shopInfo: ShopInfo;
  onShopInfoChange: (shopInfo: ShopInfo) => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function ShopSettingsTab({
  shopInfo,
  onShopInfoChange,
  onSave,
}: ShopSettingsTabProps) {
  return (
    <div className="max-w-3xl">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-bold text-red-600">Shop Information</h2>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                type="text"
                value={shopInfo.businessName ?? ""}
                onChange={(e) =>
                  onShopInfoChange({
                    ...shopInfo,
                    businessName: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={shopInfo.phone ?? ""}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, phone: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={shopInfo.email ?? ""}
              onChange={(e) =>
                onShopInfoChange({ ...shopInfo, email: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              value={shopInfo.address ?? ""}
              onChange={(e) =>
                onShopInfoChange({ ...shopInfo, address: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                value={shopInfo.city ?? ""}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, city: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                value={shopInfo.state ?? ""}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, state: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Zip Code
              </label>
              <input
                type="text"
                value={shopInfo.zipCode ?? ""}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, zipCode: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={shopInfo.description ?? ""}
              onChange={(e) =>
                onShopInfoChange({ ...shopInfo, description: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
            />
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold">Business Hours</h3>
            <div className="space-y-2">
              {Object.keys(shopInfo.hours).map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 capitalize">
                    {day}
                  </label>
                  <input
                    type="text"
                    value={shopInfo.hours[day] ?? ""}
                    onChange={(e) =>
                      onShopInfoChange({
                        ...shopInfo,
                        hours: { ...shopInfo.hours, [day]: e.target.value },
                      })
                    }
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold">Social Media</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={shopInfo.socialMedia?.facebook ?? ""}
                  onChange={(e) =>
                    onShopInfoChange({
                      ...shopInfo,
                      socialMedia: {
                        ...shopInfo.socialMedia,
                        facebook: e.target.value,
                      },
                    })
                  }
                  placeholder="https://facebook.com/yourbusiness"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Twitter URL
                </label>
                <input
                  type="url"
                  value={shopInfo.socialMedia?.twitter ?? ""}
                  onChange={(e) =>
                    onShopInfoChange({
                      ...shopInfo,
                      socialMedia: {
                        ...shopInfo.socialMedia,
                        twitter: e.target.value,
                      },
                    })
                  }
                  placeholder="https://twitter.com/yourbusiness"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                />
              </div>
              <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={shopInfo.socialMedia?.instagram ?? ""}
                  onChange={(e) =>
                    onShopInfoChange({
                      ...shopInfo,
                      socialMedia: {
                        ...shopInfo.socialMedia,
                        instagram: e.target.value,
                      },
                    })
                  }
                  placeholder="https://instagram.com/yourbusiness"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" customWidth="w-full">
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}
