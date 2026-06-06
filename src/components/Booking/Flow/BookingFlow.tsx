"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { useAccountContact } from "@/hooks/useAccountContact";
import StepStrip from "./StepStrip";
import { SERVICES, type ServiceKey } from "./ServiceCard";
import type { PackageCardData } from "./PackageCard";
import type { DetailingPackage, TintOption } from "@/lib/interfaces";
import Step1Service from "./Step1_Service";
import Step2Package from "./Step2_Package";
import Step3Vehicle from "./Step3_Vehicle";
import Step4Schedule from "./Step4_Schedule";
import Step5Confirm from "./Step5_Confirm";
import {
  INITIAL,
  SERVICE_LABELS,
  capLength,
  mapDetailingPackages,
  mapRepairs,
  mapTintOptions,
  type BookingState,
} from "./bookingFlowTypes";
import {
  submitBooking,
  validateContact,
  validateSchedule,
  validateVehicle,
} from "./bookingFlowSubmit";

interface BookingFlowProps {
  detailingPackages: DetailingPackage[];
  tintOptions: TintOption[];
}

// Orchestrator — owns the full wizard state machine (current step,
// transition direction, form data, validation errors, submission state,
// reference number). Each step is rendered by a focused child component
// that receives the slice of state it needs via props and emits changes
// back through callbacks.
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
  // +1 = moving forward, -1 = moving back. Drives the slide direction.
  const [direction, setDirection] = useState(1);
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

  const update = useCallback(
    <K extends keyof BookingState>(field: K, value: BookingState[K]) => {
      setError(null);
      setData((prev) => ({
        ...prev,
        [field]:
          typeof value === "string"
            ? (capLength(value as string) as BookingState[K])
            : value,
      }));
    },
    []
  );

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
    setDirection(1);
    setStep((s) => Math.min(5, s + 1));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1));
  }, []);

  // Each per-step continue handler validates the relevant slice of state
  // and advances on success — keeping the actual rule checks in the
  // bookingFlowSubmit helpers so this file stays focused on wiring.
  const currentYear = new Date().getFullYear();

  const handleStep1Continue = () => {
    if (!data.service) {
      setError("Please pick a service first.");
      return;
    }
    goNext();
  };

  const handleStep2Continue = () => {
    if (!data.packageId) {
      setError("Please pick a package to continue.");
      return;
    }
    goNext();
  };

  const handleStep3Continue = () => {
    const err = validateVehicle(data, currentYear);
    if (err) return setError(err);
    goNext();
  };

  const handleStep4Continue = () => {
    const err = validateSchedule(data);
    if (err) return setError(err);
    goNext();
  };

  // ── Submission ─────────────────────────────────────────────
  const submit = async () => {
    const err = validateContact(data);
    if (err) return setError(err);
    if (!selectedService || !selectedPackage) {
      setError("Selection is incomplete — please go back.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const ref = await submitBooking({
        data,
        selectedService,
        selectedPackage,
        turnstileToken,
      });
      setBookingRef(ref);
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

  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full flex-col bg-white">
      <StepStrip
        step={step}
        title={stepTitle}
        onBack={step > 1 ? goBack : undefined}
      />

      <div className="mx-auto w-full max-w-7xl flex-1 overflow-hidden px-4 pb-14 sm:px-6">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <m.div
            key={step}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 1 && (
              <Step1Service
                prefill={
                  prefillService && !prefillDismissed ? prefillService : null
                }
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
              <Step2Package
                service={selectedService.key}
                serviceName={selectedService.name}
                packages={packages}
                selectedId={data.packageId}
                onSelect={(id) => update("packageId", id)}
                onContinue={handleStep2Continue}
                error={error}
              />
            )}

            {step === 3 && (
              <Step3Vehicle
                data={data}
                update={update}
                currentYear={currentYear}
                onContinue={handleStep3Continue}
                error={error}
              />
            )}

            {step === 4 && (
              <Step4Schedule
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
              <Step5Confirm
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
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
