import { Search, Plus, Edit, Trash2 } from "lucide-react";
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
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search cars..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={onAddCar}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Car
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCars.map((car) => (
          <div
            key={car._id}
            className="bg-white rounded-lg shadow-sm border overflow-hidden"
          >
            {car.image && (
              <img
                src={car.image}
                alt={`${car.make} ${car.model}`}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <p className="text-green-600 font-bold text-xl">
                    ${car.price.toLocaleString()}
                  </p>
                </div>
                {getStatusBadge(car.status)}
              </div>
              <div className="text-sm text-gray-600 space-y-1 mb-4">
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
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDeleteCar(car._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
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
