"use client";
import React, { useState } from "react";
import Dropdown from "./Dropdown";
import CarForm from "./CarForm";

export interface CarFormData {
  make: string;
  model: string;
  year: string;
  price: string;
  mileage: string;
  fuel: string;
  transmission: string;
  doors: string;
  colour: string;
  status: string;
}

const MainForm = () => {
  const [type, setType] = useState("");
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
  });

  const options = [
    { value: "User", label: "User" },
    { value: "Car", label: "Car" },
    { value: "Appointment", label: "Appointment" },
  ];

  const handleCarDataChange = (field: keyof CarFormData, value: string) => {
    setCarData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", { type, carData });
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex h-100 w-full flex-col gap-6 overflow-y-scroll rounded-lg border p-8"
      >
        <Dropdown
          label="Type"
          placeholder="Select Type"
          options={options}
          value={type}
          onChange={(value) => setType(value)}
          required
        />

        {type === "Car" && <CarForm />}

        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default MainForm;
