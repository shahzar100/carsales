import {
  SERVICE_LABELS,
  emailRegex,
  phoneRegex,
  today,
  type BookingState,
} from "./bookingFlowTypes";
import type { ServiceKey } from "./ServiceCard";
import type { PackageCardData } from "./PackageCard";

// ── Validators ───────────────────────────────────────────────
// Each returns null when valid or an error message string. Kept tiny and
// pure so the orchestrator stays focused on wiring.
export function validateVehicle(
  data: BookingState,
  currentYear: number
): string | null {
  if (!data.vehicleMake.trim()) return "Vehicle make is required";
  if (!data.vehicleModel.trim()) return "Vehicle model is required";
  if (!data.vehicleYear) return "Vehicle year is required";
  const y = Number(data.vehicleYear);
  if (y < 1900 || y > currentYear + 1)
    return `Year must be between 1900 and ${currentYear + 1}`;
  return null;
}

export function validateSchedule(data: BookingState): string | null {
  if (data.purpose === "quote") return null;
  if (!data.date) return "Please select a date";
  if (data.date < today()) return "Date cannot be in the past";
  if (!data.time) return "Please select a time";
  return null;
}

export function validateContact(data: BookingState): string | null {
  if (!data.name.trim()) return "Full name is required";
  if (!data.email.trim()) return "Email address is required";
  if (!emailRegex.test(data.email))
    return "Please enter a valid email address";
  if (!data.phone.trim()) return "Phone number is required";
  if (!phoneRegex.test(data.phone)) return "Please enter a valid phone number";
  return null;
}

// ── Submission ───────────────────────────────────────────────
export interface SubmitArgs {
  data: BookingState;
  selectedService: { key: ServiceKey };
  selectedPackage: PackageCardData;
  turnstileToken: string | undefined;
}

// Resolves with the reference string (booking or quote) on success, or
// throws an Error with a user-presentable message on failure.
export async function submitBooking({
  data,
  selectedService,
  selectedPackage,
  turnstileToken,
}: SubmitArgs): Promise<string> {
  const serviceTypeLabel = SERVICE_LABELS[selectedService.key];
  const servicePackageLabel = selectedPackage.name;
  const fullService = `${serviceTypeLabel} — ${servicePackageLabel}`;

  if (data.purpose === "quote") {
    const payload = {
      customerInfo: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
      serviceType: fullService,
      serviceDetails: data.serviceDetails || "",
      vehicle: {
        make: data.vehicleMake,
        model: data.vehicleModel,
        year: data.vehicleYear,
        registration: data.vehicleReg || undefined,
      },
      turnstileToken,
    };
    const res = await fetch("/api/bookings/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to submit quote request");
    }
    return result.data.quoteReference;
  }

  const payload = {
    customerInfo: {
      name: data.name,
      email: data.email,
      phone: data.phone,
    },
    serviceType: fullService,
    serviceDetails: [
      `Vehicle: ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}`,
      data.vehicleReg ? `Reg: ${data.vehicleReg}` : "",
      data.serviceDetails,
    ]
      .filter(Boolean)
      .join("\n"),
    appointmentDate: data.date,
    appointmentTime: data.time,
    turnstileToken,
  };
  const res = await fetch("/api/bookings/service", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.error || "Failed to book service");
  }
  return result.data.bookingReference;
}
