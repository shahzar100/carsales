"use client";
import React, { useState } from "react";
import Dropdown from "./Dropdown";
import CarForm from "./CarForm";
import AppointmentForm from "./AppointmentForm";
import UserForm from "./UserForm";
import PasswordForm from "./PasswordForm";

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
  description: string;
  featured: boolean;
}

const MainForm = () => {
  const [type, setType] = useState("");

  const options = [
    { value: "User", label: "User" },
    { value: "Car", label: "Car" },
    { value: "Appointment", label: "Appointment" },
    { value: "Password", label: "Password" },
  ];

  return (
    <div>
      <div className="flex w-full flex-col gap-6 rounded-lg border p-8">
        <Dropdown
          label="Type"
          placeholder="Select Type"
          options={options}
          value={type}
          onChange={(value) => setType(value)}
          required
        />

        {type === "Car" && <CarForm />}
        {type === "Appointment" && <AppointmentForm />}
        {type === "User" && <UserForm />}
        {type === "Password" && <PasswordForm />}
      </div>
    </div>
  );
};

export default MainForm;
