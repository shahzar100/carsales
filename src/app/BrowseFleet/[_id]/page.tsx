import React from "react";
import CarDisplay from "@/components/Shop/Collection/CarDisplay";

// Mock car data for now - replace with your actual data fetching
const mockCars = [
  {
    _id: "1",
    Name: "Model S",
    Brand: "Tesla",
    Year: 2023,
    Fuel: "Electric",
    Doors: 4,
    Colour: "White",
    Price: 85000,
    Mileage: 5000,
    Image: "/car.webp",
  },
  {
    _id: "2",
    Name: "Civic",
    Brand: "Honda",
    Year: 2022,
    Fuel: "Petrol",
    Doors: 4,
    Colour: "Blue",
    Price: 25000,
    Mileage: 15000,
    Image: "/car.webp",
  },
];

interface PageProps {
  params: {
    _id: string;
  };
}

const CarDetailsPage = ({ params }: PageProps) => {
  // For now, using mock data - replace with actual data fetching
  const car = mockCars.find((c) => c._id === params._id) || mockCars[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {car && <CarDisplay car={car} />}
    </div>
  );
};

export default CarDetailsPage;
