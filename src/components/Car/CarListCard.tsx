"use client";
import React from "react";
import { CarInterface } from "@/lib/interfaces";
import Image from "next/image";
import Link from "next/link";
import { m } from "motion/react";
import {
  Fuel,
  Gauge,
  Car,
  Palette,
  Calendar,
  Cog,
  Eye,
  Star,
} from "lucide-react";
import CarActions from "@/components/Admin/Navigation/CarActions";
import FeaturedToggle from "@/components/Admin/Navigation/FeaturedToggle";
import ShareButton from "@/components/SEO/ShareButton";
import SaveCarButton from "@/components/Car/SaveCarButton";
import { formatPrice, formatMileage, formatDate } from "@/lib/utils/format";

interface CarListCardProps {
  car: CarInterface;
  variant?: "customer" | "admin";
  /**
   * Hint to the renderer that this card sits above the fold (typically
   * the first card in a list). When true the thumbnail uses `priority`
   * so it's discovered eagerly and contributes to LCP instead of being
   * lazy-loaded.
   */
  priority?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "sold":
      return "bg-red-100 text-red-700 border-red-200";
    case "reserved":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const CarListCard: React.FC<CarListCardProps> = ({
  car,
  variant = "customer",
  priority = false,
}) => {
  const isAdmin = variant === "admin";

  const specs = [
    { icon: Fuel, label: car.fuel, color: "text-emerald-600" },
    { icon: Cog, label: car.transmission, color: "text-blue-600" },
    { icon: Car, label: `${car.doors} doors`, color: "text-gray-600" },
    { icon: Palette, label: car.colour, color: "text-rose-600" },
  ];

  const cardContent = (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      whileHover={!isAdmin ? { y: -4 } : undefined}
      className={`group rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-shadow duration-300 ${
        !isAdmin ? "hover:shadow-lg hover:ring-gray-300" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden rounded-tl-2xl rounded-tr-2xl sm:aspect-auto sm:h-auto sm:w-64 sm:rounded-tr-none sm:rounded-bl-2xl md:w-72 lg:w-80">
          <Image
            src={car.image || "/tesla.webp"}
            alt={`${car.make} ${car.model}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 320px"
            priority={priority}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent sm:bg-linear-to-r" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {isAdmin && (
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${getStatusColor(car.status)}`}
              >
                {car.status}
              </span>
            )}
            {car.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </span>
            )}
          </div>

          {/* Save (heart) toggle — customer-only, top right corner. */}
          {!isAdmin && car._id && (
            <div className="absolute top-3 right-3">
              <SaveCarButton carId={String(car._id)} />
            </div>
          )}

          {/* Price badge on mobile */}
          <div className="absolute right-3 bottom-3 sm:hidden">
            <span className="rounded-lg bg-black/80 px-3 py-1.5 text-lg font-bold text-white backdrop-blur-sm">
              {formatPrice(car.price)}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
          {/* Top Row: Title + Price */}
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
                {car.make} {car.model}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>{car.year}</span>
                <span className="text-gray-300">•</span>
                <Gauge className="h-3.5 w-3.5" />
                <span>{formatMileage(car.mileage)} miles</span>
              </div>
            </div>
            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-2xl font-extrabold text-gray-900">
                {formatPrice(car.price)}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {formatMileage(car.mileage)} mi
              </p>
            </div>
          </div>

          {/* Specs Row */}
          <div className="mb-4 flex flex-wrap gap-2">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 ring-1 ring-gray-100"
              >
                <spec.icon className={`h-3.5 w-3.5 shrink-0 ${spec.color}`} />
                <span className="text-xs font-medium text-gray-700">
                  {spec.label}
                </span>
              </div>
            ))}
          </div>

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {car.features.slice(0, 5).map((feature) => (
                <span
                  key={feature}
                  className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-red-100"
                >
                  {feature}
                </span>
              ))}
              {car.features.length > 5 && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
                  +{car.features.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Description (customer only, if available) */}
          {!isAdmin && car.description && (
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-500">
              {car.description}
            </p>
          )}

          {/* Bottom Row: Actions */}
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            {isAdmin ? (
              <>
                {/* Admin: Featured toggle + Actions */}
                <div className="flex items-center gap-3">
                  <FeaturedToggle car={car} />
                  <span className="text-xs text-gray-400">
                    Added {formatDate(car.createdAt)}
                  </span>
                </div>
                <CarActions car={car} />
              </>
            ) : (
              <>
                {/* Customer: View Details button */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      car.status === "available"
                        ? "bg-emerald-500"
                        : car.status === "reserved"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="capitalize">{car.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShareButton
                    url={`/BrowseFleet/${car._id}`}
                    title={`${car.year} ${car.make} ${car.model}`}
                    text={`Check out this ${car.year} ${car.make} ${car.model} — ${car.fuel}, ${car.transmission}, ${formatMileage(car.mileage)} miles — ${formatPrice(car.price)}`}
                    variant="icon"
                    size="sm"
                  />
                  <m.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                    <Link
                      href={`/BrowseFleet/${car._id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                  </m.div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </m.div>
  );

  return cardContent;
};

export default CarListCard;
