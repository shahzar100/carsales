"use client";
import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import FilterSection from "./FilterSection";
import Button from "@/components/Helpful/Buttons/Button";
import { CarPartInterface } from "@/lib/interfaces";

const partVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

interface CarPartsGridProps {
  parts: CarPartInterface[];
}

const CarPartsGrid: React.FC<CarPartsGridProps> = ({ parts }) => {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");

  // Derive unique filter options from parts data
  const brands = useMemo(
    () => [...new Set(parts.map((p) => p.brand))].sort(),
    [parts]
  );
  const categories = useMemo(
    () => [...new Set(parts.map((p) => p.category))].sort(),
    [parts]
  );
  const conditions = useMemo(
    () => [...new Set(parts.map((p) => p.condition))].sort(),
    [parts]
  );

  // Filter parts based on selected filters
  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const brandMatch = !selectedBrand || part.brand === selectedBrand;
      const categoryMatch =
        !selectedCategory || part.category === selectedCategory;
      const conditionMatch =
        !selectedCondition || part.condition === selectedCondition;

      return brandMatch && categoryMatch && conditionMatch;
    });
  }, [parts, selectedBrand, selectedCategory, selectedCondition]);

  const getConditionBadgeClass = (condition: string) => {
    switch (condition) {
      case "New":
        return "bg-emerald-100 text-emerald-700";
      case "Refurbished":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const handleReservePart = (part: CarPartInterface) => {
    const params = new URLSearchParams({
      subject: "Part Enquiry",
      part: part.name,
      brand: part.brand,
    });
    router.push(`/contact?${params.toString()}`);
  };

  /** Check if the part name already contains both brand and category text */
  const nameContainsBrandAndCategory = (part: CarPartInterface): boolean => {
    return (
      part.name.includes(part.brand) &&
      part.name.toLowerCase().includes(part.category.toLowerCase())
    );
  };

  return (
    <>
      {/* Filter Section */}
      <FilterSection
        brands={brands}
        categories={categories}
        conditionFilters={conditions}
        selectedBrand={selectedBrand}
        selectedCategory={selectedCategory}
        selectedCondition={selectedCondition}
        onBrandChange={setSelectedBrand}
        onCategoryChange={setSelectedCategory}
        onConditionChange={setSelectedCondition}
      />

      {/* Parts Grid */}
      {filteredParts.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
          {filteredParts.map((part) => (
            <motion.div
              key={String(part._id)}
              variants={partVariants}
              layout
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              whileHover={{ y: -4 }}
              className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              {/* Part Image */}
              <div className="relative h-48 overflow-hidden rounded-t-xl bg-gray-100">
                {part.image ? (
                  <Image
                    src={part.image}
                    alt={part.name}
                    className="h-full w-full object-cover"
                    width={300}
                    height={192}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    No Image Available
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${getConditionBadgeClass(
                      part.condition
                    )}`}
                  >
                    {part.condition}
                  </span>
                </div>
              </div>

              {/* Part Details */}
              <div className="p-4">
                {!nameContainsBrandAndCategory(part) && (
                  <div className="mb-2">
                    <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {part.brand} • {part.category}
                    </span>
                  </div>
                )}

                <h3 className="heading-3 mb-2 line-clamp-2">{part.name}</h3>

                <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                  {part.description}
                </p>

                <div className="mb-3">
                  <p className="mb-1 text-xs text-gray-500">Compatible with:</p>
                  <p className="text-sm font-medium text-gray-700">
                    {part.compatibility}
                  </p>
                </div>

                <div className="mb-3">
                  <span
                    className={`text-sm font-medium ${
                      // emerald-700 / red-700 to clear WCAG AA contrast on white
                      // (was emerald-600 / red-600 — borderline pass at 14px).
                      part.inStock ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {part.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-red-600">
                      £{part.price}
                    </span>
                  </div>
                  <Button onClick={() => handleReservePart(part)} size="sm">
                    Reserve Part
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="py-12 text-center"
        >
          <div className="mb-2 text-lg text-gray-500">No parts found</div>
          <div className="text-sm text-gray-400">
            Try adjusting your filters to see more results
          </div>
        </motion.div>
      )}
    </>
  );
};

export default CarPartsGrid;
