import type { Metadata } from "next";
import SavedCarsPage from "@/components/Car/SavedCarsPage";

// Per-user / per-request; must not cache. (Audit #1.)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved cars",
  description:
    "Cars you've saved while browsing. Sign in to keep them synced across all your devices.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <SavedCarsPage />;
}
