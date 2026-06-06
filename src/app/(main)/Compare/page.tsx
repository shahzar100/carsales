import type { Metadata } from "next";
import CompareContent from "@/components/Car/CompareContent";
import { Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Compare Cars",
  description:
    "Compare up to 3 vehicles side by side. See specifications, features, and prices at a glance to find your perfect car.",
  alternates: { canonical: "/Compare" },
  openGraph: {
    title: "Compare Cars",
    description:
      "Compare up to 3 vehicles side by side. See specifications, features, and prices at a glance.",
    url: "/Compare",
  },
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <Scale className="h-5 w-5 text-red-600" />
          </div>
          <h1 className="page-title">Compare Cars</h1>
        </div>
        <p className="description max-w-2xl">
          Compare vehicles side by side to see how they stack up. Differences are
          highlighted to help you spot key distinctions quickly.
        </p>
      </div>
      <CompareContent />
    </div>
  );
}
