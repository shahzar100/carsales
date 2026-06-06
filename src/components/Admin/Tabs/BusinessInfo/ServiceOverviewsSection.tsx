"use client";
import React, { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ServiceOverview } from "@/lib/interfaces";
import { inputClass, labelClass } from "./styles";

interface ServiceOverviewsSectionProps {
  overviews: ServiceOverview[];
  onChange: (ovs: ServiceOverview[]) => void;
}

// Editor for the array of service summary cards shown on the Services page.
export default function ServiceOverviewsSection({
  overviews,
  onChange,
}: ServiceOverviewsSectionProps) {
  const fieldId = useId();

  const updateOv = (index: number, partial: Partial<ServiceOverview>) => {
    const updated = [...overviews];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const addOverview = () => {
    onChange([
      ...overviews,
      {
        id: `service-${Date.now()}`,
        title: "",
        subtitle: "",
        priceRange: "",
        duration: "",
        features: [],
      },
    ]);
  };

  const removeOverview = (index: number) => {
    onChange(overviews.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {overviews.map((ov, index) => (
        <div
          key={ov.id}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Service {index + 1}
            </h4>
            <button
              type="button"
              onClick={() => removeOverview(index)}
              aria-label="Remove service"
              className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label
                  htmlFor={`${fieldId}-${index}-title`}
                  className={labelClass}
                >
                  Title
                </label>
                <input
                  id={`${fieldId}-${index}-title`}
                  type="text"
                  value={ov.title}
                  onChange={(e) => updateOv(index, { title: e.target.value })}
                  className={inputClass}
                  placeholder="Car Detailing"
                  aria-label="Title"
                />
              </div>
              <div>
                <label
                  htmlFor={`${fieldId}-${index}-subtitle`}
                  className={labelClass}
                >
                  Subtitle
                </label>
                <input
                  id={`${fieldId}-${index}-subtitle`}
                  type="text"
                  value={ov.subtitle}
                  onChange={(e) =>
                    updateOv(index, { subtitle: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Premium interior & exterior care"
                  aria-label="Subtitle"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label
                  htmlFor={`${fieldId}-${index}-price-range`}
                  className={labelClass}
                >
                  Price Range
                </label>
                <input
                  id={`${fieldId}-${index}-price-range`}
                  type="text"
                  value={ov.priceRange}
                  onChange={(e) =>
                    updateOv(index, { priceRange: e.target.value })
                  }
                  className={inputClass}
                  placeholder="£150 – £500"
                  aria-label="Price Range"
                />
              </div>
              <div>
                <label
                  htmlFor={`${fieldId}-${index}-duration`}
                  className={labelClass}
                >
                  Duration
                </label>
                <input
                  id={`${fieldId}-${index}-duration`}
                  type="text"
                  value={ov.duration}
                  onChange={(e) =>
                    updateOv(index, { duration: e.target.value })
                  }
                  className={inputClass}
                  placeholder="3-6 hours"
                  aria-label="Duration"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={`${fieldId}-${index}-features-one-per-line`}
                className={labelClass}
              >
                Features (one per line)
              </label>
              <textarea
                id={`${fieldId}-${index}-features-one-per-line`}
                value={ov.features.join("\n")}
                onChange={(e) =>
                  updateOv(index, {
                    features: e.target.value.split("\n").filter(Boolean),
                  })
                }
                rows={4}
                className={inputClass}
                aria-label="Features (one per line)"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addOverview}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
      >
        <Plus size={16} /> Add Service
      </button>
    </div>
  );
}
