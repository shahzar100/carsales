import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  HelpCircle,
  Phone,
  Mail,
  Car,
  Wrench,
  Shield,
  CreditCard,
  Clock,
  Truck,
  MessageSquare,
} from "lucide-react";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import FAQAccordion from "@/components/Helpful/FAQAccordion";

const businessName =
  process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing";

export const metadata: Metadata = {
  title: `FAQ — ${businessName}`,
  description:
    "Frequently asked questions about buying cars, car services, accident claims, breakdown recovery, and more.",
  alternates: { canonical: "/FAQ" },
  openGraph: {
    title: `FAQ — ${businessName}`,
    description:
      "Find answers to common questions about our vehicles, services, and processes.",
    url: "/FAQ",
  },
};

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  icon: React.ElementType;
  title: string;
  items: FAQItem[];
}

export default async function FAQ() {
  const businessInfo = await getBusinessInfo();

  const phone = businessInfo.phone;
  const email = businessInfo.email;

  const faqCategories: FAQCategory[] = [
    {
      icon: Car,
      title: "Buying a Vehicle",
      items: [
        {
          question: "How do I arrange a viewing?",
          answer: `You can book a viewing directly through our website by visiting the vehicle's page and selecting a convenient date and time. Alternatively, give us a call on ${phone} and we'll arrange it for you.`,
        },
        {
          question: "Can I test drive before buying?",
          answer:
            "Absolutely! We encourage test drives on all our vehicles. Simply book a viewing and let us know you'd like a test drive when you arrive. You'll need a valid driving licence and insurance.",
        },
        {
          question: "Do you offer finance?",
          answer:
            "We can discuss finance options and point you in the right direction for car finance providers. Contact us for more details about the options available for your chosen vehicle.",
        },
        {
          question: "Can I part-exchange my current vehicle?",
          answer:
            "Yes, we consider part-exchanges on a case-by-case basis. Bring your vehicle along when you visit or contact us with your car's details for an initial assessment.",
        },
        {
          question: "Are your vehicles inspected before sale?",
          answer:
            "Every vehicle in our collection undergoes a thorough mechanical inspection and is serviced before being made available. We're committed to selling only quality vehicles you can trust.",
        },
        {
          question: "What's included in the price?",
          answer:
            "Our prices include the vehicle as described, a pre-sale inspection, and any work needed to bring it to our standards. Road tax, insurance, and registration transfer are the buyer's responsibility.",
        },
      ],
    },
    {
      icon: Wrench,
      title: "Services & Repairs",
      items: [
        {
          question: "What services do you offer?",
          answer:
            "We offer professional car detailing (from a mini valet to a full correction detail), window tinting with premium films, and expert mechanical and bodywork repairs.",
        },
        {
          question: "How do I book a service?",
          answer:
            "You can book any service through our website on the Services page, or call us to arrange a convenient appointment. We aim to accommodate same-day bookings where possible.",
        },
        {
          question: "How long does detailing take?",
          answer:
            "Depending on the package, detailing takes between 2-3 hours for our Bronze mini valet up to 2+ days for our Platinum correction detail. We'll confirm the timeframe when you book.",
        },
        {
          question: "Is window tinting legal?",
          answer:
            "Yes, when done within legal limits. UK law requires front windscreen to allow at least 75% of light through, and front side windows at least 70%. Rear windows have no legal limit. We'll advise on all legal options.",
        },
        {
          question: "Do you provide a warranty on repairs?",
          answer:
            "All our repair work is backed by a quality guarantee. The specific terms depend on the type of repair — our team will explain the warranty details before any work begins.",
        },
      ],
    },
    {
      icon: Truck,
      title: "Breakdown Recovery",
      items: [
        {
          question: "Is your recovery service available 24/7?",
          answer:
            "Yes, our breakdown recovery operates 24 hours a day, 7 days a week, 365 days a year. Wherever you are, whenever you need us, we'll be there.",
        },
        {
          question: "What areas do you cover?",
          answer:
            "We cover the local area and surrounding regions. For exact coverage and pricing based on distance, please check our Recoveries page or call us directly.",
        },
        {
          question: "How quickly can you get to me?",
          answer:
            "We aim to reach you as fast as possible. Response times vary based on location and demand, but we always prioritise getting to you quickly and safely.",
        },
        {
          question: "What types of breakdown do you assist with?",
          answer:
            "We handle emergency towing, jump starts, flat tyre repair, lockouts, fuel delivery, and on-the-spot diagnostics. If we can fix it roadside, we will.",
        },
      ],
    },
    {
      icon: Shield,
      title: "Accident Claims",
      items: [
        {
          question: "What should I do after an accident?",
          answer: `First, ensure everyone is safe. Then document the scene with photos, exchange details with the other driver, and call us on ${phone}. We'll take care of the rest — from vehicle recovery to the entire claims process.`,
        },
        {
          question: "Will it cost me anything?",
          answer:
            "For non-fault claims, our service is completely free. We recover all costs from the at-fault party's insurer. For at-fault claims, we work to minimise your costs wherever possible.",
        },
        {
          question: "Will my no-claims bonus be affected?",
          answer:
            "For non-fault claims that we manage, your no-claims bonus should be protected as we pursue the at-fault party directly. We'll advise you on your specific situation.",
        },
        {
          question: "Can you provide a courtesy car?",
          answer:
            "Yes — for non-fault claims, we can typically arrange a like-for-like courtesy vehicle at no cost to you while your car is being repaired.",
        },
      ],
    },
    {
      icon: CreditCard,
      title: "Payments & Booking",
      items: [
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept bank transfer, debit cards, and cash. For vehicle purchases, we recommend bank transfer for security. Specific payment options are confirmed at the time of booking.",
        },
        {
          question: "Can I cancel or reschedule a booking?",
          answer:
            "Yes, you can manage your booking through the Track Booking page on our website using your booking reference. Alternatively, call us and we'll update it for you.",
        },
        {
          question: "How do I track my booking?",
          answer:
            "Visit our Track Booking page and enter your booking reference number. You'll find your reference in the confirmation email sent when you made your booking.",
        },
      ],
    },
    {
      icon: Clock,
      title: "General",
      items: [
        {
          question: "Where are you located?",
          answer: `We're located at ${businessInfo.address}, ${businessInfo.city}. You can find directions on our Contact page or click the address in our footer to open Google Maps.`,
        },
        {
          question: "What are your opening hours?",
          answer: `We're open Monday to Friday ${businessInfo.hours.monday}, Saturday ${businessInfo.hours.saturday}, and ${businessInfo.hours.sunday === "Closed" ? "closed on Sunday" : `Sunday ${businessInfo.hours.sunday}`}. For breakdowns, we're available 24/7.`,
        },
        {
          question: "How do I get in touch?",
          answer: `You can call us on ${phone}, email ${email}, or visit our Contact page. We aim to respond to all enquiries within 24 hours.`,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute -top-32 right-0 h-125 w-125 rounded-full bg-red-600/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-80 w-80 rounded-full bg-red-600/3 blur-3xl" />

        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm text-red-400">
              <HelpCircle size={14} />
              Frequently Asked Questions
            </div>

            <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
              How Can We{" "}
              <span className="bg-linear-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                Help?
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
              Find answers to the most common questions about our vehicles,
              services, and processes below.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FAQ Categories ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-12">
              {faqCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.title}>
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <Icon size={22} />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                        {category.title}
                      </h2>
                    </div>
                    <FAQAccordion items={category.items} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Still Have Questions CTA ─── */}
      <section className="bg-black py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center sm:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex items-center justify-center gap-2 text-red-400">
              <MessageSquare size={20} />
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Still Have Questions?
            </h2>
            <p className="mb-8 text-lg text-gray-400">
              Can&apos;t find what you&apos;re looking for? Our team is always
              happy to help with any questions you might have.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
              >
                <Phone size={18} />
                {phone}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
              >
                <Mail size={18} />
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
