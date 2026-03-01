"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  label: string;
  options: Option[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  multiSelect?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  icon,
  multiSelect = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleOptionClick(options[highlightedIndex].value);
          if (!multiSelect) {
            setIsOpen(false);
          }
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleOptionClick = (optionValue: string) => {
    if (multiSelect) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        // Remove the value if already selected
        const newValues = currentValues.filter((v) => v !== optionValue);
        onChange(newValues);
      } else {
        // Add the value if not selected
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  // const removeValue = (valueToRemove: string, e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   if (multiSelect && Array.isArray(value)) {
  //     const newValues = value.filter((v) => v !== valueToRemove);
  //     onChange(newValues);
  //   }
  // };

  // const isSelected = (optionValue: string): boolean => {
  //   if (multiSelect && Array.isArray(value)) {
  //     return value.includes(optionValue);
  //   }
  //   return value === optionValue;
  // };

  const getDisplayText = (): string => {
    if (multiSelect && Array.isArray(value) && value.length > 0) {
      if (value.length === 1) {
        const selectedOption = options.find(
          (option) => option.value === value[0]
        );
        return selectedOption ? selectedOption.label : value[0];
      }
      return `${value.length} items selected`;
    } else if (!multiSelect && typeof value === "string" && value) {
      const selectedOption = options.find((option) => option.value === value);
      return selectedOption ? selectedOption.label : value;
    }
    return placeholder;
  };

  const hasSelectedValues = multiSelect
    ? Array.isArray(value) && value.length > 0
    : Boolean(value);

  const displayText = getDisplayText();

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 ease-in-out hover:shadow-md focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none ${
          isOpen
            ? "border-red-500 shadow-md ring-2 ring-red-500"
            : "border-gray-300"
        } ${hasSelectedValues ? "text-gray-900" : "text-gray-500"} `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="text-gray-400">{icon}</div>}
            <span className="truncate">{displayText}</span>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg backdrop-blur-sm">
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-all duration-150 hover:bg-linear-to-r hover:from-red-50 hover:to-red-100 ${
                  highlightedIndex === index
                    ? "bg-linear-to-r from-red-50 to-red-100"
                    : ""
                } ${
                  value === option.value
                    ? "bg-linear-to-r from-red-100 to-red-200 font-medium text-red-900"
                    : "text-gray-900"
                } first:rounded-t-xl last:rounded-b-xl`}
              >
                <span className="truncate">{option.label}</span>
                {value === option.value && (
                  <Check className="ml-2 h-4 w-4 shrink-0 text-red-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
