"use client";
import React from "react";
import { Phone } from "lucide-react";
import PackageCard, { type PackageCardData } from "./PackageCard";
import ContinueBar from "./ContinueBar";
import TitleBlock from "./TitleBlock";
import type { ServiceKey } from "./ServiceCard";

interface Step2PackageProps {
  service: ServiceKey;
  serviceName: string;
  packages: PackageCardData[];
  selectedId: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
  error: string | null;
}

// Step 2 — pick a package within the chosen service. The package list is
// supplied by the orchestrator (already mapped from the right data source
// per service type) so this view is purely about presentation.
export default function Step2Package({
  service,
  serviceName,
  packages,
  selectedId,
  onSelect,
  onContinue,
  error,
}: Step2PackageProps) {
  const selected = packages.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <TitleBlock
        eyebrow={`Step 2 · ${serviceName}`}
        title={
          <>
            Pick the <span className="text-red-600">level of detail</span>
          </>
        }
        subtitle={
          service === "detailing"
            ? "All packages carried out by hand at our LS11 workshop. Prices include parking, full valet, and a complimentary courtesy car wash on collection."
            : service === "tints"
              ? "Pick the film grade that suits you. All installs are dust-free, with bubble-free curing in our temperature-controlled bay."
              : "Pick the area we need to look at. We'll confirm a quote once our technician has had eyes on your vehicle."
        }
      />

      <div className="mt-1 mb-3 flex items-center gap-3">
        <h2 className="m-0 text-[15px] font-bold tracking-tight text-gray-900">
          Packages
        </h2>
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-[11px] font-semibold tracking-[0.08em] text-gray-400 uppercase">
          {packages.length} options
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {packages.map((p) => (
          <PackageCard
            key={p.id}
            pkg={p}
            selected={selectedId === p.id}
            onSelect={() => onSelect(p.id)}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
      )}

      {selected && (
        <ContinueBar
          label={`${selected.duration} · ${serviceName}`}
          value={`${selected.name} · ${selected.price}`}
          icon={selected.icon}
          buttonLabel="Continue to vehicle"
          onContinue={onContinue}
        />
      )}

      <div className="bk-help-row">
        <span className="ic">
          <Phone className="h-4 w-4" />
        </span>
        <span>
          <strong>Not sure which one?</strong> Our team is on the floor 8am–6pm.
          Call or message us for a recommendation.
        </span>
      </div>
    </>
  );
}
