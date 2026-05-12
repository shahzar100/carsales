"use client";
import { useState } from "react";
import { Lock, CheckCircle, Loader2 } from "lucide-react";
import TurnstileWidget from "@/components/Form/TurnstileWidget";

interface Props {
  carId: string;
  carLabel: string;
}

/**
 * (#30) Reserve-this-car form.
 *
 * No payment — customer's contact details are captured and the admin
 * calls back to arrange a cash deposit at the showroom. The car flips
 * to `reserved` server-side immediately so the listing reflects the
 * hold.
 *
 * Includes Turnstile (#17) for spam protection — invisible when the
 * env var isn't set so local dev keeps working.
 */
export default function ReserveCarForm({ carId, carLabel }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ ref: string; expires: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  if (success) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200 sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <h2 className="text-lg font-bold text-emerald-900">
              Reservation confirmed
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              Reference <strong>{success.ref}</strong>. We&apos;ll call you
              shortly to arrange a time. Please bring cash for the deposit when
              you visit.
            </p>
            <p className="mt-2 text-xs text-emerald-700">
              Reservation expires{" "}
              {new Date(success.expires).toLocaleString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              if a deposit hasn&apos;t been received.
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          customerInfo: { name, email, phone },
          notes: notes || undefined,
          turnstileToken,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error || "Couldn't create your reservation. Please try again.");
        return;
      }
      setSuccess({
        ref: body.data.reservationReference,
        expires: body.data.expiresAt,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
      <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-gray-900">
        <Lock className="h-5 w-5 text-red-600" />
        Reserve this car
      </h2>
      <p className="mb-5 text-sm text-gray-500">
        Take this <strong>{carLabel}</strong> off the market while you arrange
        finance or organise a visit. We&apos;ll call you to confirm — deposits
        are taken in person at the showroom.
      </p>

      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="reserve-name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Your name
          </label>
          <input
            id="reserve-name"
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div>
          <label
            htmlFor="reserve-phone"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Phone
          </label>
          <input
            id="reserve-phone"
            type="tel"
            required
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="reserve-email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="reserve-email"
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="reserve-notes"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Notes (optional)
          </label>
          <textarea
            id="reserve-notes"
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any questions, best times to call, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="sm:col-span-2">
          <TurnstileWidget onToken={setTurnstileToken} />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 disabled:opacity-60 sm:col-span-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Reserving…
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Reserve this car
            </>
          )}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-gray-500">
        No payment required online. Deposit handled in person at the showroom.
      </p>
    </div>
  );
}
