import { Search, Eye, Check } from "lucide-react";
import { Booking, SelectedBooking } from "./types";

interface ViewingBookingsTabProps {
  bookings: Booking[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCancelBooking: (selectedBooking: SelectedBooking) => void;
  onConfirmBooking?: (booking: Booking) => void;
  onViewDetails: (booking: Booking) => void;
  getStatusBadge: (status: string) => React.ReactElement;
}

export default function ViewingBookingsTab({
  bookings,
  searchTerm,
  onSearchChange,
  onCancelBooking,
  onConfirmBooking,
  onViewDetails,
  getStatusBadge,
}: ViewingBookingsTabProps) {
  const filteredBookings = bookings.filter(
    (booking) =>
      booking.bookingReference
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      booking.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Vehicle
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date/Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredBookings.map((booking) => (
              <tr key={booking._id}>
                <td className="px-4 py-3 font-mono text-sm">
                  {booking.bookingReference}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <p className="font-medium">{booking.customerInfo.name}</p>
                    <p className="text-gray-500">
                      {booking.customerInfo.email}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {booking.carDetails && (
                    <p className="font-medium">
                      {booking.carDetails.year} {booking.carDetails.make}{" "}
                      {booking.carDetails.model}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <p>
                    {new Date(booking.appointmentDate).toLocaleDateString()}
                  </p>
                  <p className="text-gray-500">{booking.appointmentTime}</p>
                </td>
                <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewDetails(booking)}
                      className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded text-sm font-medium transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3 h-3" />
                      Details
                    </button>
                    {booking.status === "pending" && onConfirmBooking && (
                      <button
                        onClick={() => onConfirmBooking(booking)}
                        className="flex items-center gap-1 px-2 py-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded text-sm font-medium transition-colors"
                        title="Confirm Booking"
                      >
                        <Check className="w-3 h-3" />
                        Confirm
                      </button>
                    )}
                    {booking.status !== "cancelled" &&
                      booking.status !== "completed" && (
                        <button
                          onClick={() =>
                            onCancelBooking({ booking, type: "viewing" })
                          }
                          className="px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
