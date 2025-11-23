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
          <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
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
                      className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye className="h-3 w-3" />
                      Details
                    </button>
                    {booking.status === "pending" && onConfirmBooking && (
                      <button
                        onClick={() => onConfirmBooking(booking)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-green-600 transition-colors hover:bg-green-50 hover:text-green-800"
                        title="Confirm Booking"
                      >
                        <Check className="h-3 w-3" />
                        Confirm
                      </button>
                    )}
                    {booking.status !== "cancelled" &&
                      booking.status !== "completed" && (
                        <button
                          onClick={() =>
                            onCancelBooking({ booking, type: "viewing" })
                          }
                          className="rounded px-2 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
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
