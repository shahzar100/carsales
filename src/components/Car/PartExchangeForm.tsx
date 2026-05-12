"use client";
import { useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import TurnstileWidget from "@/components/Form/TurnstileWidget";

interface Props {
  carId: string;
  carLabel: string;
}

/**
 * (#31) Part-exchange enquiry form.
 *
 * Collapsed by default so it doesn't dominate the car detail page —
 * users who care about trade-in expand it deliberately. We capture
 * enough to give an indicative valuation: reg / make / model / year /
 * mileage / condition / service history.
 *
 * Reg-lookup against the DVLA API isn't wired up yet (#31 follow-up);
 * customers type the make/model themselves for now.
 */
export default function PartExchangeForm({ carId, carLabel }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    registration: "",
    make: "",
    model: "",
    year: "",
    mileage: "",
    condition: "Good" as "Excellent" | "Good" | "Fair" | "Poor",
    serviceHistory: "" as "" | "Full" | "Partial" | "None",
    notes: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200 sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <h2 className="text-lg font-bold text-emerald-900">
              Enquiry sent
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              Reference <strong>{success}</strong>. We&apos;ll come back to you
              within 24 hours with an indicative part-exchange valuation.
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
      const res = await fetch("/api/bookings/part-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerInfo: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
          vehicle: {
            registration: form.registration || undefined,
            make: form.make,
            model: form.model,
            year: Number(form.year),
            mileage: Number(form.mileage),
            condition: form.condition,
            serviceHistory: form.serviceHistory || undefined,
            notes: form.notes || undefined,
          },
          interestedInCarId: carId,
          interestedInCarLabel: carLabel,
          turnstileToken,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error || "Couldn't send your enquiry. Please try again.");
        return;
      }
      setSuccess(body.data.enquiryReference);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-6 text-left sm:p-8"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-5 w-5 text-red-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Part-Exchange your current car
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Tell us about your vehicle and we&apos;ll come back with an
              indicative valuation against this {carLabel}.
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
        )}
      </button>

      {expanded && (
        <form
          className="grid gap-4 border-t border-gray-100 p-6 sm:grid-cols-2 sm:p-8"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Your name
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              required
              maxLength={20}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              maxLength={254}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="my-2 text-sm font-semibold text-gray-700">
              Your current vehicle
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Registration (optional)
            </label>
            <input
              type="text"
              maxLength={20}
              value={form.registration}
              onChange={(e) =>
                update("registration", e.target.value.toUpperCase())
              }
              placeholder="AB12 CDE"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Make
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={form.make}
              onChange={(e) => update("make", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Model
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Year
            </label>
            <input
              type="number"
              required
              min={1980}
              max={new Date().getFullYear() + 1}
              value={form.year}
              onChange={(e) => update("year", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mileage
            </label>
            <input
              type="number"
              required
              min={0}
              value={form.mileage}
              onChange={(e) => update("mileage", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Condition
            </label>
            <select
              value={form.condition}
              onChange={(e) =>
                update(
                  "condition",
                  e.target.value as typeof form.condition
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Service history
            </label>
            <select
              value={form.serviceHistory}
              onChange={(e) =>
                update(
                  "serviceHistory",
                  e.target.value as typeof form.serviceHistory
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="">Not specified</option>
              <option value="Full">Full</option>
              <option value="Partial">Partial</option>
              <option value="None">None</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Anything else we should know? (optional)
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Modifications, damage, outstanding finance, etc."
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
                Sending…
              </>
            ) : (
              <>
                <ArrowLeftRight className="h-4 w-4" />
                Request a valuation
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
