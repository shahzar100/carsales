import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Phone,
  CheckCircle,
  Clock,
  FileText,
  Car,
  AlertTriangle,
  Camera,
  Scale,
  Truck,
  Wrench,
  Heart,
} from "lucide-react";
import { ProcessFlow, BlackRedSection } from "@/components/Services/Common";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

const businessName =
  process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing";

export const metadata: Metadata = {
  title: `Accident Claims — ${businessName}`,
  description:
    "Expert accident claim management and support. We handle insurance claims, arrange repairs, provide courtesy vehicles, and guide you every step of the way.",
  alternates: { canonical: "/AccidentClaims" },
  openGraph: {
    title: `Accident Claims — ${businessName}`,
    description:
      "Expert accident claim management — from the scene to full repair. We handle everything so you don't have to.",
    url: "/AccidentClaims",
  },
};

export default async function AccidentClaims() {
  const businessInfo = await getBusinessInfo();

  const name = businessInfo.businessName;
  const phone = businessInfo.phone;
  const email = businessInfo.email;

  const claimServices = [
    {
      icon: FileText,
      title: "Full Claims Management",
      description:
        "We handle your entire insurance claim from start to finish — liaising with insurers, loss adjusters, and third parties on your behalf so you can focus on what matters.",
    },
    {
      icon: Car,
      title: "Courtesy Vehicle",
      description:
        "Need to stay on the road? We can arrange a like-for-like courtesy vehicle while your car is being repaired, at no extra cost for non-fault claims.",
    },
    {
      icon: Wrench,
      title: "Professional Repairs",
      description:
        "Our skilled technicians carry out high-quality bodywork, mechanical, and paintwork repairs to restore your vehicle to its pre-accident condition.",
    },
    {
      icon: Camera,
      title: "Damage Assessment",
      description:
        "Comprehensive vehicle inspection and photographic documentation to accurately assess all damage and ensure nothing is missed on your claim.",
    },
    {
      icon: Scale,
      title: "Uninsured Loss Recovery",
      description:
        "Recover excess payments, loss of earnings, travel expenses, and other out-of-pocket costs through our specialist recovery service.",
    },
    {
      icon: Truck,
      title: "Vehicle Recovery",
      description:
        "24/7 accident vehicle recovery from the scene. We'll safely transport your vehicle to our workshop for assessment and repair.",
    },
  ];

  const claimProcess = [
    {
      step: 1,
      title: "Report the Incident",
      description:
        "Call us straight after the accident with details of what happened",
    },
    {
      step: 2,
      title: "We Take Over",
      description:
        "We contact your insurer, arrange recovery, and start the claim",
    },
    {
      step: 3,
      title: "Damage Assessed",
      description:
        "Full vehicle inspection and repair estimate prepared for approval",
    },
    {
      step: 4,
      title: "Expert Repair",
      description:
        "Professional repairs carried out while you drive a courtesy car",
    },
    {
      step: 5,
      title: "Back on the Road",
      description:
        "Quality-checked and returned to you in pre-accident condition",
    },
  ];

  const faultTypes = [
    {
      title: "Non-Fault Accidents",
      description:
        "If you weren't at fault, we manage your claim at no cost to you. We recover all costs from the at-fault party's insurer, protecting your no-claims bonus.",
      features: [
        "No cost to you",
        "No-claims bonus protected",
        "Like-for-like courtesy vehicle",
        "Full uninsured loss recovery",
      ],
    },
    {
      title: "At-Fault Accidents",
      description:
        "Even if you were at fault, we'll guide you through the process, negotiate with your insurer, and ensure your vehicle is repaired to the highest standard.",
      features: [
        "Insurance liaison handled",
        "Professional repair guarantee",
        "Competitive repair pricing",
        "Clear communication throughout",
      ],
    },
    {
      title: "Split Liability",
      description:
        "When fault is shared, claims can be complex. Our experienced team navigates these situations to minimise your costs and maximise your recovery.",
      features: [
        "Expert fault negotiation",
        "Cost minimisation strategy",
        "Detailed evidence gathering",
        "Partial cost recovery",
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute -top-32 right-0 h-125 w-125 rounded-full bg-red-600/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-80 w-80 rounded-full bg-red-600/3 blur-3xl" />

        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm text-red-400">
              <Shield size={14} />
              Expert Claims Management
            </div>

            <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Accident{" "}
              <span className="bg-linear-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                Claims
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
              Been in an accident? We take the stress out of the claims process.
              From roadside recovery to full vehicle repair, we handle
              everything so you can get back to normal.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
              >
                <Phone size={18} />
                Call Now: {phone}
              </a>
              <Link
                href="/Enquiry"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
              >
                Make an Enquiry
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── What We Handle ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold tracking-widest text-red-600 uppercase">
                Our Services
              </p>
              <h2 className="section-title mb-4">Complete Accident Support</h2>
              <p className="description mx-auto max-w-2xl text-gray-600">
                We provide end-to-end accident claims management, taking care of
                every detail from the moment you call us.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {claimServices.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.title}
                    className="group rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all duration-200 hover:border-red-100 hover:shadow-lg"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                      <Icon size={24} />
                    </div>
                    <h3 className="heading-4 mb-2">{service.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {service.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Claims Process ─── */}
      <BlackRedSection>
        <ProcessFlow
          title="How the Claims Process Works"
          steps={claimProcess}
          dark
        />
      </BlackRedSection>

      {/* ─── Fault Types ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold tracking-widest text-red-600 uppercase">
                We Cover All Scenarios
              </p>
              <h2 className="section-title mb-4">Whatever the Circumstances</h2>
              <p className="description mx-auto max-w-2xl text-gray-600">
                Whether the accident was your fault or not, our team has the
                expertise to manage your claim effectively.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {faultTypes.map((type) => (
                <div
                  key={type.title}
                  className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-200 hover:shadow-lg"
                >
                  <h3 className="heading-3 mb-3">{type.title}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-gray-600">
                    {type.description}
                  </p>
                  <ul className="space-y-3">
                    {type.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <CheckCircle
                          size={16}
                          className="mt-0.5 shrink-0 text-red-500"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Choose Us ─── */}
      <BlackRedSection>
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Why Choose {name} for Your Claim?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-gray-400">
            With years of experience handling accident claims, we know exactly
            how to get you the best outcome.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Clock,
                title: "Fast Response",
                desc: "We start working on your claim within hours of your call",
              },
              {
                icon: Shield,
                title: "No Hidden Costs",
                desc: "Non-fault claims are handled at zero cost to you",
              },
              {
                icon: Heart,
                title: "Stress-Free",
                desc: "We handle all the paperwork and insurer negotiations",
              },
              {
                icon: CheckCircle,
                title: "Repair Guarantee",
                desc: "All repairs backed by our comprehensive quality guarantee",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white">
                    <Icon size={24} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </BlackRedSection>

      {/* ─── What To Do After An Accident ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold tracking-widest text-red-600 uppercase">
                Helpful Guide
              </p>
              <h2 className="section-title mb-4">
                What To Do After an Accident
              </h2>
              <p className="description mx-auto max-w-2xl text-gray-600">
                Stay calm and follow these steps to protect yourself and your
                claim.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: AlertTriangle,
                  title: "Ensure Safety First",
                  description:
                    "Check for injuries, move to a safe position if possible, and turn on your hazard lights. Call 999 if anyone is hurt.",
                },
                {
                  icon: Camera,
                  title: "Document Everything",
                  description:
                    "Take photos of all vehicles, damage, road conditions, and any relevant road signs or markings. Note the time and location.",
                },
                {
                  icon: FileText,
                  title: "Exchange Details",
                  description:
                    "Get the other driver's name, address, phone number, insurance details, and registration number. Note any witnesses.",
                },
                {
                  icon: Phone,
                  title: "Call Us",
                  description: `Contact ${name} on ${phone} as soon as possible. We'll arrange vehicle recovery if needed and start your claim immediately.`,
                },
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="heading-4 mb-1 flex items-center gap-2">
                        <Icon size={18} className="text-red-500" />
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="bg-black py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Need Help With a Claim?
            </h2>
            <p className="mb-8 text-lg text-gray-400">
              Get in touch today — our claims team is ready to help you get back
              on the road.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
              >
                <Phone size={18} />
                {phone}
              </a>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
