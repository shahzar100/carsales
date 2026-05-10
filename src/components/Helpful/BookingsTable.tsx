import React from "react";
import { Search, Eye, Check } from "lucide-react";
import { Booking, SelectedBooking } from "@/lib/types";
import Button from "@/components/Helpful/Buttons/Button";
import { formatDate } from "@/lib/utils/format";
import { formatTime } from "@/lib/utils/booking";

type BookingType = "viewing" | "service";

interface BookingsTableProps {
  type: BookingType;
  bookings: Booking[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCancelBooking: (selectedBooking: SelectedBooking) => void;
  onConfirmBooking?: (booking: Booking) => void;
  onViewDetails: (booking: Booking) => void;
  getStatusBadge: (status: string) => React.ReactElement;
}

/** Shared table for viewing and service bookings — only the "detail" column differs. */
export default function BookingsTable({
  type,
  bookings,
  searchTerm,
  onSearchChange,
  onCancelBooking,
  onConfirmBooking,
  onViewDetails,
  getStatusBadge,
}: BookingsTableProps) {
  const filteredBookings = bookings.filter(
    (booking) =>
      booking.bookingReference
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      booking.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const detailHeader = type === "viewing" ? "Vehicle" : "Service";

  const renderDetail = (booking: Booking) => {
    if (type === "viewing" && booking.carDetails) {
      return (
        <p className="font-medium">
          {booking.carDetails.year} {booking.carDetails.make}{" "}
          {booking.carDetails.model}
        </p>
      );
    }
    if (type === "service") {
      return <>{booking.serviceType}</>;
    }
    return null;
  };

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
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
                {detailHeader}
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
                <td className="px-4 py-3 text-sm">{renderDetail(booking)}</td>
                <td className="px-4 py-3 text-sm">
                  <p>{formatDate(booking.appointmentDate)}</p>
                  <p className="text-gray-500">
                    {formatTime(booking.appointmentTime)}
                  </p>
                </td>
                <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onViewDetails(booking)}
                      variant="ghost"
                      disabled={false}
                      customWidth="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Eye className="h-3.5 w-3.5" /> Details
                    </Button>
                    {booking.status === "pending" && onConfirmBooking && (
                      <Button
                        onClick={() => onConfirmBooking(booking)}
                        variant="ghost"
                        disabled={false}
                        customWidth="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-green-600 hover:bg-green-50 hover:text-green-800"
                      >
                        <Check className="h-3.5 w-3.5" /> Confirm
                      </Button>
                    )}
                    {booking.status !== "cancelled" &&
                      booking.status !== "completed" && (
                        <Button
                          onClick={() => onCancelBooking({ booking, type })}
                          variant="ghost"
                          disabled={false}
                          customWidth="rounded px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-800"
                        >
                          Cancel
                        </Button>
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
