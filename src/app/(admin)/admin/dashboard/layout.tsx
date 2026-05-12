import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";

/**
 * (#10) Server-side auth guard for the entire admin dashboard subtree.
 *
 * Runs BEFORE any dashboard page renders, so unauthenticated requests
 * get a 302 to /admin/login and never see admin code or markup. This
 * replaces the previous client-side `AuthWrapper` check, which let the
 * dashboard JS bundle stream to anonymous browsers before redirecting.
 *
 * Why the layout and not each page: layouts in Next App Router run on
 * the server for every page in their subtree, so one check guards
 * /admin/dashboard, /admin/dashboard/cars, /admin/dashboard/edit/[id],
 * etc. without per-page duplication. The individual pages can keep
 * their existing `isAuthenticated` checks as a defence-in-depth layer.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect("/admin/login");
  }
  return <>{children}</>;
}
