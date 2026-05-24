"use client";
import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { RecoveryPricingTier } from "@/lib/interfaces";
import { inputClass, labelClass } from "./styles";

export interface RecoveryValue {
  coverageAreas: string[];
  pricingTiers: RecoveryPricingTier[];
  responseTime: string;
}

interface RecoverySectionProps {
  recovery: RecoveryValue;
  onChange: (r: RecoveryValue) => void;
}

// Editor for breakdown-recovery coverage, pricing tiers and response time.
export default function RecoverySection({
  recovery,
  onChange,
}: RecoverySectionProps) {
  const updateTier = (
    index: number,
    partial: Partial<RecoveryPricingTier>
  ) => {
    const tiers = [...recovery.pricingTiers];
    tiers[index] = { ...tiers[index], ...partial };
    onChange({ ...recovery, pricingTiers: tiers });
  };

  const addTier = () => {
    onChange({
      ...recovery,
      pricingTiers: [
        ...recovery.pricingTiers,
        { name: "", price: "", distance: "" },
      ],
    });
  };

  const removeTier = (index: number) => {
    onChange({
      ...recovery,
      pricingTiers: recovery.pricingTiers.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Response Time */}
      <div>
        <label className={labelClass}>Average Response Time</label>
        <input
          type="text"
          value={recovery.responseTime}
          onChange={(e) =>
            onChange({ ...recovery, responseTime: e.target.value })
          }
          className={inputClass}
          placeholder="30-45 minutes within Leeds"
        />
      </div>

      {/* Coverage Areas */}
      <div>
        <label className={labelClass}>Coverage Areas (one per line)</label>
        <textarea
          value={recovery.coverageAreas.join("\n")}
          onChange={(e) =>
            onChange({
              ...recovery,
              coverageAreas: e.target.value.split("\n").filter(Boolean),
            })
          }
          rows={6}
          className={inputClass}
          placeholder="Leeds City Centre&#10;North Leeds&#10;South Leeds"
        />
      </div>

      {/* Pricing Tiers */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-700">
          Pricing Tiers
        </h4>
        <div className="space-y-3">
          {recovery.pricingTiers.map((tier, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => updateTier(index, { name: e.target.value })}
                  className={inputClass}
                  placeholder="Local Recovery"
                />
                <input
                  type="text"
                  value={tier.price}
                  onChange={(e) => updateTier(index, { price: e.target.value })}
                  className={inputClass}
                  placeholder="From £60"
                />
                <input
                  type="text"
                  value={tier.distance}
                  onChange={(e) =>
                    updateTier(index, { distance: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Within 10 miles"
                />
              </div>
              <button
                type="button"
                onClick={() => removeTier(index)}
                className="mt-2 rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addTier}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
        >
          <Plus size={16} /> Add Pricing Tier
        </button>
      </div>
    </div>
  );
}
