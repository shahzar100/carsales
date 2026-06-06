"use client";
import React, { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { DetailingPackage } from "@/lib/interfaces";
import { inputClass, labelClass } from "./styles";

interface DetailingPackagesSectionProps {
  packages: DetailingPackage[];
  onChange: (pkgs: DetailingPackage[]) => void;
}

// Editor for the array of detailing packages (name, price, features…).
export default function DetailingPackagesSection({
  packages,
  onChange,
}: DetailingPackagesSectionProps) {
  const fieldId = useId();

  const updatePkg = (index: number, partial: Partial<DetailingPackage>) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const addPackage = () => {
    onChange([
      ...packages,
      {
        id: `package-${Date.now()}`,
        name: "",
        subtitle: "",
        price: "",
        duration: "",
        description: "",
        exteriorFeatures: [],
        interiorFeatures: [],
        popular: false,
        includesPrevious: null,
      },
    ]);
  };

  const removePackage = (index: number) => {
    onChange(packages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {packages.map((pkg, index) => (
        <div
          key={pkg.id}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Package {index + 1}
            </h4>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={pkg.popular}
                  onChange={(e) =>
                    updatePkg(index, { popular: e.target.checked })
                  }
                  className="rounded"
                />
                Popular
              </label>
              <button
                type="button"
                onClick={() => removePackage(index)}
                aria-label="Remove package"
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
                  type="text"
                  id={`${fieldId}-${index}-name`}
                  value={pkg.name}
                  onChange={(e) => updatePkg(index, { name: e.target.value })}
                  className={inputClass}
                  placeholder="Detailing Bronze"
                  aria-label={`Package ${index + 1} Name`}
                />
              </div>
              <div>
                <label
                  className={labelClass}
                  htmlFor={`${fieldId}-${index}-subtitle`}
                >
                  Subtitle
                </label>
                <input
                  type="text"
                  id={`${fieldId}-${index}-subtitle`}
                  value={pkg.subtitle}
                  onChange={(e) =>
                    updatePkg(index, { subtitle: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Mini Valet"
                  aria-label={`Package ${index + 1} Subtitle`}
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
                  type="text"
                  id={`${fieldId}-${index}-price`}
                  value={pkg.price}
                  onChange={(e) => updatePkg(index, { price: e.target.value })}
                  className={inputClass}
                  placeholder="£150"
                  aria-label={`Package ${index + 1} Price`}
                />
              </div>
              <div>
                <label
                  className={labelClass}
                  htmlFor={`${fieldId}-${index}-duration`}
                >
                  Duration
                </label>
                <input
                  type="text"
                  id={`${fieldId}-${index}-duration`}
                  value={pkg.duration}
                  onChange={(e) =>
                    updatePkg(index, { duration: e.target.value })
                  }
                  className={inputClass}
                  placeholder="2-3 hours"
                  aria-label={`Package ${index + 1} Duration`}
                />
              </div>
              <div>
                <label
                  className={labelClass}
                  htmlFor={`${fieldId}-${index}-includes-previous`}
                >
                  Includes Previous
                </label>
                <input
                  type="text"
                  id={`${fieldId}-${index}-includes-previous`}
                  value={pkg.includesPrevious ?? ""}
                  onChange={(e) =>
                    updatePkg(index, {
                      includesPrevious: e.target.value || null,
                    })
                  }
                  className={inputClass}
                  placeholder="Bronze"
                  aria-label={`Package ${index + 1} Includes Previous`}
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
                type="text"
                id={`${fieldId}-${index}-description`}
                value={pkg.description}
                onChange={(e) =>
                  updatePkg(index, { description: e.target.value })
                }
                className={inputClass}
                aria-label={`Package ${index + 1} Description`}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label
                  className={labelClass}
                  htmlFor={`${fieldId}-${index}-exterior-features-one-per-line`}
                >
                  Exterior Features (one per line)
                </label>
                <textarea
                  id={`${fieldId}-${index}-exterior-features-one-per-line`}
                  value={pkg.exteriorFeatures.join("\n")}
                  onChange={(e) =>
                    updatePkg(index, {
                      exteriorFeatures: e.target.value
                        .split("\n")
                        .filter(Boolean),
                    })
                  }
                  rows={4}
                  className={inputClass}
                  aria-label={`Package ${index + 1} Exterior Features (one per line)`}
                />
              </div>
              <div>
                <label
                  className={labelClass}
                  htmlFor={`${fieldId}-${index}-interior-features-one-per-line`}
                >
                  Interior Features (one per line)
                </label>
                <textarea
                  id={`${fieldId}-${index}-interior-features-one-per-line`}
                  value={pkg.interiorFeatures.join("\n")}
                  onChange={(e) =>
                    updatePkg(index, {
                      interiorFeatures: e.target.value
                        .split("\n")
                        .filter(Boolean),
                    })
                  }
                  rows={4}
                  className={inputClass}
                  aria-label={`Package ${index + 1} Interior Features (one per line)`}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPackage}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
      >
        <Plus size={16} /> Add Detailing Package
      </button>
    </div>
  );
}
