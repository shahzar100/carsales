"use client";
import React, { useState, useMemo } from "react";
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
import { Car, DollarSign, Palette, ClipboardList } from "lucide-react";

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
  });

  const update = (field: keyof CarFormData, value: string | boolean) => {
    setCarData((prev) => ({ ...prev, [field]: value }));
  };

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

      // ── Step 4: Review & Submit ──────────────────────────
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
                value={
                  carData.price
                    ? `£${Number(carData.price).toLocaleString()}`
                    : "—"
                }
              />
              <SummaryRow
                label="Mileage"
                value={
                  carData.mileage
                    ? `${Number(carData.mileage).toLocaleString()} mi`
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
            </SummaryCard>
          </div>
        ),
      },
    ],
    [carData]
  );

  const handleSubmit = async () => {
    console.log("Car submitted:", carData);
    // TODO: POST to /api/admin/cars
  };

  return <Form steps={steps} onSubmit={handleSubmit} submitLabel="Add Car" />;
};

export default CarForm;
