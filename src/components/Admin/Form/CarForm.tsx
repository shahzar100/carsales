"use client";
import React, { useState, useMemo, useCallback } from "react";
import Form, { FormStep } from "../../Form/Form";
import Dropdown from "../../Form/Dropdown";
import { CarFormData } from "./MainForm";
import {
  FormInput,
  FormTextarea,
  FormToggle,
  SummaryRow,
  SummaryCard,
} from "@/components/Form/FormPrimitives";
import ImageUploader from "@/components/Admin/ImageUploader";
import {
  Car,
  DollarSign,
  Palette,
  ImagePlus,
  ClipboardList,
} from "lucide-react";
import { formatPrice, formatMileage } from "@/lib/utils/format";

const currentYear = new Date().getFullYear();

const fuelOptions = [
  { value: "Petrol", label: "Petrol" },
  { value: "Diesel", label: "Diesel" },
  { value: "Electric", label: "Electric" },
  { value: "Hybrid", label: "Hybrid" },
];

const transmissionOptions = [
  { value: "Manual", label: "Manual" },
  { value: "Automatic", label: "Automatic" },
  { value: "CVT", label: "CVT" },
];

const doorOptions = [
  { value: "2", label: "2 Door" },
  { value: "3", label: "3 Door" },
  { value: "4", label: "4 Door" },
  { value: "5", label: "5 Door" },
];

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
  { value: "reserved", label: "Reserved" },
];

