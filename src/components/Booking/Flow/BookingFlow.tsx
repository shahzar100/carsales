"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccountContact } from "@/hooks/useAccountContact";
import {
  ArrowRight,
  Award,
  CalendarCheck,
  CheckCircle,
  Droplets,
  MapPin,
  MessageSquareQuote,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import StepStrip from "./StepStrip";
import ServiceCard, { SERVICES, type ServiceKey } from "./ServiceCard";
import PackageCard, { type PackageCardData } from "./PackageCard";
import ContinueBar from "./ContinueBar";
import TitleBlock from "./TitleBlock";
import Dropdown from "../../Form/Dropdown";
import {
  FormInput,
  FormTextarea,
  InfoBanner,
  SummaryCard,
  SummaryRow,
} from "../../Form/FormPrimitives";
import TurnstileWidget from "../../Form/TurnstileWidget";
import { formatDate } from "@/lib/utils/format";
import type {
  DetailingPackage,
  TintOption,
} from "@/lib/interfaces";

// ── Helpers ──────────────────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[\d\s+()-]{7,20}$/;
const today = () => new Date().toISOString().split("T")[0];
const maxDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split("T")[0];
};
const capLength = (s: string) => s.slice(0, 1000);

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
].map((t) => ({ value: t, label: t }));

// Static repair sub-services — no admin-managed list exists for these.
const REPAIR_PACKAGES: Array<{ id: string; label: string; description: string }> =
  [
    {
      id: "engine",
      label: "Engine & Performance",
      description:
        "Diagnostics, timing belts, sensors, performance issues, and warning lights.",
    },
    {
      id: "brakes",
      label: "Brakes & Safety",
      description: "Pads, discs, fluid, ABS, handbrake, and full safety checks.",
    },
    {
      id: "electrical",
      label: "Electrical Systems",
      description:
        "Battery, alternator, starter motor, lighting, and electrical faults.",
    },
    {
      id: "transmission",
      label: "Transmission & Drivetrain",
      description:
        "Clutch, gearbox, driveshaft, differential, and CV joints.",
    },
    {
      id: "mot",
      label: "General Service / MOT",
      description: "Annual service, MOT prep, fluids, and routine maintenance.",
    },
  ];

// Map detailing packages from MongoDB into the local PackageCard shape.
function mapDetailingPackages(
  packages: DetailingPackage[]
): PackageCardData[] {
  const ICONS: LucideIcon[] = [Droplets, Sparkles, Award, ShieldCheck];
  return packages.map((p, i) => ({
    id: p.id,
    name: p.name,
    description: p.subtitle,
    duration: p.duration,
    price: p.price,
    recommended: p.popular,
    icon: ICONS[i] ?? Sparkles,
    includes: [...p.exteriorFeatures, ...p.interiorFeatures].slice(0, 4),
  }));
}

function mapTintOptions(tints: TintOption[]): PackageCardData[] {
  return tints.map((t) => ({
    id: t.name,
    name: t.name,
    description: t.description,
    duration: t.warranty,
    price: t.price,
    recommended: t.popular,
    icon: ShieldCheck,
    includes: t.features.slice(0, 4),
  }));
}

function mapRepairs(): PackageCardData[] {
  return REPAIR_PACKAGES.map((r) => ({
    id: r.id,
    name: r.label,
    description: r.description,
    duration: "1–2 days",
    price: "Quote",
    icon: Award,
  }));
}

// ── Form state ───────────────────────────────────────────────
interface BookingState {
  service: ServiceKey | null;
  packageId: string;
  serviceDetails: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleReg: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  purpose: "book" | "quote";
}

const INITIAL: BookingState = {
  service: null,
  packageId: "",
  serviceDetails: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleReg: "",
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  purpose: "book",
};

const SERVICE_LABELS: Record<ServiceKey, string> = {
  detailing: "Detailing",
  tints: "Window Tint",
  repairs: "Repair",
};

interface BookingFlowProps {
  detailingPackages: DetailingPackage[];
  tintOptions: TintOption[];
}

