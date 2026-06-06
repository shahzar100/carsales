"use client";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { m } from "motion/react";

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

  // (Day 9 / Fix 9.2) Strip query strings + hash from the URL we paste
  // into WhatsApp. Customer doesn't need our `?utm_...` / filter state,
  // and it removes a small PII / search-history leak.
  const cleanUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";

  const message =
    pathname && pathname.startsWith("/BrowseFleet/") && pathname.length > 12
      ? `Hi ${businessName}, I'm interested in this car: ${cleanUrl}`
      : `Hi ${businessName}, I have a question about your services.`;

  const href = `https://wa.me/${normalised}?text=${encodeURIComponent(message)}`;

  return (
    <m.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ scale: 0, opacity: 0, rotate: -45 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 360,
        damping: 22,
        delay: 0.6,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/30 hover:shadow-xl sm:right-6 sm:bottom-6"
    >
      {/* Soft ambient pulse ring — draws the eye without being obtrusive. */}
      <m.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full bg-[#25D366]"
        animate={{ scale: [1, 1.45], opacity: [0.4, 0] }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeOut",
          repeatDelay: 0.6,
        }}
      />
      <MessageCircle className="relative h-7 w-7" fill="currentColor" strokeWidth={0} />
      <span className="sr-only">WhatsApp</span>
    </m.a>
  );
}
