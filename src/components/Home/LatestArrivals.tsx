"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { m } from "motion/react";
import type { CarInterface } from "@/lib/interfaces";
import { formatPrice, formatMileage } from "@/lib/utils/format";

/**
 * Homepage "Latest Arrivals" grid — the dark dealership card row from the
 * Morley Motors design bundle. Presentational: the homepage server
 * component fetches the cars (getLatestCars) and passes them in.
 *
 * Renders nothing when there's no stock, so the section doesn't collapse
 * into an empty header on a fresh database.
 */
export default function LatestArrivals({ cars }: { cars: CarInterface[] }) {
  if (cars.length === 0) return null;

  return (
    <section className="border-t border-white/[0.06] bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-end justify-between gap-4"
        >
          <h2 className="text-[28px] font-bold tracking-tight text-white">
            Latest Arrivals
          </h2>
          <m.div whileHover={{ x: 3 }} whileTap={{ scale: 0.96 }}>
            <Link
              href="/BrowseFleet"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-red-400 underline-offset-4 transition-colors hover:text-red-300 hover:underline"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </m.div>
        </m.div>

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {cars.map((car) => (
            <m.div
              key={String(car._id)}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={`/BrowseFleet/${car._id}`}
                className="group block overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]"
              >
                <div className="relative aspect-16/10 overflow-hidden bg-[#171717]">
                  <Image
                    src={car.image || "/tesla.webp"}
                    alt={`${car.make} ${car.model}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
                </div>
                <div className="p-4">
                  <div className="text-[11px] tracking-[0.14em] text-gray-500 uppercase">
                    {car.year}
                  </div>
                  <div className="mt-1 truncate font-bold text-white">
                    {car.make} {car.model}
                  </div>
                  <div className="mt-1 text-[12.5px] text-gray-400">
                    {formatMileage(car.mileage)} miles  •  {car.colour}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[16px] font-extrabold text-red-400">
                      {formatPrice(car.price)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-white transition-colors group-hover:text-red-400">
                      Details
                      <ArrowRight
                        size={13}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </div>
              </Link>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
