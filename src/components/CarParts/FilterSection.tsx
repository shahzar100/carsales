"use client";
import React from "react";
import CustomDropdown from "./CustomDropdown";

interface FilterSectionProps {
  selectedBrand: string;
  selectedCategory: string;
  selectedCondition: string;
  onBrandChange: (brand: string) => void;
  onCategoryChange: (category: string) => void;
  onConditionChange: (condition: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  selectedBrand,
  selectedCategory,
  selectedCondition,
  onBrandChange,
  onCategoryChange,
  onConditionChange,
}) => {
  const brandOptions = [
    { value: "", label: "All Brands" },
    { value: "BMW", label: "BMW" },
    { value: "Honda", label: "Honda" },
    { value: "Toyota", label: "Toyota" },
    { value: "Audi", label: "Audi" },
    { value: "Ford", label: "Ford" },
    { value: "Mercedes", label: "Mercedes" },
    { value: "Nissan", label: "Nissan" },
    { value: "Volkswagen", label: "Volkswagen" },
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    { value: "Brakes", label: "Brakes" },
    { value: "Engine", label: "Engine" },
    { value: "Body", label: "Body" },
    { value: "Lighting", label: "Lighting" },
    { value: "Exhaust", label: "Exhaust" },
    { value: "Cooling", label: "Cooling" },
    { value: "Wheels", label: "Wheels" },
  ];

  const conditionOptions = [
    { value: "", label: "All Conditions" },
    { value: "New", label: "New" },
    { value: "Used - Excellent", label: "Used - Excellent" },
    { value: "Used - Good", label: "Used - Good" },
    { value: "Refurbished", label: "Refurbished" },
  ];

  return (
    <div className="mb-8 bg-gray-50 p-6 rounded-lg">
      <div className="flex flex-wrap gap-4 items-center justify-center">
        <CustomDropdown
          options={brandOptions}
          placeholder="All Brands"
          value={selectedBrand}
          onChange={onBrandChange}
          className="w-full sm:w-48"
        />
        <CustomDropdown
          options={categoryOptions}
          placeholder="All Categories"
          value={selectedCategory}
          onChange={onCategoryChange}
          className="w-full sm:w-48"
        />
        <CustomDropdown
          options={conditionOptions}
          placeholder="All Conditions"
          value={selectedCondition}
          onChange={onConditionChange}
          className="w-full sm:w-48"
        />
      </div>
    </div>
  );
};

export default FilterSection;
