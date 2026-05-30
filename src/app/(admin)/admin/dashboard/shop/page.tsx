import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import ShopSettingsClient from "@/components/Admin/ShopSettingsClient";

/**
 * Shop / business-settings admin page — Server Component.
 *
 * (Day 12.6 / Finding #29) Read-mostly admin pages fetch their initial data
 * server-side and hand it to a small client island for interactivity. The
 * previous all-client implementation rendered a spinner, round-tripped
 * /api/admin/shop, then rendered. Now the first paint already has the data.
 *
 * `getBusinessInfo()` already runs every document through `serializeDocument`,
 * so the result is safe to pass across the server/client boundary as-is.
 */
export default async function ShopSettingsPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");

  const initialShopInfo = await getBusinessInfo();

  return <ShopSettingsClient initialShopInfo={initialShopInfo} />;
}