export default function BookingFlow({
  detailingPackages,
  tintOptions,
}: BookingFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillRaw = searchParams.get("service");
  const prefillService: ServiceKey | null =
    prefillRaw === "detailing" ||
    prefillRaw === "tints" ||
    prefillRaw === "repairs"
      ? prefillRaw
      : null;

  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingState>({
    ...INITIAL,
    service: prefillService,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [prefillDismissed, setPrefillDismissed] = useState(false);

  const update = useCallback(<K extends keyof BookingState>(field: K, value: BookingState[K]) => {
    setError(null);
    setData((prev) => ({
      ...prev,
      [field]: typeof value === "string" ? (capLength(value as string) as BookingState[K]) : value,
    }));
  }, []);

  // Prefill name + email from the signed-in account (this flow sits
  // behind BookingAuthGate, so the session is authenticated by the time
  // it renders). The email field in Step 5 is locked to match — the API
  // forces customerInfo.email to the account email regardless.
  const account = useAccountContact();
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      ...(account.name ? { name: account.name } : {}),
      ...(account.email ? { email: account.email } : {}),
    }));
  }, [account.name, account.email]);

  // ── Per-service package data ───────────────────────────────
  const packages = useMemo<PackageCardData[]>(() => {
    if (data.service === "detailing")
      return mapDetailingPackages(detailingPackages);
    if (data.service === "tints") return mapTintOptions(tintOptions);
    if (data.service === "repairs") return mapRepairs();
    return [];
  }, [data.service, detailingPackages, tintOptions]);

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === data.packageId) ?? null,
    [packages, data.packageId]
  );
  const selectedService = useMemo(
    () => SERVICES.find((s) => s.key === data.service) ?? null,
    [data.service]
  );

  // ── Step navigation ────────────────────────────────────────
  const goNext = useCallback(() => {
    setError(null);
    setStep((s) => Math.min(5, s + 1));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }, []);

  const handleStep1Continue = () => {
    if (!data.service) {
      setError("Please pick a service first.");
      return;
    }
    // Reset packageId when changing service so we don't carry across.
    goNext();
  };

  const handleStep2Continue = () => {
    if (!data.packageId) {
      setError("Please pick a package to continue.");
      return;
    }
    goNext();
  };

  const currentYear = new Date().getFullYear();
  const validateVehicle = () => {
    if (!data.vehicleMake.trim()) return "Vehicle make is required";
    if (!data.vehicleModel.trim()) return "Vehicle model is required";
    if (!data.vehicleYear) return "Vehicle year is required";
    const y = Number(data.vehicleYear);
    if (y < 1900 || y > currentYear + 1)
      return `Year must be between 1900 and ${currentYear + 1}`;
    return null;
  };

  const validateSchedule = () => {
    if (data.purpose === "quote") return null;
    if (!data.date) return "Please select a date";
    if (data.date < today()) return "Date cannot be in the past";
    if (!data.time) return "Please select a time";
    return null;
  };

  const validateContact = () => {
    if (!data.name.trim()) return "Full name is required";
    if (!data.email.trim()) return "Email address is required";
    if (!emailRegex.test(data.email)) return "Please enter a valid email address";
    if (!data.phone.trim()) return "Phone number is required";
    if (!phoneRegex.test(data.phone)) return "Please enter a valid phone number";
    return null;
  };

  const handleStep3Continue = () => {
    const err = validateVehicle();
    if (err) {
      setError(err);
      return;
    }
    goNext();
  };

  const handleStep4Continue = () => {
    const err = validateSchedule();
    if (err) {
      setError(err);
      return;
    }
    goNext();
  };

  // ── Submission ─────────────────────────────────────────────
  const submit = async () => {
    const err = validateContact();
    if (err) {
      setError(err);
      return;
    }
    if (!selectedService || !selectedPackage) {
      setError("Selection is incomplete — please go back.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
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
        setBookingRef(result.data.quoteReference);
      } else {
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
        setBookingRef(result.data.bookingReference);
      }
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Skip the date/time step when the purpose is a quote.
  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return "Choose your service";
      case 2:
        return "Choose your package";
      case 3:
        return "Tell us about your vehicle";
      case 4:
        return data.purpose === "quote"
          ? "Your contact details"
          : "When suits you best?";
      case 5:
        return "Confirm your booking";
      default:
        return "";
    }
  }, [step, data.purpose]);

  // For "quote" purpose, step 4 collapses into the contact step.
  // We render whichever block matches `step`; rather than a separate
  // route table, we branch inside the renderer.

  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full flex-col bg-white">
      <StepStrip
        step={step}
        title={stepTitle}
        onBack={step > 1 ? goBack : undefined}
      />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-14 sm:px-6">
        {step === 1 && (
          <Step1
            prefill={prefillService && !prefillDismissed ? prefillService : null}
            onPrefillChange={() => setPrefillDismissed(true)}
            selected={data.service}
            onSelect={(k) => {
              // Changing the service must reset the package selection.
              setData((d) => ({ ...d, service: k, packageId: "" }));
              setError(null);
            }}
            onContinue={handleStep1Continue}
            error={error}
          />
        )}

        {step === 2 && selectedService && (
          <Step2
            service={selectedService.key}
            serviceName={selectedService.name}
            packages={packages}
            selectedId={data.packageId}
            onSelect={(id) => {
              update("packageId", id);
            }}
            onContinue={handleStep2Continue}
            error={error}
          />
        )}

        {step === 3 && (
          <Step3
            data={data}
            update={update}
            currentYear={currentYear}
            onContinue={handleStep3Continue}
            error={error}
          />
        )}

        {step === 4 && (
          <Step4
            data={data}
            update={update}
            onContinue={handleStep4Continue}
            onTogglePurpose={(p) =>
              setData((d) => ({ ...d, purpose: p, date: "", time: "" }))
            }
            error={error}
          />
        )}

        {step === 5 && selectedService && selectedPackage && (
          <Step5
            data={data}
            update={update}
            service={SERVICE_LABELS[selectedService.key]}
            packageName={selectedPackage.name}
            packagePrice={selectedPackage.price}
            onSubmit={submit}
            submitting={submitting}
            submitted={submitted}
            bookingRef={bookingRef}
            setTurnstileToken={setTurnstileToken}
            error={error}
            onReturnHome={() => router.push("/")}
          />
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Step 1 — Service selection
// ═════════════════════════════════════════════════════════════
function Step1({
  prefill,
  onPrefillChange,
  selected,
  onSelect,
  onContinue,
  error,
}: {
  prefill: ServiceKey | null;
  onPrefillChange: () => void;
  selected: ServiceKey | null;
  onSelect: (k: ServiceKey) => void;
  onContinue: () => void;
  error: string | null;
}) {
  const selectedService =
    SERVICES.find((s) => s.key === selected) ?? null;

  const prefillName = prefill
    ? SERVICES.find((s) => s.key === prefill)?.name
    : undefined;

  return (
    <>
      <TitleBlock
        eyebrow="Book A Service"
        title={
          <>
            What can we{" "}
            <span className="text-red-600">do for you</span> today?
          </>
        }
        subtitle="Pick a service to get started. You can change your mind at the next step — and our team will confirm everything before you commit to a date."
        prefillLabel={prefillName}
        onPrefillChange={prefill ? onPrefillChange : undefined}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        {SERVICES.map((s) => (
          <ServiceCard
            key={s.key}
            service={s}
            selected={selected === s.key}
            onSelect={() => onSelect(s.key)}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
      )}

      {selectedService && (
        <ContinueBar
          label="Selected"
          value={`${selectedService.name} · from ${selectedService.fromPrice}`}
          icon={selectedService.icon}
          buttonLabel="Continue to package"
          onContinue={onContinue}
        />
      )}

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-gray-600">
          <ShieldCheck className="h-4 w-4 text-red-600" /> No deposit required
        </span>
        <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-gray-600">
          <RotateCcw className="h-4 w-4 text-red-600" /> Free reschedule up to
          24h
        </span>
        <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-gray-600">
          <MapPin className="h-4 w-4 text-red-600" /> Leeds workshop · LS11
        </span>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// Step 2 — Package selection
// ═════════════════════════════════════════════════════════════
function Step2({
  service,
  serviceName,
  packages,
  selectedId,
  onSelect,
  onContinue,
  error,
}: {
  service: ServiceKey;
  serviceName: string;
  packages: PackageCardData[];
  selectedId: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
  error: string | null;
}) {
  const selected = packages.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <TitleBlock
        eyebrow={`Step 2 · ${serviceName}`}
        title={
          <>
            Pick the <span className="text-red-600">level of detail</span>
          </>
        }
        subtitle={
          service === "detailing"
            ? "All packages carried out by hand at our LS11 workshop. Prices include parking, full valet, and a complimentary courtesy car wash on collection."
            : service === "tints"
              ? "Pick the film grade that suits you. All installs are dust-free, with bubble-free curing in our temperature-controlled bay."
              : "Pick the area we need to look at. We'll confirm a quote once our technician has had eyes on your vehicle."
        }
      />

      <div className="mt-1 mb-3 flex items-center gap-3">
        <h2 className="m-0 text-[15px] font-bold tracking-tight text-gray-900">
          Packages
        </h2>
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-[11px] font-semibold tracking-[0.08em] text-gray-400 uppercase">
          {packages.length} options
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {packages.map((p) => (
          <PackageCard
            key={p.id}
            pkg={p}
            selected={selectedId === p.id}
            onSelect={() => onSelect(p.id)}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
      )}

      {selected && (
        <ContinueBar
          label={`${selected.duration} · ${serviceName}`}
          value={`${selected.name} · ${selected.price}`}
          icon={selected.icon}
          buttonLabel="Continue to vehicle"
          onContinue={onContinue}
        />
      )}

      <div className="bk-help-row">
        <span className="ic">
          <Phone className="h-4 w-4" />
        </span>
        <span>
          <strong>Not sure which one?</strong> Our team is on the floor 8am–6pm.
          Call or message us for a recommendation.
        </span>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// Step 3 — Vehicle info
// ═════════════════════════════════════════════════════════════
function Step3({
  data,
  update,
  currentYear,
  onContinue,
  error,
}: {
  data: BookingState;
  update: <K extends keyof BookingState>(f: K, v: BookingState[K]) => void;
  currentYear: number;
  onContinue: () => void;
  error: string | null;
}) {
  return (
    <>
      <TitleBlock
        eyebrow="Step 3 · Vehicle"
        title={
          <>
            Tell us about <span className="text-red-600">your car</span>
          </>
        }
        subtitle="A few details so we can prepare the right parts and products before you arrive."
      />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Make"
              value={data.vehicleMake}
              onChange={(v) => update("vehicleMake", v)}
              placeholder="e.g. BMW"
              required
            />
            <FormInput
              label="Model"
              value={data.vehicleModel}
              onChange={(v) => update("vehicleModel", v)}
              placeholder="e.g. 3 Series"
              required
            />
            <FormInput
              label="Year"
              type="number"
              value={data.vehicleYear}
              onChange={(v) => update("vehicleYear", v)}
              placeholder={`e.g. ${currentYear}`}
              min="1900"
              max={String(currentYear + 1)}
              required
            />
            <FormInput
              label="Registration (optional)"
              value={data.vehicleReg}
              onChange={(v) => update("vehicleReg", v)}
              placeholder="e.g. AB12 CDE"
            />
          </div>

          <div className="mt-4">
            <FormTextarea
              label="Anything else we should know? (optional)"
              value={data.serviceDetails}
              onChange={(v) => update("serviceDetails", v)}
              placeholder="Describe any issue, area of concern, or special request..."
              rows={3}
            />
          </div>

          <div className="mt-5">
            <InfoBanner variant="info">
              Providing your registration plate helps us prepare the correct
              parts and materials before your appointment.
            </InfoBanner>
          </div>

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
            >
              Continue
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// Step 4 — Date / time (or skipped to contact for quote path)
// ═════════════════════════════════════════════════════════════
function Step4({
  data,
  update,
  onContinue,
  onTogglePurpose,
  error,
}: {
  data: BookingState;
  update: <K extends keyof BookingState>(f: K, v: BookingState[K]) => void;
  onContinue: () => void;
  onTogglePurpose: (p: "book" | "quote") => void;
  error: string | null;
}) {
  return (
    <>
      <TitleBlock
        eyebrow="Step 4 · Schedule"
        title={
          data.purpose === "quote" ? (
            <>
              Get a <span className="text-red-600">written quote</span>
            </>
          ) : (
            <>
              Pick a <span className="text-red-600">slot</span>
            </>
          )
        }
        subtitle={
          data.purpose === "quote"
            ? "We'll get a written quote back to you within one business day."
            : "Most appointments confirmed within the hour during workshop hours."
        }
      />

      <div className="mx-auto max-w-2xl">
        {/* Purpose toggle — Book vs Quote */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onTogglePurpose("book")}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
              data.purpose === "book"
                ? "border-red-600 bg-red-50 text-red-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            Book a slot
          </button>
          <button
            type="button"
            onClick={() => onTogglePurpose("quote")}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
              data.purpose === "quote"
                ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <MessageSquareQuote className="h-4 w-4" />
            Get a quote
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          {data.purpose === "book" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Preferred Date"
                  type="date"
                  value={data.date}
                  onChange={(v) => update("date", v)}
                  min={today()}
                  max={maxDate()}
                  required
                />
                <Dropdown
                  label="Preferred Time"
                  placeholder="Select a time"
                  options={TIME_SLOTS}
                  value={data.time}
                  onChange={(v) => update("time", v)}
                  required
                />
              </div>
              {data.date && data.time && (
                <div className="mt-4">
                  <InfoBanner variant="info">
                    <strong>Your appointment:</strong>{" "}
                    {formatDate(data.date, "long")} at {data.time}.
                  </InfoBanner>
                </div>
              )}
            </>
          ) : (
            <InfoBanner variant="info">
              No date needed — just hop to the next step with your contact
              details and we&apos;ll come back with a written quote.
            </InfoBanner>
          )}

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
            >
              Continue to contact
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// Step 5 — Contact + Review + Submit (or success)
// ═════════════════════════════════════════════════════════════
function Step5({
  data,
  update,
  service,
  packageName,
  packagePrice,
  onSubmit,
  submitting,
  submitted,
  bookingRef,
  setTurnstileToken,
  error,
  onReturnHome,
}: {
  data: BookingState;
  update: <K extends keyof BookingState>(f: K, v: BookingState[K]) => void;
  service: string;
  packageName: string;
  packagePrice: string;
  onSubmit: () => void;
  submitting: boolean;
  submitted: boolean;
  bookingRef: string;
  setTurnstileToken: (t: string) => void;
  error: string | null;
  onReturnHome: () => void;
}) {
  if (submitted) {
    return (
      <>
        <TitleBlock
          eyebrow="Step 5 · Confirm"
          title={
            data.purpose === "quote" ? (
              <>
                Quote request <span className="text-red-600">sent</span>
              </>
            ) : (
              <>
                Booking <span className="text-red-600">confirmed</span>
              </>
            )
          }
        />

        <div className="mx-auto max-w-2xl">
          <div
            className={`rounded-2xl border-2 p-6 text-center sm:p-10 ${
              data.purpose === "quote"
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <CheckCircle
              className={`mx-auto mb-3 h-14 w-14 ${
                data.purpose === "quote" ? "text-amber-500" : "text-emerald-500"
              }`}
            />
            <h4
              className={`mb-1 text-lg font-bold ${
                data.purpose === "quote"
                  ? "text-amber-800"
                  : "text-emerald-800"
              }`}
            >
              {data.purpose === "quote"
                ? "Quote Request Submitted!"
                : "Service Booked!"}
            </h4>
            <p
              className={`text-sm ${
                data.purpose === "quote"
                  ? "text-amber-700"
                  : "text-emerald-700"
              }`}
            >
              Your reference number is{" "}
              <span className="font-mono font-bold tracking-wider">
                {bookingRef}
              </span>
            </p>
            <p
              className={`mt-2 text-xs ${
                data.purpose === "quote"
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {data.purpose === "quote"
                ? `We'll send a quote to ${data.email} shortly.`
                : `A confirmation email has been sent to ${data.email}.`}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={`/Booking/lookup?ref=${bookingRef}`}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
              >
                Track booking
              </a>
              <button
                type="button"
                onClick={onReturnHome}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
              >
                Back to home
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBlock
        eyebrow="Step 5 · Confirm"
        title={
          <>
            Your <span className="text-red-600">contact details</span>
          </>
        }
        subtitle="We'll send the confirmation and any updates to the email and phone you provide."
      />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Full Name"
              value={data.name}
              onChange={(v) => update("name", v)}
              placeholder="e.g. John Smith"
              required
            />
            <div>
              <FormInput
                label="Email Address"
                type="email"
                value={data.email}
                onChange={(v) => update("email", v)}
                placeholder="e.g. john@example.com"
                required
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                Your booking is linked to your account email.
              </p>
            </div>
            <FormInput
              label="Phone Number"
              type="tel"
              value={data.phone}
              onChange={(v) => update("phone", v)}
              placeholder="e.g. 07700 900000"
              required
            />
          </div>

          <div className="space-y-3">
            <SummaryCard title="Service">
              <SummaryRow label="Type" value={service} />
              <SummaryRow
                label="Package"
                value={`${packageName} · ${packagePrice}`}
              />
            </SummaryCard>

            <SummaryCard title="Vehicle">
              <SummaryRow
                label="Vehicle"
                value={`${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}`}
              />
              {data.vehicleReg && (
                <SummaryRow label="Registration" value={data.vehicleReg} />
              )}
            </SummaryCard>

            {data.purpose === "book" && data.date && data.time && (
              <SummaryCard title="Appointment">
                <SummaryRow label="Date" value={formatDate(data.date, "long")} />
                <SummaryRow label="Time" value={data.time} />
              </SummaryCard>
            )}
          </div>

          <div className="mt-4">
            <TurnstileWidget onToken={setTurnstileToken} />
          </div>

          <div className="mt-4">
            <InfoBanner variant="warning">
              {data.purpose === "quote" ? (
                <>
                  <strong>Please note:</strong> We aim to respond to all quote
                  requests within 24 hours.
                </>
              ) : (
                <>
                  <strong>Please note:</strong> Contact us at least 24 hours in
                  advance if you need to reschedule or cancel your appointment.
                </>
              )}
            </InfoBanner>
          </div>

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
          )}

          <div className="mt-6 flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>Submitting…</>
              ) : (
                <>
                  {data.purpose === "quote"
                    ? "Submit Quote Request"
                    : "Confirm Booking"}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

