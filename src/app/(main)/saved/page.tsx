import type { Metadata } from "next";
import SavedCarsPage from "@/components/Car/SavedCarsPage";

export const metadata: Metadata = {
  title: "Saved cars",
  description:
    "Cars you've saved while browsing. Sign in to keep them synced across all your devices.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <SavedCarsPage />;
}
