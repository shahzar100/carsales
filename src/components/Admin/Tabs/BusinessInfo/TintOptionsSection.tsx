"use client";
import React, { useRef, useId } from "react";
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
  // TintOption has no persisted id, so we track a stable client-side id per
  // row. Keying by array index makes React reuse the wrong <input> nodes when
  // a middle row is deleted; these ids stay glued to their row instead. They
  // move in lockstep with `options` via the add/remove handlers below, and
  // resync if the parent ever swaps the whole array (e.g. form reset).
  const rowIds = useRef<number[]>(options.map((_, i) => i));
  const nextId = useRef(options.length);
  const fieldId = useId();
  if (rowIds.current.length !== options.length) {
    rowIds.current = options.map((_, i) => i);
    nextId.current = options.length;
  }

  const updateOpt = (index: number, partial: Partial<TintOption>) => {
    const updated = [...options];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const addOption = () => {
    rowIds.current = [...rowIds.current, nextId.current++];
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
    rowIds.current = rowIds.current.filter((_, i) => i !== index);
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {options.map((opt, index) => (
        <div
          key={rowIds.current[index]}
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
                aria-label="Remove tint option"
                className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label
                  className={labelClass}
                  htmlFor={`${fieldId}-${index}-name`}
                >
                  Name
                </label>
                <input
                  id={`${fieldId}-${index}-name`}
                  type="text"
                  value={opt.name}
                  onChange={(e) => updateOpt(index, { name: e.target.value })}
                  className={inputClass}
                  placeholder="Ceramic Premium"
                  aria-label={`Tint Option ${index + 1} Name`}
                />
              </div>
              <div>
                <label
                  className={labelClass}
                  htmlFor={`${fieldId}-${index}-type`}
                >
                  Type
                </label>
                <input
                  id={`${fieldId}-${index}-type`}
                  type="text"
                  value={opt.type}
                  onChange={(e) => updateOpt(index, { type: e.target.value })}
                  className={inputClass}
                  placeholder="Ceramic"
                  aria-label={`Tint Option ${index + 1} Type`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label
                  className={labelClass}
                  htmlFor={`${fieldId}-${index}-price`}
                >
                  Price
                </label>
                <input
                  id={`${fieldId}-${index}-price`}
                  type="text"
                  value={opt.price}
                  onChange={(e) => updateOpt(index, { price: e.target.value })}
                  className={inputClass}
                  placeholder="£400-£800"
                  aria-label={`Tint Option ${index + 1} Price`}
                />
              </div>
              <div>
                <label
                  className={labelClass}
                  htmlFor={`${fieldId}-${index}-vlt-options`}
                >
                  VLT Options
                </label>
                <input
                  id={`${fieldId}-${index}-vlt-options`}
                  type="text"
                  value={opt.vlt}
                  onChange={(e) => updateOpt(index, { vlt: e.target.value })}
                  className={inputClass}
                  placeholder="5%, 20%, 35%, 50%"
                  aria-label={`Tint Option ${index + 1} VLT Options`}
                />
              </div>
              <div>
                <label
                  className={labelClass}
                  htmlFor={`${fieldId}-${index}-warranty`}
                >
                  Warranty
                </label>
                <input
                  id={`${fieldId}-${index}-warranty`}
                  type="text"
                  value={opt.warranty}
                  onChange={(e) =>
                    updateOpt(index, { warranty: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Lifetime"
                  aria-label={`Tint Option ${index + 1} Warranty`}
                />
              </div>
            </div>

            <div>
              <label
                className={labelClass}
                htmlFor={`${fieldId}-${index}-description`}
              >
                Description
              </label>
              <input
                id={`${fieldId}-${index}-description`}
                type="text"
                value={opt.description}
                onChange={(e) =>
                  updateOpt(index, { description: e.target.value })
                }
                className={inputClass}
                aria-label={`Tint Option ${index + 1} Description`}
              />
            </div>

            <div>
              <label
                className={labelClass}
                htmlFor={`${fieldId}-${index}-features-one-per-line`}
              >
                Features (one per line)
              </label>
              <textarea
                id={`${fieldId}-${index}-features-one-per-line`}
                value={opt.features.join("\n")}
                onChange={(e) =>
                  updateOpt(index, {
                    features: e.target.value.split("\n").filter(Boolean),
                  })
                }
                rows={4}
                className={inputClass}
                aria-label={`Tint Option ${index + 1} Features (one per line)`}
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
