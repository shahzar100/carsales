import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import { getHealthData } from "@/components/Admin/Dashboard/Status/getHealthData";
import StatusDashboard from "@/components/Admin/Dashboard/Status/StatusDashboard";

export default async function StatusPage() {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const initialHealth = await getHealthData();

  return (
    <div className="space-y-8">
      <StatusDashboard initialHealth={initialHealth} />
    </div>
  );
}
