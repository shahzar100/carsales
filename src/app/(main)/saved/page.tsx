import type { Metadata } from "next";
import SavedCarsPage from "@/components/Car/SavedCarsPage";

export const metadata: Metadata = {
  title: "Saved cars",
  description:
    "Cars you've saved while browsing. Stored on this device only — no account required.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <SavedCarsPage />;
}
