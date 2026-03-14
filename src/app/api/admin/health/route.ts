import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/utils/auth";
import { getHealthData } from "@/components/Admin/Dashboard/Status/getHealthData";

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getHealthData();
  return NextResponse.json(data);
}
