"use client";
import React, { useState, useEffect } from "react";
import { CarsTab, CarModal, Car } from "@/components/Admin";
import { useToast } from "@/hooks/useToast";

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCarModal, setShowCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  const toast = useToast();

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/cars");
      const data = await response.json();
      if (data.success) setCars(data.data);
    } catch {
      console.error("Error fetching cars:");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!confirm("Are you sure you want to delete this car?")) return;

    try {
      const response = await fetch(`/api/admin/cars?id=${carId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Car Deleted", "Car has been deleted successfully");
        fetchCars();
      } else {
        toast.error("Delete Failed", "Failed to delete car");
      }
    } catch (error) {
      toast.error("Error", String(error));
    }
  };

  const handleSaveCar = async (carData: Partial<Car>) => {
    try {
      const method = editingCar ? "PUT" : "POST";
      const response = await fetch("/api/admin/cars", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingCar ? { _id: editingCar._id, ...carData } : carData
        ),
      });

      if (response.ok) {
        toast.success(
          editingCar ? "Car Updated" : "Car Added",
          editingCar
            ? "Car details updated successfully"
            : "New car added successfully"
        );
        setShowCarModal(false);
        setEditingCar(null);
        fetchCars();
      } else {
        toast.error("Save Failed", "Failed to save car details");
      }
    } catch (error) {
      toast.error("Error", String(error));
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      available: "bg-green-100 text-green-800",
      sold: "bg-red-100 text-red-800",
      reserved: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${
          colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const handleAddCar = () => {
    setEditingCar(null);
    setShowCarModal(true);
  };

  const handleEditCar = (car: Car) => {
    setEditingCar(car);
    setShowCarModal(true);
  };

  const handleCloseCarModal = () => {
    setShowCarModal(false);
    setEditingCar(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading cars...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CarsTab
        cars={cars}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddCar={handleAddCar}
        onEditCar={handleEditCar}
        onDeleteCar={handleDeleteCar}
        getStatusBadge={getStatusBadge}
      />

      {/* Car Modal */}
      {showCarModal && (
        <CarModal
          car={editingCar}
          onClose={handleCloseCarModal}
          onSave={handleSaveCar}
        />
      )}
    </div>
  );
}
