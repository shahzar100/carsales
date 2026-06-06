"use client";
import React from "react";
import { ChevronDown } from "lucide-react";

interface NavButtonProps {
  text: string;
  dropdown?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({
  onClick,
  text,
  dropdown = false,
  disabled = false,
  children,
}) => {
  const baseClasses = dropdown
    ? "text-gray-700 hover:underline underline-offset-4 decoration-red-500 text-lg lg:text-base font-semibold transition-all duration-200 hover:text-red-500 px-6 py-4 rounded-lg group-hover:bg-red-50 border-b border-gray-100 block w-full text-left"
    : "hover:underline underline-offset-4 decoration-red-500 text-base font-medium transition-all duration-200 hover:text-red-500 py-2 px-6 rounded-md hover:bg-red-50 block w-full text-left text-gray-700 hover:text-red-500";

  const disabledClasses =
    "opacity-50 cursor-not-allowed !text-gray-400 !hover:underline-none !hover:bg-transparent !hover:text-gray-400";

  return (
    <div
      className={`group relative text-black ${disabled ? "pointer-events-none" : ""}`}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center ${baseClasses} ${disabled ? disabledClasses : ""}`}
      >
        {text}
        {dropdown && (
          <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
        )}
      </button>

      {dropdown && !disabled && (
        <div className="absolute top-full right-0 z-9999 mt-2 hidden w-64 group-hover:block">
          <div className="flex w-full flex-col items-start rounded-lg border border-gray-200 bg-white p-2 shadow-xl ring-1 ring-black/5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavButton;
