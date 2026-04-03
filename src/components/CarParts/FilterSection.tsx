"use client";
import React from "react";
import CustomDropdown from "./CustomDropdown";

interface FilterSectionProps {
  brands?: string[];
  categories?: string[];
  conditionFilters?: string[];
  selectedBrand: string;
  selectedCategory: string;
  selectedCondition: string;
  onBrandChange: (brand: string) => void;
  onCategoryChange: (category: string) => void;
  onConditionChange: (condition: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  brands = [],
  categories = [],
  conditionFilters = [],
  selectedBrand,
  selectedCategory,
  selectedCondition,
  onBrandChange,
  onCategoryChange,
  onConditionChange,
}) => {
  const brandOptions = [
    { value: "", label: "All Brands" },
    ...brands.map((b) => ({ value: b, label: b })),
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  const conditionOptions = [
    { value: "", label: "All Conditions" },
    ...conditionFilters.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="mb-8 rounded-lg bg-gray-50 p-6">
      <div className="flex flex-wrap items-center justify-center gap-4">
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
