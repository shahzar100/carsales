"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const nextIndex = prev + 1;
            return nextIndex >= options.length ? 0 : nextIndex;
          });
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const nextIndex = prev - 1;
            return nextIndex < 0 ? options.length - 1 : nextIndex;
          });
          break;
        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0 && !options[highlightedIndex].disabled) {
            // Inline handleSelect body so the effect doesn't depend on
            // a non-memoized function declared further down. (Day 4 / 4.1.)
            onChange?.(options[highlightedIndex].value);
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, highlightedIndex, options, onChange]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      highlightedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        const selectedIndex = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm shadow-sm transition-all duration-200 ${
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
            : error
              ? "border-red-300 bg-white text-gray-900 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-200"
              : isOpen
                ? "border-red-500 bg-white text-gray-900 ring-2 ring-red-100"
                : "border-gray-200 bg-white text-gray-900 hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
        } `}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-red-500" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute z-9999 mt-2 w-full origin-top"
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ type: "spring", stiffness: 480, damping: 32 }}
          >
            <ul
              ref={listRef}
              role="listbox"
              aria-activedescendant={
                highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined
              }
              className="max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
            >
              {options.length === 0 ? (
                <li className="px-4 py-3 text-center text-sm text-gray-500">
                  No options available
                </li>
              ) : (
                options.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <motion.li
                      key={option.value}
                      id={`option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() =>
                        !option.disabled && handleSelect(option.value)
                      }
                      onMouseEnter={() =>
                        !option.disabled && setHighlightedIndex(index)
                      }
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.018, duration: 0.15 }}
                      whileTap={!option.disabled ? { scale: 0.98 } : undefined}
                      className={`flex cursor-pointer items-center justify-between px-4 py-3 text-sm transition-colors duration-100 ${
                        option.disabled
                          ? "cursor-not-allowed text-gray-400"
                          : isHighlighted
                            ? "bg-red-50 text-red-700"
                            : isSelected
                              ? "bg-gray-50 text-gray-900"
                              : "text-gray-700 hover:bg-gray-50"
                      } `}
                    >
                      <span className={isSelected ? "font-medium" : ""}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 480, damping: 18 }}
                        >
                          <Check className="h-4 w-4 text-red-600" />
                        </motion.span>
                      )}
                    </motion.li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Dropdown;
