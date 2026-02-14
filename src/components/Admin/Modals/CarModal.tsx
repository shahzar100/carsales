import React from "react";
import Dropdown from "@/components/Admin/Form/Dropdown";
import { CarFormData } from "@/components/Admin/Form/MainForm";

interface CarModalProps {
  data: CarFormData;
  onChange: (field: keyof CarFormData, value: string) => void;
}

const AddCarModal: React.FC<CarModalProps> = ({ data, onChange }) => {
  const makeOptions = [
    { value: "BMW", label: "BMW" },
    { value: "Mercedes", label: "Mercedes" },
    { value: "Audi", label: "Audi" },
    { value: "Toyota", label: "Toyota" },
    { value: "Honda", label: "Honda" },
    { value: "Ford", label: "Ford" },
    { value: "Volkswagen", label: "Volkswagen" },
    { value: "Tesla", label: "Tesla" },
  ];

  const yearOptions = Array.from({ length: 30 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

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

  const doorsOptions = [
    { value: "2", label: "2 Doors" },
    { value: "3", label: "3 Doors" },
    { value: "4", label: "4 Doors" },
    { value: "5", label: "5 Doors" },
  ];

  const colourOptions = [
    { value: "Black", label: "Black" },
    { value: "White", label: "White" },
    { value: "Silver", label: "Silver" },
    { value: "Grey", label: "Grey" },
    { value: "Blue", label: "Blue" },
    { value: "Red", label: "Red" },
    { value: "Green", label: "Green" },
  ];

  const statusOptions = [
    { value: "available", label: "Available" },
    { value: "reserved", label: "Reserved" },
    { value: "sold", label: "Sold" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Dropdown
          label="Make"
          placeholder="Select make"
          options={makeOptions}
          value={data.make}
          onChange={(value) => onChange("make", value)}
          required
        />

        <div className="flex flex-col">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Model <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.model}
            onChange={(e) => onChange("model", e.target.value)}
            placeholder="Enter model"
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <Dropdown
          label="Year"
          placeholder="Select year"
          options={yearOptions}
          value={data.year}
          onChange={(value) => onChange("year", value)}
          required
        />

        <div className="flex flex-col">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Price (£) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.price}
            onChange={(e) => onChange("price", e.target.value)}
            placeholder="Enter price"
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Mileage <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.mileage}
            onChange={(e) => onChange("mileage", e.target.value)}
            placeholder="Enter mileage"
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <Dropdown
          label="Fuel Type"
          placeholder="Select fuel type"
          options={fuelOptions}
          value={data.fuel}
          onChange={(value) => onChange("fuel", value)}
          required
        />

        <Dropdown
          label="Transmission"
          placeholder="Select transmission"
          options={transmissionOptions}
          value={data.transmission}
          onChange={(value) => onChange("transmission", value)}
          required
        />

        <Dropdown
          label="Doors"
          placeholder="Select doors"
          options={doorsOptions}
          value={data.doors}
          onChange={(value) => onChange("doors", value)}
          required
        />

        <Dropdown
          label="Colour"
          placeholder="Select colour"
          options={colourOptions}
          value={data.colour}
          onChange={(value) => onChange("colour", value)}
          required
        />

        <Dropdown
          label="Status"
          placeholder="Select status"
          options={statusOptions}
          value={data.status}
          onChange={(value) => onChange("status", value)}
          required
        />
      </div>
    </div>
  );
};

export default AddCarModal;
