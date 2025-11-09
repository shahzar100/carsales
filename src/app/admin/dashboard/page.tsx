"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Calendar,
  Eye,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Car {
  _id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  transmission: string;
  doors: number;
  colour: string;
  status: string;
  image?: string;
}

interface Booking {
  _id: string;
  bookingReference: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  serviceType?: string;
  carDetails?: {
    make: string;
    model: string;
    year: number;
    price: number;
  };
}

interface ShopInfo {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  hours: {
    [key: string]: string;
  };
  description?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"cars" | "service" | "viewing" | "shop">("cars");
  const [cars, setCars] = useState<Car[]>([]);
  const [serviceBookings, setServiceBookings] = useState<Booking[]>([]);
  const [viewingBookings, setViewingBookings] = useState<Booking[]>([]);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCarModal, setShowCarModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{ booking: Booking; type: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/logout");
      const result = await response.json();
      if (!result.isLoggedIn) {
        router.push("/admin/login");
      }
    } catch (error) {
      router.push("/admin/login");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [carsRes, bookingsRes, shopRes] = await Promise.all([
        fetch("/api/admin/cars"),
        fetch("/api/admin/bookings"),
        fetch("/api/admin/shop"),
      ]);

      const carsData = await carsRes.json();
      const bookingsData = await bookingsRes.json();
      const shopData = await shopRes.json();

      if (carsData.success) setCars(carsData.data);
      if (bookingsData.success) {
        setServiceBookings(bookingsData.data.serviceBookings);
        setViewingBookings(bookingsData.data.viewingBookings);
      }
      if (shopData.success) setShopInfo(shopData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!confirm("Are you sure you want to delete this car?")) return;

    try {
      const response = await fetch(`/api/admin/cars?id=${carId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showNotification("success", "Car deleted successfully");
        fetchData();
      } else {
        showNotification("error", "Failed to delete car");
      }
    } catch (error) {
      showNotification("error", "An error occurred");
    }
  };

  const handleSaveCar = async (carData: Partial<Car>) => {
    try {
      const method = editingCar ? "PUT" : "POST";
      const response = await fetch("/api/admin/cars", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCar ? { _id: editingCar._id, ...carData } : carData),
      });

      if (response.ok) {
        showNotification("success", editingCar ? "Car updated successfully" : "Car added successfully");
        setShowCarModal(false);
        setEditingCar(null);
        fetchData();
      } else {
        showNotification("error", "Failed to save car");
      }
    } catch (error) {
      showNotification("error", "An error occurred");
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || cancelReason.length < 10) {
      showNotification("error", "Cancellation reason must be at least 10 characters");
      return;
    }

    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingReference: selectedBooking.booking.bookingReference,
          type: selectedBooking.type,
          reason: cancelReason,
        }),
      });

      if (response.ok) {
        showNotification("success", "Booking cancelled and customer notified");
        setShowCancelModal(false);
        setSelectedBooking(null);
        setCancelReason("");
        fetchData();
      } else {
        showNotification("error", "Failed to cancel booking");
      }
    } catch (error) {
      showNotification("error", "An error occurred");
    }
  };

  const handleSaveShopInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shopInfo) return;

    try {
      const response = await fetch("/api/admin/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopInfo),
      });

      if (response.ok) {
        showNotification("success", "Shop information updated successfully");
      } else {
        showNotification("error", "Failed to update shop information");
      }
    } catch (error) {
      showNotification("error", "An error occurred");
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  const filteredCars = cars.filter((car) =>
    `${car.make} ${car.model} ${car.year}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServiceBookings = serviceBookings.filter((booking) =>
    booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredViewingBookings = viewingBookings.filter((booking) =>
    booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}>
          <div className="flex items-center gap-2">
            {notification.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            {[
              { id: "cars", label: "Cars", icon: Car },
              { id: "service", label: "Service Bookings", icon: Calendar },
              { id: "viewing", label: "Car Viewings", icon: Eye },
              { id: "shop", label: "Shop Settings", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Cars Tab */}
        {activeTab === "cars" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search cars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  setEditingCar(null);
                  setShowCarModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Car
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCars.map((car) => (
                <div key={car._id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {car.image && (
                    <img src={car.image} alt={`${car.make} ${car.model}`} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">
                          {car.year} {car.make} {car.model}
                        </h3>
                        <p className="text-green-600 font-bold text-xl">${car.price.toLocaleString()}</p>
                      </div>
                      {getStatusBadge(car.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <p>Mileage: {car.mileage.toLocaleString()} miles</p>
                      <p>Fuel: {car.fuel} • {car.transmission}</p>
                      <p>Color: {car.colour} • {car.doors} doors</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCar(car);
                          setShowCarModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCar(car._id)}
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
        )}

        {/* Service Bookings Tab */}
        {activeTab === "service" && (
          <div>
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredServiceBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="px-4 py-3 font-mono text-sm">{booking.bookingReference}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium">{booking.customerInfo.name}</p>
                          <p className="text-gray-500">{booking.customerInfo.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{booking.serviceType}</td>
                      <td className="px-4 py-3 text-sm">
                        <p>{new Date(booking.appointmentDate).toLocaleDateString()}</p>
                        <p className="text-gray-500">{booking.appointmentTime}</p>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                      <td className="px-4 py-3">
                        {booking.status !== "cancelled" && (
                          <button
                            onClick={() => {
                              setSelectedBooking({ booking, type: "service" });
                              setShowCancelModal(true);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Car Viewings Tab */}
        {activeTab === "viewing" && (
          <div>
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredViewingBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="px-4 py-3 font-mono text-sm">{booking.bookingReference}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium">{booking.customerInfo.name}</p>
                          <p className="text-gray-500">{booking.customerInfo.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {booking.carDetails && (
                          <p className="font-medium">
                            {booking.carDetails.year} {booking.carDetails.make} {booking.carDetails.model}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p>{new Date(booking.appointmentDate).toLocaleDateString()}</p>
                        <p className="text-gray-500">{booking.appointmentTime}</p>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                      <td className="px-4 py-3">
                        {booking.status !== "cancelled" && (
                          <button
                            onClick={() => {
                              setSelectedBooking({ booking, type: "viewing" });
                              setShowCancelModal(true);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shop Settings Tab */}
        {activeTab === "shop" && shopInfo && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-6">Shop Information</h2>
              <form onSubmit={handleSaveShopInfo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      value={shopInfo.businessName}
                      onChange={(e) => setShopInfo({ ...shopInfo, businessName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={shopInfo.phone}
                      onChange={(e) => setShopInfo({ ...shopInfo, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={shopInfo.email}
                    onChange={(e) => setShopInfo({ ...shopInfo, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={shopInfo.address}
                    onChange={(e) => setShopInfo({ ...shopInfo, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={shopInfo.city}
                      onChange={(e) => setShopInfo({ ...shopInfo, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={shopInfo.state}
                      onChange={(e) => setShopInfo({ ...shopInfo, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      value={shopInfo.zipCode}
                      onChange={(e) => setShopInfo({ ...shopInfo, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={shopInfo.description || ""}
                    onChange={(e) => setShopInfo({ ...shopInfo, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Business Hours</h3>
                  <div className="space-y-2">
                    {Object.keys(shopInfo.hours).map((day) => (
                      <div key={day} className="flex items-center gap-4">
                        <label className="w-32 text-sm font-medium text-gray-700 capitalize">{day}</label>
                        <input
                          type="text"
                          value={shopInfo.hours[day]}
                          onChange={(e) =>
                            setShopInfo({
                              ...shopInfo,
                              hours: { ...shopInfo.hours, [day]: e.target.value },
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Car Modal */}
      {showCarModal && (
        <CarModal
          car={editingCar}
          onClose={() => {
            setShowCarModal(false);
            setEditingCar(null);
          }}
          onSave={handleSaveCar}
        />
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Cancel Booking</h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                  setCancelReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Booking Reference: <span className="font-mono font-bold">{selectedBooking.booking.bookingReference}</span>
              </p>
              <p className="text-sm text-gray-600">
                Customer: <span className="font-medium">{selectedBooking.booking.customerInfo.name}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation (minimum 10 characters)"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{cancelReason.length}/10 characters minimum</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                  setCancelReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelReason.length < 10}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Car Modal Component
function CarModal({
  car,
  onClose,
  onSave,
}: {
  car: Car | null;
  onClose: () => void;
  onSave: (car: Partial<Car>) => void;
}) {
  const [formData, setFormData] = useState<Partial<Car>>(
    car || {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      price: 0,
      mileage: 0,
      fuel: "Petrol",
      transmission: "Automatic",
      doors: 4,
      colour: "",
      status: "available",
      image: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">{car ? "Edit Car" : "Add New Car"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                value={formData.colour}
                onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
              <select
                value={formData.fuel}
                onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
              <select
                value={formData.transmission}
                onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doors</label>
              <input
                type="number"
                value={formData.doors}
                onChange={(e) => setFormData({ ...formData, doors: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/car-image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {car ? "Update Car" : "Add Car"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
