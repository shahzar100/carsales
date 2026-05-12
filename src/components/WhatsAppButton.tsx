import { getBusinessInfo } from "@/lib/utils/businessInfo";
import WhatsAppButtonClient from "./WhatsAppButtonClient";

/**
 * (#36) Floating WhatsApp button — read the business phone from the
 * single source of truth (businessInfo collection) and pass it to the
 * client component. Reads at build/render time so admins can change
 * the number in the dashboard without a redeploy.
 */
export default async function WhatsAppButton() {
  const info = await getBusinessInfo();
  const phone = info.phone;
  if (!phone) return null;
  return <WhatsAppButtonClient phone={phone} businessName={info.businessName} />;
}
