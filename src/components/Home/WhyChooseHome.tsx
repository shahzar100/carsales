import Link from "next/link";
import {
  ShieldCheck,
  CalendarCheck,
  Clock,
  Star,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

/**
 * Homepage "Why choose our car viewing service?" section — the dark,
 * stat-led redesign from the Morley Motors design bundle. Replaces the old
 * white four-card features grid. Each card links to the relevant part of
 * the site; the bottom rail carries the closing Book a Viewing CTA.
 */

interface Feature {
  title: string;
  body: string;
  icon: LucideIcon;
  stat: string;
  statLabel: string;
  href: string;
}

const FEATURES: Feature[] = [
  {
    title: "Quality Vehicles",
    body: "Every car on our forecourt is inspected, history-checked, and HPI-cleared before listing.",
    icon: ShieldCheck,
    stat: "120+",
    statLabel: "Vehicles",
    href: "/BrowseFleet",
  },
  {
    title: "Easy Booking",
    body: "Book a viewing online in under 60 seconds. Reschedule any time — no calls, no queues.",
    icon: CalendarCheck,
    stat: "60s",
    statLabel: "To book",
    href: "/Book",
  },
  {
    title: "No Pressure",
    body: "Take your time. No commission-driven sales tactics — just the keys, a coffee, and the open road.",
    icon: Clock,
    stat: "0",
    statLabel: "Hard sells",
    href: "/AboutUs",
  },
  {
    title: "Expert Advice",
    body: "Our team has driven, owned, and serviced the lot. Ask anything — even what we'd buy ourselves.",
    icon: Star,
    stat: "4.9",
    statLabel: "Avg rating",
    href: "/contact",
  },
];

export default function WhyChooseHome() {
  return (
    <section className="border-t border-white/[0.06] bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-red-400 uppercase">
            <span className="inline-block h-px w-8 bg-red-500/60" />
            The Morley Difference
          </div>
          <h2 className="mt-4 text-[34px] leading-[1.1] font-bold tracking-tight text-white sm:text-[42px]">
            Why choose our car
            <br className="hidden sm:block" /> viewing service?
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-gray-400">
            We make car buying simple, transparent, and convenient with our
            professional viewing service — backed by 25+ years on the road in
            Leeds.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.title}
                href={f.href}
                className="group relative flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
                    <Icon size={22} />
                  </span>
                  <div className="text-right">
                    <div className="text-[20px] leading-none font-extrabold tracking-tight text-white">
                      {f.stat}
                    </div>
                    <div className="mt-1 text-[10.5px] tracking-[0.14em] text-gray-500 uppercase">
                      {f.statLabel}
                    </div>
                  </div>
                </div>
                <h3 className="mt-6 text-[17px] font-bold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-gray-400">
                  {f.body}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-4">
                  <span className="text-[12px] font-medium text-gray-500 transition-colors group-hover:text-gray-300">
                    Learn more
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] text-gray-400 transition-colors group-hover:border-red-500 group-hover:bg-red-500 group-hover:text-white">
                    <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Closing CTA rail */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-linear-to-r from-red-600/[0.08] via-white/[0.02] to-transparent px-6 py-5">
          <div>
            <div className="text-[15px] font-semibold text-white">
              Ready to take one for a spin?
            </div>
            <div className="mt-0.5 text-[13px] text-gray-400">
              Book a viewing in under a minute — 7 days a week.
            </div>
          </div>
          <Link
            href="/Book"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-red-600 px-5 text-[13.5px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(220,38,38,0.6)] transition-colors hover:bg-red-700"
          >
            Book a Viewing
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
