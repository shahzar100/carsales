"use client";
import React from "react";
import { motion } from "motion/react";

interface RangeInputProps {
  label: string;
  minValue: number | null;
  maxValue: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
}

const RangeInput: React.FC<RangeInputProps> = ({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
}) => {
  const handleChange = (
    value: string,
    setter: (v: number | null) => void
  ) => {
    setter(value === "" ? null : parseInt(value, 10));
  };

  const hasValue = minValue != null || maxValue != null;

  return (
    <div>
      <label className="label-sm">{label}</label>
      <div className="flex items-center gap-2">
        {/* The wrapping <label> sits above both inputs (a range pair),
            so neither input is programmatically labelled by it.
            Provide explicit aria-labels so screen readers announce e.g.
            "Price (£) minimum" / "Price (£) maximum" rather than just
            the placeholder. PR #40 a11y long-tail. */}
        <motion.input
          type="number"
          placeholder={minPlaceholder}
          value={minValue ?? ""}
          onChange={(e) => handleChange(e.target.value, onMinChange)}
          aria-label={label ? `${label} minimum` : "Minimum"}
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 460, damping: 28 }}
          className="input"
        />
        <motion.span
          className="range-separator"
          aria-hidden="true"
          animate={{ color: hasValue ? "#dc2626" : "#9ca3af" }}
          transition={{ duration: 0.2 }}
        >
          —
        </motion.span>
        <motion.input
          type="number"
          placeholder={maxPlaceholder}
          value={maxValue ?? ""}
          onChange={(e) => handleChange(e.target.value, onMaxChange)}
          aria-label={label ? `${label} maximum` : "Maximum"}
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 460, damping: 28 }}
          className="input"
        />
      </div>
    </div>
  );
};

export default RangeInput;
