"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import Button from "@/components/Helpful/Buttons/Button";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Button doesn't forward arbitrary DOM props, so aria-busy + the polite
  // live region live on a wrapping span; the label text swaps so screen
  // readers announce the in-progress state.
  return (
    <span aria-busy={isPending} aria-live="polite">
      <Button
        onClick={() => startTransition(() => router.refresh())}
        disabled={isPending}
        variant="outline"
        size="sm"
        className="shadow-sm"
      >
        <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Refreshing…" : "Refresh"}
      </Button>
    </span>
  );
}
