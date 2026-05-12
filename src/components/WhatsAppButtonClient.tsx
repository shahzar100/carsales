"use client";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

interface Props {
  phone: string;
  businessName: string;
}

/**
 * Floating WhatsApp button — bottom-right on every customer page.
 *
 * Pre-fills a context-aware message based on what the user is viewing
 * (a specific car URL → "I'm interested in this car: …"). Empty on the
 * admin section.
 *
 * Phone format: WhatsApp expects E.164 without spaces or +. We strip
 * non-digits and prefix "44" for UK numbers that start with 0.
 */
export default function WhatsAppButtonClient({ phone, businessName }: Props) {
  const pathname = usePathname();

  // Don't render on admin or booking-confirmation routes — admins don't
  // need to message themselves, and the confirmation page is post-funnel.
  if (
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname.includes("/confirmation")
  ) {
    return null;
  }

  // Normalise the phone for wa.me. UK numbers entered as "0113 468 9292"
  // become "441134689292".
  const cleaned = phone.replace(/\D/g, "");
  const normalised = cleaned.startsWith("0")
    ? `44${cleaned.slice(1)}`
    : cleaned;

  const message =
    pathname && pathname.startsWith("/BrowseFleet/") && pathname.length > 12
      ? `Hi ${businessName}, I'm interested in this car: ${typeof window !== "undefined" ? window.location.href : ""}`
      : `Hi ${businessName}, I have a question about your services.`;

  const href = `https://wa.me/${normalised}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 hover:shadow-xl active:scale-95 sm:right-6 sm:bottom-6"
    >
      <MessageCircle className="h-7 w-7" fill="currentColor" strokeWidth={0} />
      <span className="sr-only">WhatsApp</span>
    </a>
  );
}
