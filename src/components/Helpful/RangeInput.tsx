"use client";
import React from "react";

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

  return (
    <div>
      <label className="label-sm">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder={minPlaceholder}
          value={minValue ?? ""}
          onChange={(e) => handleChange(e.target.value, onMinChange)}
          className="input"
        />
        <span className="range-separator">—</span>
        <input
          type="number"
          placeholder={maxPlaceholder}
          value={maxValue ?? ""}
          onChange={(e) => handleChange(e.target.value, onMaxChange)}
          className="input"
        />
      </div>
    </div>
  );
};

export default RangeInput;
