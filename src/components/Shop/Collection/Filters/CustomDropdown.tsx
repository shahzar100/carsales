"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

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

  const removeValue = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiSelect && Array.isArray(value)) {
      const newValues = value.filter((v) => v !== valueToRemove);
      onChange(newValues);
    }
  };

  const isSelected = (optionValue: string): boolean => {
    if (multiSelect && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

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
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full px-3 py-2 text-left bg-white border rounded-lg shadow-sm 
          transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 
          focus:ring-blue-500 focus:border-blue-500 hover:shadow-md text-sm
          ${
            isOpen
              ? "ring-1 ring-blue-500 border-blue-500 shadow-md"
              : "border-gray-300"
          }
          ${hasSelectedValues ? "text-gray-900" : "text-gray-500"}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {icon && <div className="text-gray-400 flex-shrink-0">{icon}</div>}
            <div className="flex-1 min-w-0">
              {multiSelect && Array.isArray(value) && value.length > 1 ? (
                <span className="truncate text-sm">{displayText}</span>
              ) : multiSelect && Array.isArray(value) && value.length === 1 ? (
                <div className="flex items-center gap-1">
                  <span className="truncate text-sm">{displayText}</span>
                  <div
                    onClick={(e) => removeValue(value[0], e)}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-0.5 rounded hover:bg-red-50"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        removeValue(value[0], e as any);
                      }
                    }}
                  >
                    <X size={12} />
                  </div>
                </div>
              ) : (
                <span className="truncate text-sm">{displayText}</span>
              )}
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  w-full px-3 py-2 text-left text-sm transition-all duration-150
                  flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100
                  ${
                    highlightedIndex === index
                      ? "bg-gradient-to-r from-blue-50 to-blue-100"
                      : ""
                  }
                  ${
                    isSelected(option.value)
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 font-medium"
                      : "text-gray-900"
                  }
                  first:rounded-t-lg last:rounded-b-lg
                `}
              >
                <span className="truncate">{option.label}</span>
                {isSelected(option.value) && (
                  <Check className="h-3 w-3 text-blue-600 flex-shrink-0 ml-2" />
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
