"use client";
import { useState } from "react";
import Dropdown from "../../Form/Dropdown";
import CarForm from "./CarForm";
import AppointmentForm from "../../Main/Form/AppointmentForm";
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
  image: string;
  images: string[];
}

const options = [
  { value: "User", label: "User" },
  { value: "Car", label: "Car" },
  { value: "Appointment", label: "Appointment" },
  { value: "Password", label: "Password" },
];

const MainForm = () => {
  const [type, setType] = useState("");

  return (
    <div>
      <div className="flex w-full flex-col gap-6 rounded-lg border p-4 sm:p-6 lg:p-8">
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
