"use client";
import React from "react";
import { AnimatePresence, motion } from "motion/react";
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
          <AnimatePresence>
            {selectedFeatures.length > 0 && (
              <motion.span
                key={selectedFeatures.length}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 480, damping: 22 }}
                className="badge-sm badge-brand ml-1.5 inline-flex"
              >
                {selectedFeatures.length}
              </motion.span>
            )}
          </AnimatePresence>
        </label>
        <AnimatePresence>
          {selectedFeatures.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={onClearAll}
                variant="ghost"
                disabled={false}
                customWidth="text-xs text-gray-400 hover:text-red-500"
              >
                Clear all
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {allFeatures.length === 0 ? (
        <p className="body text-gray-400">No features available</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allFeatures.map((feature) => {
            const isSelected = selectedFeatures.includes(feature);
            return (
              <motion.button
                key={feature}
                onClick={() => onToggle(feature)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 480, damping: 22 }}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                  isSelected
                    ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.span
                      key="check"
                      initial={{ opacity: 0, width: 0, marginRight: 0 }}
                      animate={{ opacity: 1, width: "auto", marginRight: 4 }}
                      exit={{ opacity: 0, width: 0, marginRight: 0 }}
                      transition={{ duration: 0.18 }}
                      className="inline-block overflow-hidden"
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
                {feature}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CarFeatures;
