import { Search, Plus, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { Car } from "./types";

interface CarsTabProps {
  cars: Car[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddCar: () => void;
  onEditCar: (car: Car) => void;
  onDeleteCar: (carId: string) => void;
  getStatusBadge: (status: string) => React.ReactElement;
}

export default function CarsTab({
  cars,
  searchTerm,
  onSearchChange,
  onAddCar,
  onEditCar,
  onDeleteCar,
  getStatusBadge,
}: CarsTabProps) {
  const filteredCars = cars.filter((car) =>
    `${car.make} ${car.model} ${car.year}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cars..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <button
          onClick={onAddCar}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Car
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCars.map((car) => (
          <div
            key={car._id}
            className="overflow-hidden rounded-lg border bg-white shadow-sm"
          >
            {car.image && (
              <Image
                src={car.image}
                alt={`${car.make} ${car.model}`}
                className="h-48 w-full object-cover"
                width={300}
                height={192}
              />
            )}
            <div className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <p className="text-xl font-bold text-green-600">
                    ${car.price.toLocaleString()}
                  </p>
                </div>
                {getStatusBadge(car.status)}
              </div>
              <div className="mb-4 space-y-1 text-sm text-gray-600">
                <p>Mileage: {car.mileage.toLocaleString()} miles</p>
                <p>
                  Fuel: {car.fuel} • {car.transmission}
                </p>
                <p>
                  Color: {car.colour} • {car.doors} doors
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditCar(car)}
                  className="flex flex-1 items-center justify-center gap-2 rounded bg-blue-50 px-3 py-2 text-blue-600 hover:bg-blue-100"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDeleteCar(car._id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
