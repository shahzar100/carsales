import { Booking, SelectedBooking } from "@/lib/types";
import BookingsTable from "@/components/Helpful/BookingsTable";

interface ServiceBookingsTabProps {
  bookings: Booking[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCancelBooking: (selectedBooking: SelectedBooking) => void;
  onConfirmBooking?: (booking: Booking) => void;
  onViewDetails: (booking: Booking) => void;
  getStatusBadge: (status: string) => React.ReactElement;
}

export default function ServiceBookingsTab(props: ServiceBookingsTabProps) {
  return <BookingsTable type="service" {...props} />;
}
