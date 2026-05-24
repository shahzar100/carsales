"use client";
import React from "react";
import { MapPin, RotateCcw, ShieldCheck } from "lucide-react";
import ServiceCard, { SERVICES, type ServiceKey } from "./ServiceCard";
import ContinueBar from "./ContinueBar";
import TitleBlock from "./TitleBlock";

interface Step1ServiceProps {
  prefill: ServiceKey | null;
  onPrefillChange: () => void;
  selected: ServiceKey | null;
  onSelect: (k: ServiceKey) => void;
  onContinue: () => void;
  error: string | null;
}

// Step 1 — pick which service the customer wants. Pure controlled view:
// the orchestrator owns `selected`, this just renders the option cards
// and surfaces the continue bar once a choice has been made.
export default function Step1Service({
  prefill,
  onPrefillChange,
  selected,
  onSelect,
  onContinue,
  error,
}: Step1ServiceProps) {
  const selectedService = SERVICES.find((s) => s.key === selected) ?? null;

  const prefillName = prefill
    ? SERVICES.find((s) => s.key === prefill)?.name
    : undefined;

  return (
    <>
      <TitleBlock
        eyebrow="Book A Service"
        title={
          <>
            What can we{" "}
            <span className="text-red-600">do for you</span> today?
          </>
        }
        subtitle="Pick a service to get started. You can change your mind at the next step — and our team will confirm everything before you commit to a date."
        prefillLabel={prefillName}
        onPrefillChange={prefill ? onPrefillChange : undefined}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        {SERVICES.map((s) => (
          <ServiceCard
            key={s.key}
            service={s}
            selected={selected === s.key}
            onSelect={() => onSelect(s.key)}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
      )}

      {selectedService && (
        <ContinueBar
          label="Selected"
          value={`${selectedService.name} · from ${selectedService.fromPrice}`}
          icon={selectedService.icon}
          buttonLabel="Continue to package"
          onContinue={onContinue}
        />
      )}

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-gray-600">
          <ShieldCheck className="h-4 w-4 text-red-600" /> No deposit required
        </span>
        <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-gray-600">
          <RotateCcw className="h-4 w-4 text-red-600" /> Free reschedule up to
          24h
        </span>
        <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-gray-600">
          <MapPin className="h-4 w-4 text-red-600" /> Leeds workshop · LS11
        </span>
      </div>
    </>
  );
}
