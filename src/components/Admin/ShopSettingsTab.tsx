import React from "react";
import { ShopInfo } from "./types";

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
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-6">Shop Information</h2>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={shopInfo.businessName}
                onChange={(e) =>
                  onShopInfoChange({
                    ...shopInfo,
                    businessName: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={shopInfo.phone}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={shopInfo.email}
              onChange={(e) =>
                onShopInfoChange({ ...shopInfo, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={shopInfo.address}
              onChange={(e) =>
                onShopInfoChange({ ...shopInfo, address: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={shopInfo.city}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, city: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={shopInfo.state}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, state: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zip Code
              </label>
              <input
                type="text"
                value={shopInfo.zipCode}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, zipCode: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={shopInfo.description || ""}
              onChange={(e) =>
                onShopInfoChange({ ...shopInfo, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Business Hours</h3>
            <div className="space-y-2">
              {Object.keys(shopInfo.hours).map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 capitalize">
                    {day}
                  </label>
                  <input
                    type="text"
                    value={shopInfo.hours[day]}
                    onChange={(e) =>
                      onShopInfoChange({
                        ...shopInfo,
                        hours: { ...shopInfo.hours, [day]: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
