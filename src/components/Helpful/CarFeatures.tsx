"use client";
import React from "react";
import Button from "@/components/Helpful/Buttons/Button";

interface CarFeaturesProps {
  allFeatures: string[];
  selectedFeatures: string[];
  onToggle: (feature: string) => void;
  onClearAll: () => void;
}

const CarFeatures: React.FC<CarFeaturesProps> = ({
  allFeatures,
  selectedFeatures,
  onToggle,
  onClearAll,
}) => {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="label-sm mb-0">
          Features
          {selectedFeatures.length > 0 && (
            <span className="badge-sm badge-brand ml-1.5">
              {selectedFeatures.length}
            </span>
          )}
        </label>
        {selectedFeatures.length > 0 && (
          <Button
            onClick={onClearAll}
            variant="ghost"
            disabled={false}
            customWidth="text-xs text-gray-400 hover:text-red-500"
          >
            Clear all
          </Button>
        )}
      </div>
      {allFeatures.length === 0 ? (
        <p className="body text-gray-400">No features available</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allFeatures.map((feature) => {
            const isSelected = selectedFeatures.includes(feature);
            return (
              <button
                key={feature}
                onClick={() => onToggle(feature)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  isSelected
                    ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {isSelected && "✓ "}
                {feature}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CarFeatures;
