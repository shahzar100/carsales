"use client";
import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { TintOption } from "@/lib/interfaces";
import { inputClass, labelClass } from "./styles";

interface TintOptionsSectionProps {
  options: TintOption[];
  onChange: (opts: TintOption[]) => void;
}

// Editor for the array of window tinting options.
export default function TintOptionsSection({
  options,
  onChange,
}: TintOptionsSectionProps) {
  const updateOpt = (index: number, partial: Partial<TintOption>) => {
    const updated = [...options];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const addOption = () => {
    onChange([
      ...options,
      {
        name: "",
        type: "",
        price: "",
        vlt: "",
        warranty: "",
        description: "",
        features: [],
        popular: false,
      },
    ]);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {options.map((opt, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Tint Option {index + 1}
            </h4>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={opt.popular}
                  onChange={(e) =>
                    updateOpt(index, { popular: e.target.checked })
                  }
                  className="rounded"
                />
                Popular
              </label>
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={opt.name}
                  onChange={(e) => updateOpt(index, { name: e.target.value })}
                  className={inputClass}
                  placeholder="Ceramic Premium"
                />
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <input
                  type="text"
                  value={opt.type}
                  onChange={(e) => updateOpt(index, { type: e.target.value })}
                  className={inputClass}
                  placeholder="Ceramic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className={labelClass}>Price</label>
                <input
                  type="text"
                  value={opt.price}
                  onChange={(e) => updateOpt(index, { price: e.target.value })}
                  className={inputClass}
                  placeholder="£400-£800"
                />
              </div>
              <div>
                <label className={labelClass}>VLT Options</label>
                <input
                  type="text"
                  value={opt.vlt}
                  onChange={(e) => updateOpt(index, { vlt: e.target.value })}
                  className={inputClass}
                  placeholder="5%, 20%, 35%, 50%"
                />
              </div>
              <div>
                <label className={labelClass}>Warranty</label>
                <input
                  type="text"
                  value={opt.warranty}
                  onChange={(e) =>
                    updateOpt(index, { warranty: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Lifetime"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <input
                type="text"
                value={opt.description}
                onChange={(e) =>
                  updateOpt(index, { description: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Features (one per line)</label>
              <textarea
                value={opt.features.join("\n")}
                onChange={(e) =>
                  updateOpt(index, {
                    features: e.target.value.split("\n").filter(Boolean),
                  })
                }
                rows={4}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addOption}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
      >
        <Plus size={16} /> Add Tint Option
      </button>
    </div>
  );
}
