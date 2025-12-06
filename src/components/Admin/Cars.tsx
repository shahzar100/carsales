import React from "react";
import { Car } from "@/lib/interfaces";

interface CarsProps {
  cars: Car[];
  loading?: boolean;
}

const Cars = ({ cars }: CarsProps) => {
  console.log(cars);

  return (
    <>
      {cars.length > 0 && (
        <div>
          <h1 className="mb-4 text-2xl font-bold">Cars List</h1>
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Make</th>
                <th className="border border-gray-300 px-4 py-2">Model</th>
                <th className="border border-gray-300 px-4 py-2">Year</th>
                <th className="border border-gray-300 px-4 py-2">Price</th>
                <th className="border border-gray-300 px-4 py-2">Status</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car._id}>
                  <td className="border border-gray-300 px-4 py-2">
                    {car.make}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {car.model}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {car.year}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    ${car.price}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {car.status}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <button>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default Cars;
