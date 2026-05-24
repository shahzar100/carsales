import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Car,
  Clock,
  Eye,
  Search,
  Star,
} from "lucide-react";
import FeaturedCarBookingButton from "./UI/FeaturedCarBookingButton";
import Image from "next/image";
import { getFeaturedCar } from "@/lib/models";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { formatPrice, formatMileage } from "@/lib/utils/format";
import { HeroFadeIn, HeroStatCard } from "./HeroMotion";

const HeroSection = async () => {
  const [featuredCar, businessInfo] = await Promise.all([
    getFeaturedCar(),
    getBusinessInfo(),
  ]);
  const stats = businessInfo.heroStats;
  // Some legacy seed data still points at /images/cars/*.jpg paths that
  // were never copied into /public, which produces 404 spam in the server
  // log and a broken hero image. Treat those as missing and fall back to
  // the bundled placeholder.
  const heroImageSrc =
    featuredCar?.image && !featuredCar.image.startsWith("/images/cars/")
      ? featuredCar.image
      : "/tesla.webp";
  return (
    <section className="relative z-50 overflow-hidden bg-black text-white">
      {/* Ambient red glow — top-right */}
      <div className="pointer-events-none absolute -top-32 right-0 h-125 w-125 rounded-full bg-red-600/5 blur-3xl" />

      <div className="container mx-auto px-4 py-14 sm:px-6 sm:py-20 lg:py-28">
        <div
          className={`mx-auto grid max-w-7xl items-center gap-8 sm:gap-10 ${featuredCar?.make ? "lg:grid-cols-2" : "lg:grid-cols-1"} lg:gap-16`}
        >
          {/* Left Column - Content */}
          <div
            className={`${featuredCar?.make ? "text-center lg:text-left" : "text-center"}`}
          >
            {/* New-arrivals eyebrow pill */}
            <HeroFadeIn delay={0} y={8}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-gray-300 uppercase">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                New arrivals every week
              </div>
            </HeroFadeIn>
            {/* Main Heading */}
            <HeroFadeIn delay={0.1}>
              <h1
                className={`${featuredCar?.make ? "mb-6 text-3xl leading-[1.1] font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl" : "mb-10 text-3xl leading-[1.1] font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl"}`}
              >
                Find Your Perfect Car
                <span className="mt-2 block bg-linear-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                  Book a Viewing Today
                </span>
              </h1>
            </HeroFadeIn>
            {/* Subtitle */}
            <HeroFadeIn delay={0.2}>
              <p
                className={`${featuredCar?.make ? "max-w-xl" : "mx-auto max-w-2xl"} text-base leading-relaxed text-gray-400 sm:text-lg`}
              >
                Browse our premium collection of vehicles and schedule convenient
                viewing appointments. Experience quality cars with expert
                guidance.
              </p>
            </HeroFadeIn>

            {/* CTA Button — below subtitle on desktop when featured car exists */}
            {featuredCar?.make && (
              <div className="mt-8 hidden lg:block">
                <Link
                  href="/BrowseFleet"
                  className="group inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/30"
                >
                  <Search size={16} />
                  Browse All Cars
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            )}
          </div>

          {/* Right Column - Featured Car */}
          {featuredCar?.make && (
            <div className="relative">
              <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-white/6 to-white/2 shadow-2xl ring-1 shadow-black/40 ring-white/5">
                {/* Car Image — full-bleed with overlay */}
                <div className="group relative">
                  <div className="relative aspect-16/10 w-full">
                    <Image
                      src={heroImageSrc}
                      alt={`${featuredCar.make} ${featuredCar.model}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    {/* Bottom gradient fade into card */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/80 to-transparent" />
                  </div>

                  {/* Featured Badge — overlaid on image */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                    <Star size={12} />
                    Featured
                  </div>
                </div>

                {/* Car Details */}
                <div className="space-y-4 p-5 sm:p-6">
                  <div>
                    <h3 className="text-lg font-bold text-white sm:text-xl">
                      {featuredCar
                        ? `${featuredCar.year} ${featuredCar.make} ${featuredCar.model}`
                        : "2023 BMW X5"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {featuredCar &&
                        `${featuredCar.doors} Door  •  ${featuredCar.fuel}  •  ${featuredCar.colour}`}
                    </p>
                  </div>

                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-white">
                      {featuredCar && formatPrice(featuredCar.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {featuredCar &&
                        `${formatMileage(featuredCar.mileage)} miles`}
                    </span>
                  </div>

                  {/* Quick info pills */}
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300 ring-1 ring-white/10">
                      <Eye size={12} className="text-red-400" />
                      Available for viewing
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300 ring-1 ring-white/10">
                      <Clock size={12} className="text-red-400" />
                      Book today
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex w-full gap-3 pt-1">
                    <Link
                      href={
                        featuredCar
                          ? `/BrowseFleet/${featuredCar._id}`
                          : "/BrowseFleet"
                      }
                      className="flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:border-white/20 hover:bg-white/10"
                    >
                      View Details
                    </Link>
                    <FeaturedCarBookingButton car={featuredCar} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Button — centered (no featured car, or mobile) */}
        <div
          className={`mt-10 flex w-full justify-center ${featuredCar?.make ? "lg:hidden" : ""}`}
        >
          <Link
            href="/BrowseFleet"
            className="group inline-flex items-center gap-2 rounded-lg bg-red-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/30"
          >
            <Search size={18} />
            Browse Cars
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Stats Section */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <HeroStatCard delay={0}>
              <Car className="text-red-500" size={24} />
              <div>
                <span className="text-2xl font-bold">
                  {stats?.vehicles?.value}
                </span>
                <p className="text-sm text-gray-500">
                  {stats?.vehicles?.label}
                </p>
              </div>
            </HeroStatCard>

            <HeroStatCard delay={0.08}>
              <Calendar className="text-red-500" size={24} />
              <div>
                <span className="text-2xl font-bold">
                  {stats?.booking?.value}
                </span>
                <p className="text-sm text-gray-500">{stats?.booking?.label}</p>
              </div>
            </HeroStatCard>

            <HeroStatCard delay={0.16}>
              <Star className="text-yellow-500" size={24} />
              <div>
                <span className="text-2xl font-bold">
                  {stats?.rating?.value}
                </span>
                <p className="text-sm text-gray-500">{stats?.rating?.label}</p>
              </div>
            </HeroStatCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
