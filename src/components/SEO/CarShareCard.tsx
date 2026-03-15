"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CarInterface } from "@/lib/interfaces";
import ShareButton from "@/components/SEO/ShareButton";
import {
  Fuel,
  Gauge,
  Cog,
  Calendar,
  Eye,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CarShareCard                                                      */
/*  A beautiful, self-contained share card for a car listing.         */
/*  Can be used inline (embedded) or as a popup modal.                */
/* ------------------------------------------------------------------ */

interface CarShareCardProps {
  car: CarInterface;
  /** Base URL of the site (defaults to window.location.origin) */
  baseUrl?: string;
  /** Render mode */
  mode?: "inline" | "modal";
  /** Called when the modal close button is clicked */
  onClose?: () => void;
}

const CarShareCard: React.FC<CarShareCardProps> = ({
  car,
  baseUrl,
  mode = "inline",
  onClose,
}) => {
  const resolvedBase =
    baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");

  const carUrl = `${resolvedBase}/BrowseFleet/${car._id}`;
  const carTitle = `${car.year} ${car.make} ${car.model}`;
  const carPrice = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(car.price);

  const shareText = `Check out this ${carTitle} — ${car.fuel}, ${car.transmission}, ${car.mileage.toLocaleString()} miles — ${carPrice}`;

  const quickSpecs = [
    { icon: Calendar, value: car.year.toString(), label: "Year" },
    {
      icon: Gauge,
      value: `${car.mileage.toLocaleString()} mi`,
      label: "Mileage",
    },
    { icon: Fuel, value: car.fuel, label: "Fuel" },
    { icon: Cog, value: car.transmission, label: "Trans" },
  ];

  const card = (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-200">
      {/* Image banner */}
      <div className="relative aspect-video w-full bg-gray-100">
        <Image
          src={car.image || "/tesla.webp"}
          alt={carTitle}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 420px"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/70 to-transparent" />

        {/* Price badge */}
        <div className="absolute bottom-4 left-4">
          <span className="rounded-lg bg-white/95 px-3 py-1.5 text-lg font-extrabold text-gray-900 shadow-md backdrop-blur-sm">
            {carPrice}
          </span>
        </div>

        {/* Status badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm ${
              car.status === "available"
                ? "bg-emerald-500 text-white"
                : car.status === "reserved"
                  ? "bg-amber-500 text-white"
                  : "bg-red-500 text-white"
            }`}
          >
            {car.status}
          </span>
        </div>

        {/* Close button (modal mode) */}
        {mode === "modal" && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900">{carTitle}</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          {car.colour} • {car.doors} doors
        </p>

        {/* Quick specs */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {quickSpecs.map((spec) => (
            <div
              key={spec.label}
              className="flex flex-col items-center rounded-xl bg-gray-50 px-2 py-2.5"
            >
              <spec.icon className="mb-1 h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-800">
                {spec.value}
              </span>
              <span className="text-[10px] text-gray-400">{spec.label}</span>
            </div>
          ))}
        </div>

        {/* Actions row */}
        <div className="mt-5 flex items-center gap-3">
          <a
            href={carUrl}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md active:scale-[0.98]"
          >
            <Eye className="h-4 w-4" />
            View Details
          </a>
          <ShareButton
            url={carUrl}
            title={carTitle}
            text={shareText}
            variant="outline"
            size="md"
          />
        </div>
      </div>
    </div>
  );

  /* Modal wrapper */
  if (mode === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm animate-in zoom-in-95 fade-in duration-200">
          {card}
        </div>
      </div>
    );
  }

  return card;
};

/* ------------------------------------------------------------------ */
/*  CarShareModal — thin wrapper to trigger the modal from a button   */
/* ------------------------------------------------------------------ */

export const CarShareModal: React.FC<{
  car: CarInterface;
  baseUrl?: string;
  trigger?: React.ReactNode;
}> = ({ car, baseUrl, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {trigger ? (
        <span onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
          aria-label={`Share ${car.make} ${car.model}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share
        </button>
      )}

      {isOpen && (
        <CarShareCard
          car={car}
          baseUrl={baseUrl}
          mode="modal"
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default CarShareCard;