// ═════════════════════════════════════════════════════════════
// CarForm – uses the reusable multi-stage <Form /> component
// ═════════════════════════════════════════════════════════════
const CarForm = () => {
  const [carData, setCarData] = useState<CarFormData>({
    make: "",
    model: "",
    year: "",
    price: "",
    mileage: "",
    fuel: "",
    transmission: "",
    doors: "",
    colour: "",
    status: "",
    description: "",
    featured: false,
    image: "",
    images: [],
  });

  const update = (
    field: keyof CarFormData,
    value: string | boolean | string[]
  ) => {
    setCarData((prev) => ({ ...prev, [field]: value }));
  };

  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (carData.image) imgs.push(carData.image);
    imgs.push(...carData.images);
    return imgs;
  }, [carData.image, carData.images]);

  const handleImageUpload = useCallback(
    (url: string) => {
      if (!carData.image) {
        update("image", url);
      } else {
        update("images", [...carData.images, url]);
      }
    },
    [carData.image, carData.images]
  );

  const handleImageRemove = useCallback(
    (url: string) => {
      if (url === carData.image) {
        // Promote first additional image to main, or clear
        const [next, ...rest] = carData.images;
        setCarData((prev) => ({
          ...prev,
          image: next || "",
          images: rest,
        }));
      } else {
        update(
          "images",
          carData.images.filter((u) => u !== url)
        );
      }
    },
    [carData.image, carData.images]
  );

  // ── Step definitions ─────────────────────────────────────
  const steps: FormStep[] = useMemo(
    () => [
      // ── Step 1: Basic Info ────────────────────────────────
      {
        title: "Basic Information",
        description: "Enter the car's make, model, and year",
        icon: <Car className="h-5 w-5" />,
        validate: () => {
          if (!carData.make.trim()) return "Make is required";
          if (!carData.model.trim()) return "Model is required";
          if (!carData.year) return "Year is required";
          const y = Number(carData.year);
          if (y < 1900 || y > currentYear + 1)
            return `Year must be between 1900 and ${currentYear + 1}`;
          return true;
        },
        content: (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Make"
              value={carData.make}
              onChange={(v) => update("make", v)}
              placeholder="e.g. Toyota"
              required
            />
            <FormInput
              label="Model"
              value={carData.model}
              onChange={(v) => update("model", v)}
              placeholder="e.g. Corolla"
              required
            />
            <FormInput
              label="Year"
              type="number"
              value={carData.year}
              onChange={(v) => update("year", v)}
              placeholder={`e.g. ${currentYear}`}
              min="1900"
              max={String(currentYear + 1)}
              required
            />
          </div>
        ),
      },

      // ── Step 2: Pricing & Mileage ────────────────────────
      {
        title: "Pricing & Mileage",
        description: "Set the price and mileage details",
        icon: <DollarSign className="h-5 w-5" />,
        validate: () => {
          if (!carData.price) return "Price is required";
          if (Number(carData.price) <= 0) return "Price must be greater than 0";
          if (!carData.mileage) return "Mileage is required";
          if (Number(carData.mileage) < 0) return "Mileage cannot be negative";
          return true;
        },
        content: (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Price (£)"
              type="number"
              value={carData.price}
              onChange={(v) => update("price", v)}
              placeholder="e.g. 15000"
              min="0"
              required
            />
            <FormInput
              label="Mileage"
              type="number"
              value={carData.mileage}
              onChange={(v) => update("mileage", v)}
              placeholder="e.g. 35000"
              min="0"
              required
            />
          </div>
        ),
      },

      // ── Step 3: Specs & Appearance ───────────────────────
      {
        title: "Specs & Appearance",
        description: "Fuel type, transmission, doors, and colour",
        icon: <Palette className="h-5 w-5" />,
        validate: () => {
          if (!carData.fuel) return "Please select a fuel type";
          if (!carData.transmission) return "Please select a transmission";
          if (!carData.doors) return "Please select number of doors";
          if (!carData.colour.trim()) return "Colour is required";
          return true;
        },
        content: (
          <div className="grid gap-4 sm:grid-cols-2">
            <Dropdown
              label="Fuel Type"
              placeholder="Select fuel"
              options={fuelOptions}
              value={carData.fuel}
              onChange={(v) => update("fuel", v)}
              required
            />
            <Dropdown
              label="Transmission"
              placeholder="Select transmission"
              options={transmissionOptions}
              value={carData.transmission}
              onChange={(v) => update("transmission", v)}
              required
            />
            <Dropdown
              label="Doors"
              placeholder="Select doors"
              options={doorOptions}
              value={carData.doors}
              onChange={(v) => update("doors", v)}
              required
            />
            <FormInput
              label="Colour"
              value={carData.colour}
              onChange={(v) => update("colour", v)}
              placeholder="e.g. Midnight Blue"
              required
            />
          </div>
        ),
      },

      // ── Step 4: Photos ───────────────────────────────────
      {
        title: "Photos",
        description: "Upload images of the vehicle",
        icon: <ImagePlus className="h-5 w-5" />,
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              The first image will be the main listing photo. You can upload up
              to 10 images.
            </p>
            <ImageUploader
              folder="cars"
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              existingImages={allImages}
              maxImages={10}
              multiple
            />
          </div>
        ),
      },

      // ── Step 5: Review & Submit ──────────────────────────
      {
        title: "Review & Submit",
        description: "Review all details before submitting",
        icon: <ClipboardList className="h-5 w-5" />,
        validate: () => {
          if (!carData.status) return "Please select a status";
          return true;
        },
        content: (
          <div className="space-y-5">
            {/* Status & Featured */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Dropdown
                label="Status"
                placeholder="Select status"
                options={statusOptions}
                value={carData.status}
                onChange={(v) => update("status", v)}
                required
              />
              <FormToggle
                label="Featured"
                description="Show on homepage"
                checked={carData.featured}
                onChange={(v) => update("featured", v)}
              />
            </div>

            <FormTextarea
              label="Description (optional)"
              value={carData.description}
              onChange={(v) => update("description", v)}
              placeholder="Add any extra details about this vehicle..."
              rows={3}
            />

            {/* Summary Card */}
            <SummaryCard>
              <SummaryRow label="Make" value={carData.make} />
              <SummaryRow label="Model" value={carData.model} />
              <SummaryRow label="Year" value={carData.year} />
              <SummaryRow
                label="Price"
                value={carData.price ? formatPrice(Number(carData.price)) : "—"}
              />
              <SummaryRow
                label="Mileage"
                value={
                  carData.mileage
                    ? `${formatMileage(Number(carData.mileage))} mi`
                    : "—"
                }
              />
              <SummaryRow label="Fuel" value={carData.fuel} />
              <SummaryRow label="Transmission" value={carData.transmission} />
              <SummaryRow label="Doors" value={carData.doors} />
              <SummaryRow label="Colour" value={carData.colour} />
              <SummaryRow label="Status" value={carData.status} />
              <SummaryRow
                label="Featured"
                value={carData.featured ? "Yes" : "No"}
              />
              <SummaryRow
                label="Photos"
                value={`${allImages.length} image${allImages.length !== 1 ? "s" : ""}`}
              />
            </SummaryCard>
          </div>
        ),
      },
    ],
    [carData, allImages, handleImageUpload, handleImageRemove]
  );

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/admin/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(carData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add car");
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  return <Form steps={steps} onSubmit={handleSubmit} submitLabel="Add Car" />;
};

export default CarForm;
