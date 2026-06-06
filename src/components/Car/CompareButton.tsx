"use client";

import React from "react";
import { CarInterface } from "@/lib/interfaces";
import { useComparison } from "@/contexts/ComparisonContext";
import { Scale, Check } from "lucide-react";

interface CompareButtonProps {
  car: CarInterface;
  size?: "sm" | "md";
  variant?: "icon" | "button";
  className?: string;
}

const CompareButton: React.FC<CompareButtonProps> = ({
  car,
  size = "sm",
  variant = "icon",
  className = "",
}) => {
  const { addToCompare, removeFromCompare, isInComparison, comparedCars } =
    useComparison();

  const carId = String(car._id ?? "");
  const inComparison = isInComparison(carId);
  const count = comparedCars.length;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inComparison) {
      removeFromCompare(carId);
    } else {
      addToCompare(car);
    }
  };

  const sizeClasses = {
    sm: variant === "icon" ? "h-8 w-8" : "h-8 px-2.5 text-xs gap-1.5",
    md: variant === "icon" ? "h-10 w-10" : "h-10 px-4 text-sm gap-2",
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        inComparison
          ? `Remove ${car.make} ${car.model} from comparison`
          : `Add ${car.make} ${car.model} to comparison`
      }
      className={`relative inline-flex cursor-pointer items-center justify-center rounded-xl font-medium transition-all duration-200 ${
        inComparison
          ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
      } ${sizeClasses[size]} ${className}`}
    >
      {inComparison ? (
        <Check className={iconSize} />
      ) : (
        <Scale className={iconSize} />
      )}
      {variant === "button" && (
        <span>{inComparison ? "In Comparison" : "Compare"}</span>
      )}
      {count > 0 && !inComparison && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
};

export default CompareButton;
