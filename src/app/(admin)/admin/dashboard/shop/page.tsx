import { redirect } from "next/navigation";
import ShopSettingsClient from "@/components/Admin/ShopSettingsClient";
import { isAuthenticated } from "@/lib/utils/auth";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

export default async function ShopSettingsPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }

  const initialShopInfo = await getBusinessInfo();
  return <ShopSettingsClient initialShopInfo={initialShopInfo} />;
}
