"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  placeholder,
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <m.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 460, damping: 22 }}
        className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-left shadow-sm transition-colors duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
      >
        <div className="flex items-center justify-between">
          <span
            className={`block truncate ${
              !selectedOption ? "text-gray-500" : "text-gray-900"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <m.span
            animate={{ rotate: isOpen ? 180 : 0, color: isOpen ? "#ef4444" : "#9ca3af" }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
            className="inline-flex"
          >
            <ChevronDown className="h-4 w-4" />
          </m.span>
        </div>
      </m.button>

      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ type: "spring", stiffness: 480, damping: 32 }}
            style={{ originY: 0 }}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
          >
            {options.map((option, idx) => (
              <m.button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.018, duration: 0.15 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full px-4 py-2 text-left transition-colors duration-150 hover:bg-red-50 hover:text-red-700 ${
                  value === option.value
                    ? "bg-red-100 font-medium text-red-800"
                    : "text-gray-900"
                }`}
              >
                {option.label}
              </m.button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDropdown;
